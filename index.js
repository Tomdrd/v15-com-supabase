const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = supabase.createClient(SU, SK);

// Sem emojis nas labels de categoria
const CL = {
  todos:     'Todos',
  religioso: 'Religioso',
  cultura:   'Cultura',
  historico: 'Histórico',
  natureza:  'Natureza',
  lazer:     'Lazer'
};

let SPOTS = [], map, cat = 'todos', q = '', markers = {}, uMk = null, uLat = null, uLng = null;

const mr = r => ({
  id: r.id, name: r.name, cat: r.cat, color: r.color,
  lat: r.lat, lng: r.lng, desc: r.description, address: r.address,
  horario: r.horario, entrada: r.entrada, photo: r.photo,
  type: r.type || 'spot',
  eventDate: r.event_date || null,
  eventEnd:  r.event_end  || null,
  blogTitle: r.blog_title, blogContent: r.blog_content,
  blogAuthor: r.blog_author, blogDate: r.blog_date
});

async function loadSpots() {
  const { data } = await supa.from('spots').select('*').order('created_at', { ascending: true });
  SPOTS = (data || []).map(mr);
}
const gs = () => SPOTS;

function startRT() {
  supa.channel('mt').on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, async () => {
    await loadSpots(); refreshM(); buildList();
  }).subscribe();
}

/* ── MAP ────────────────────────────────── */
function initMap() {
  map = L.map('map', { center: [-3.688, -40.3497], zoom: 14 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OSM © CARTO', maxZoom: 19, subdomains: 'abcd'
  }).addTo(map);
  buildList(); placeM();
  setTimeout(() => {
    const b = Object.values(markers).map(m => m.getLatLng());
    if (b.length) map.fitBounds(L.latLngBounds(b).pad(.15));
  }, 300);
  map.on('click', () => closeDetail());
}

// Marcador: gota colorida com ponto branco central — sem emoji
const mkIco = (s, a = false) => {
  const z = a ? 50 : 42;
  return L.divIcon({
    html: `<div style="
      width:${z}px;height:${z}px;
      background:${s.color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 14px rgba(0,0,0,.5)${a ? ',0 0 0 3px rgba(200,135,26,.9)' : ''};
      border:2px solid rgba(255,255,255,.3)">
        <div style="
          width:${a ? 10 : 8}px;height:${a ? 10 : 8}px;
          background:rgba(255,255,255,.9);
          border-radius:50%;
          transform:rotate(45deg)">
        </div>
    </div>`,
    className: '', iconSize: [z, z], iconAnchor: [z / 2, z], popupAnchor: [0, -z]
  });
};

const mkPopup = s => `
  <div class="pp-title">${s.name}</div>
  <div class="pp-sub">${CL[s.cat] || s.cat}</div>
  <button class="pp-btn" onclick="openD('${s.id}')">Ver detalhes</button>`;

function placeM() {
  gs().forEach((s, i) => {
    const m = L.marker([s.lat, s.lng], { icon: mkIco(s) });
    m.bindPopup(mkPopup(s), { maxWidth: 210 });
    m.on('click', () => { openD(s.id); hlCard(s.id); });
    setTimeout(() => { m.addTo(map); markers[s.id] = m; }, i * 70);
  });
  updCnt();
}

function refreshM() {
  const ids = new Set(gs().map(s => s.id));
  Object.keys(markers).forEach(id => {
    if (!ids.has(id)) { if (map.hasLayer(markers[id])) markers[id].remove(); delete markers[id]; }
  });
  gs().forEach((s, i) => {
    if (!markers[s.id]) {
      const m = L.marker([s.lat, s.lng], { icon: mkIco(s) });
      m.bindPopup(mkPopup(s), { maxWidth: 210 });
      m.on('click', () => { openD(s.id); hlCard(s.id); });
      setTimeout(() => { if (map) { m.addTo(map); markers[s.id] = m; } }, i * 40);
    }
  });
  updCnt();
}

/* ── LIST ───────────────────────────────── */
function buildList() {
  const sl = document.getElementById('spotsList');
  const f = gs().filter(s => {
    const catOk = cat === 'todos' ? true : cat === 'eventos' ? s.type === 'event' : (s.cat === cat && s.type !== 'event');
    return catOk && s.name.toLowerCase().includes(q.toLowerCase());
  });
  if (uLat !== null) f.sort((a, b) => d(uLat, uLng, a.lat, a.lng) - d(uLat, uLng, b.lat, b.lng));
  if (!f.length) { sl.innerHTML = '<div class="no-res">Nenhum ponto encontrado</div>'; updCnt(0); return; }
  sl.innerHTML = f.map((s, i) => `
    <div class="sc" id="card-${s.id}" onclick="focusSpot('${s.id}')" style="animation-delay:${i * 35}ms">
      <div class="sc-thumb" style="background:${s.color}22">
        ${s.photo
          ? `<img src="${s.photo}" alt="${s.name}" loading="lazy">`
          : `<div class="sc-ph" style="background:${s.color}22;color:${s.color}">${s.name.charAt(0)}</div>`}
      </div>
      <div class="sc-body">
        <div class="sc-ic" style="background:${s.color}22">
          <div class="sc-dot" style="background:${s.color}"></div>
        </div>
        <div class="sc-info">
          <div class="sc-name">${s.name}</div>
          <div class="sc-tag">${CL[s.cat] || s.cat}${s.type === 'event' && s.eventDate ? ' · ' + fmtEvtDate(s.eventDate, s.eventEnd) : ''}</div>
        </div>
        ${uLat !== null ? `<div class="sc-dist">${fd(d(uLat, uLng, s.lat, s.lng))}</div>` : ''}
      </div>
    </div>`).join('');
  updCnt(f.length);
  gs().forEach(s => {
    if (!markers[s.id]) return;
    if (f.find(x => x.id === s.id)) { if (!map.hasLayer(markers[s.id])) markers[s.id].addTo(map); }
    else { if (map.hasLayer(markers[s.id])) markers[s.id].remove(); }
  });
}

function focusSpot(id) {
  const s = gs().find(x => x.id === id); if (!s) return;
  map.flyTo([s.lat, s.lng], 17, { duration: 1.2 });
  setTimeout(() => { if (markers[id]) markers[id].openPopup(); }, 1300);
  openD(id); hlCard(id); closeSbMob();
}

function openD(id) {
  const s = gs().find(x => String(x.id) === String(id)); if (!s) return;
  document.getElementById('dpPhoto').innerHTML = s.photo
    ? `<img src="${s.photo}" alt="${s.name}">`
    : `<div class="dp-ph" style="background:${s.color}22;color:${s.color}">${s.name.charAt(0)}</div>`;
  document.getElementById('dpTitle').textContent = s.name;
  const ce = document.getElementById('dpCat');
  ce.textContent = CL[s.cat] || s.cat;
  ce.style.cssText = `background:${s.color}33;color:${s.color};border:1px solid ${s.color}66`;
  document.getElementById('dpDesc').textContent = s.desc;
  const evtBadge = s.type === 'event'
    ? `<div style="background:rgba(200,135,26,.15);border:1px solid rgba(200,135,26,.4);border-radius:6px;padding:6px 12px;margin:8px 0;font-size:13px;color:#C8871A;display:inline-flex;align-items:center;gap:6px">
        <i data-lucide="calendar" class="icon-xs"></i>
        <strong>${fmtEvtDate(s.eventDate, s.eventEnd)}</strong>
       </div>`
    : '';
  document.getElementById('dpEvtBadge').innerHTML = evtBadge;
  const ds = uLat !== null ? `<span><i data-lucide="ruler" class="icon-xs"></i> <strong>${fd(d(uLat, uLng, s.lat, s.lng))}</strong></span>` : '';
  document.getElementById('dpMeta').innerHTML = `
    ${s.address ? `<span><i data-lucide="map-pin" class="icon-xs"></i> <strong>${s.address}</strong></span>` : ''}
    ${s.horario  ? `<span><i data-lucide="clock"   class="icon-xs"></i> <strong>${s.horario}</strong></span>`  : ''}
    ${s.entrada  ? `<span><i data-lucide="ticket"  class="icon-xs"></i> <strong>${s.entrada}</strong></span>`  : ''}
    ${ds}`;
  document.getElementById('dpLink').href = `sobral_post.html?id=${s.id}`;
  document.getElementById('dp').classList.add('open');
  document.getElementById('stbar').classList.add('hidden');
  lucide.createIcons();
  renderReactionBtns(s.id);
}

function closeDetail() {
  document.getElementById('dp').classList.remove('open');
  document.getElementById('stbar').classList.remove('hidden');
}
function hlCard(id) {
  document.querySelectorAll('.sc').forEach(c => c.classList.remove('active'));
  const c = document.getElementById('card-' + id);
  if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ── GEO ────────────────────────────────── */
function getUserLocation() {
  if (!navigator.geolocation) { toast('Geolocalização não suportada.', true); return; }
  const btn = document.getElementById('btnGeo');
  if (btn) btn.classList.add('locating');
  navigator.geolocation.getCurrentPosition(p => {
    uLat = p.coords.latitude; uLng = p.coords.longitude;
    if (btn) { btn.classList.remove('locating'); btn.style.background = '#1B6B6B'; }
    if (uMk) uMk.remove();
    uMk = L.marker([uLat, uLng], {
      icon: L.divIcon({ html: '<div class="user-dot"></div>', className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
    }).addTo(map);
    uMk.bindPopup('<div class="pp-title">Você está aqui</div>');
    map.flyTo([uLat, uLng], 15, { duration: 1.5 });
    document.getElementById('stGeo').style.display = 'flex';
    toast('Localizado! Lista ordenada por proximidade.');
    buildList();
  }, e => {
    if (btn) btn.classList.remove('locating');
    toast(e.code === 1 ? 'Permissão negada.' : 'Erro ao localizar.', true);
  }, { timeout: 10000, enableHighAccuracy: true });
}

/* ── FILTERS ────────────────────────────── */
function setCat(c) {
  cat = c;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === c));
  buildList();
}
function filterSpots() { q = document.getElementById('searchInput').value; buildList(); }

function fmtEvtDate(start, end) {
  const fmt = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : null;
  const s = fmt(start), e = fmt(end);
  return (s && e) ? `${s} → ${e}` : (s || 'Data a confirmar');
}

/* ── DRAWER / SIDEBAR ───────────────────── */
function toggleDrw() { ['hbg', 'drw', 'dov'].forEach(id => document.getElementById(id).classList.toggle('open')); }
function closeDrw()  { ['hbg', 'drw', 'dov'].forEach(id => document.getElementById(id).classList.remove('open')); }
function toggleSbMob() {
  document.getElementById('sb').classList.toggle('mob-open');
  document.getElementById('sbBack').style.display = document.getElementById('sb').classList.contains('mob-open') ? 'block' : 'none';
}
function closeSbMob() {
  document.getElementById('sb').classList.remove('mob-open');
  document.getElementById('sbBack').style.display = 'none';
}

/* ── UTILS ──────────────────────────────── */
function d(a, b, c, e) {
  const R = 6371e3, dL = (c - a) * Math.PI / 180, dN = (e - b) * Math.PI / 180,
    x = Math.sin(dL / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function fd(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m / 1e3).toFixed(1)}km`; }
function updCnt(n) { document.getElementById('cntVis').textContent = n !== undefined ? n : gs().length; }
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  setTimeout(() => t.className = 'toast' + (err ? ' err' : ''), 3800);
}

/* ── AUTH ───────────────────────────────── */
let CUR_USER = null, CUR_REACTIONS = [];

async function initAuth() {
  const { data: { session } } = await supa.auth.getSession();
  CUR_USER = session?.user || null;
  renderAuthChip();
  if (CUR_USER) await loadUserReactions();
}

function renderAuthChip() {
  const chip = document.getElementById('authChip');
  const drawerSection = document.getElementById('drawerAuthSection');
  if (!chip) return;
  if (CUR_USER) {
    const av   = CUR_USER.user_metadata?.avatar_url || CUR_USER.user_metadata?.picture || '';
    const name = CUR_USER.user_metadata?.full_name  || CUR_USER.email?.split('@')[0]    || 'Eu';
    chip.innerHTML = `
      <a href="sobral_perfil.html" class="user-chip">
        <div class="uc-av">${av ? `<img src="${av}" alt="">` : name.charAt(0).toUpperCase()}</div>
        <span>${name.split(' ')[0]}</span>
      </a>`;
    if (drawerSection) drawerSection.innerHTML = `
      <a href="sobral_perfil.html" class="drw-lnk">
        <div class="drw-ic"><i data-lucide="user"></i></div> Meu Perfil
      </a>
      <a href="sobral_submeter.html" class="drw-lnk">
        <div class="drw-ic"><i data-lucide="plus"></i></div> Sugerir Ponto ou Evento
      </a>
      <button class="drw-lnk" onclick="logoutMap();closeDrw()">
        <div class="drw-ic"><i data-lucide="log-out"></i></div> Sair
      </button>`;
  } else {
    chip.innerHTML = `<a href="sobral_login.html?redirect=/" class="btn-login">Entrar</a>`;
    if (drawerSection) drawerSection.innerHTML = `
      <a href="sobral_login.html?redirect=/" class="drw-lnk">
        <div class="drw-ic"><i data-lucide="user"></i></div> Entrar / Criar Conta
      </a>`;
  }
  lucide.createIcons();
}

async function logoutMap() {
  await supa.auth.signOut();
  CUR_USER = null; CUR_REACTIONS = [];
  renderAuthChip();
  toast('Sessão encerrada.');
}

async function loadUserReactions() {
  if (!CUR_USER) { CUR_REACTIONS = []; return; }
  const { data } = await supa.from('reactions').select('*').eq('user_id', CUR_USER.id);
  CUR_REACTIONS = data || [];
}

/* ── REACTIONS ──────────────────────────── */
async function renderReactionBtns(spotId) {
  const el = document.getElementById('rxnBtns');
  if (!el) return;
  const { data: counts } = await supa.from('reactions').select('reaction').eq('spot_id', String(spotId));
  const likeCount  = (counts || []).filter(r => r.reaction === 'like').length;
  const beenCount  = (counts || []).filter(r => r.reaction === 'been').length;
  const goingCount = (counts || []).filter(r => r.reaction === 'going').length;
  const myLike  = CUR_REACTIONS.find(r => r.spot_id === String(spotId) && r.reaction === 'like');
  const myBeen  = CUR_REACTIONS.find(r => r.spot_id === String(spotId) && r.reaction === 'been');
  const myGoing = CUR_REACTIONS.find(r => r.spot_id === String(spotId) && r.reaction === 'going');

  if (!CUR_USER) {
    el.innerHTML = `<div style="font-size:11.5px;color:rgba(245,237,216,.4)">
      <a href="sobral_login.html?redirect=/" style="color:var(--ochre)">Entre</a> para curtir e marcar pontos
    </div>`;
    return;
  }

  el.innerHTML = `
    <button class="rxn-btn ${myLike  ? 'active-like'  : ''}" onclick="toggleReaction('${spotId}','like')"  title="Gostei">
      <i data-lucide="heart"    class="icon-sm"></i>
      <span>Gostei</span>${likeCount  > 0 ? `<span class="rxn-count">${likeCount}</span>`  : ''}
    </button>
    <button class="rxn-btn ${myBeen  ? 'active-been'  : ''}" onclick="toggleReaction('${spotId}','been')"  title="Eu Fui">
      <i data-lucide="check"    class="icon-sm"></i>
      <span>Eu Fui</span>${beenCount  > 0 ? `<span class="rxn-count">${beenCount}</span>`  : ''}
    </button>
    <button class="rxn-btn ${myGoing ? 'active-going' : ''}" onclick="toggleReaction('${spotId}','going')" title="Eu Vou">
      <i data-lucide="calendar" class="icon-sm"></i>
      <span>Eu Vou</span>${goingCount > 0 ? `<span class="rxn-count">${goingCount}</span>` : ''}
    </button>`;
  lucide.createIcons();
}

async function toggleReaction(spotId, reaction) {
  if (!CUR_USER) { toast('Entre para reagir aos pontos!', true); return; }
  const existing = CUR_REACTIONS.find(r => r.spot_id === String(spotId) && r.reaction === reaction);
  if (existing) {
    await supa.from('reactions').delete().eq('id', existing.id);
    CUR_REACTIONS = CUR_REACTIONS.filter(r => r.id !== existing.id);
    toast(reaction === 'like' ? 'Gostei removido' : reaction === 'been' ? 'Eu Fui removido' : 'Eu Vou removido');
  } else {
    const { data } = await supa.from('reactions').insert({
      user_id: CUR_USER.id, spot_id: String(spotId), reaction, spot_type: 'spot'
    }).select().single();
    if (data) CUR_REACTIONS.push(data);
    toast(reaction === 'like' ? 'Gostei!' : reaction === 'been' ? 'Marcado como Eu Fui!' : 'Marcado como Eu Vou!');
  }
  renderReactionBtns(spotId);
}

/* ── BOOT ───────────────────────────────── */
window.addEventListener('load', async () => {
  await loadSpots();
  initMap();
  startRT();
  initAuth();
  lucide.createIcons();
  const l = document.getElementById('loading');
  l.classList.add('fade');
  setTimeout(() => l.remove(), 700);
});
