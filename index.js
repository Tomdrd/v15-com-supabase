const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = supabase.createClient(SU, SK);

const CL = { todos:'Todos', religioso:'Religioso', cultura:'Cultura', historico:'Histórico', natureza:'Natureza', lazer:'Lazer' };

// ── Ícone por categoria (Lucide) ─────────────────────────────────────────────
const CAT_ICON = {
  religioso: 'church',
  cultura:   'landmark',
  historico: 'castle',
  natureza:  'trees',
  lazer:     'ferris-wheel',
  eventos:   'calendar-days',
  event:     'calendar-days',
};

let SPOTS = [], map, cat = 'todos', q = '', markers = {}, uMk = null, uLat = null, uLng = null;
let _geoWatchId = null;
const GEO_PREF_KEY = 'sc_geo_persistent_enabled';
const GEO_LAST_KEY = 'sc_geo_last_position';

const mr = r => ({
  id: r.id, name: r.name, cat: r.cat, color: r.color,
  lat: r.lat, lng: r.lng, desc: r.description, address: r.address,
  horario: r.horario, entrada: r.entrada, photo: r.photo,
  type: r.type || 'spot',
  eventDate: r.event_date || null, eventEnd: r.event_end || null,
  isFeatured: !!r.is_featured,
  blogTitle: r.blog_title, blogContent: r.blog_content,
  blogAuthor: r.blog_author, blogDate: r.blog_date
});

async function loadSpots() {
  const { data, error } = await supa.from('spots').select('*').order('created_at', { ascending: true });
  if (error) { console.error('loadSpots:', error.message); toast('Erro ao carregar os pontos turísticos. Tente recarregar a página.', true); return false; }
  SPOTS = (data || []).map(mr);
  return true;
}
const gs = () => SPOTS;

function startRT() {
  supa.channel('mt').on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, async () => {
    await loadSpots(); refreshM(); buildList(); buildCarousel();
  }).subscribe();
}

/* ── MAP ────────────────────────────────────────────────────────────────── */
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
  map.on('click', () => closeDetail(false));

  // ── Deep link: abre painel se ?id=xxx na URL ──────────────────────────
  const urlId = new URLSearchParams(location.search).get('id');
  if (urlId) setTimeout(() => focusSpot(urlId), 600);
}

// ── Marcador com ícone Lucide SVG por categoria ───────────────────────────
const ICON_SVG = {
  church:        '<path d="M18 22V10l-6-8-6 8v12"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M10 6.5V4h4v2.5"/><path d="M12 4V2"/>',
  landmark:      '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  castle:        '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M2 11V9h4V7h4V5h4v2h4v2h4v2"/>',
  trees:         '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.6l-3-4a1 1 0 0 0-1.6 0l-3 4a1 1 0 0 0 .8 1.6H10"/>',
  'ferris-wheel':'<circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/>',
  'calendar-days':'<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
};

const mkIco = (s, active = false) => {
  const z = active ? 50 : 42;
  const iconKey = s.type === 'event' ? 'calendar-days' : (CAT_ICON[s.cat] || 'landmark');
  const svgPaths = ICON_SVG[iconKey] || ICON_SVG['landmark'];
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg);flex-shrink:0">${svgPaths}</svg>`;
  return L.divIcon({
    html: `<div style="width:${z}px;height:${z}px;background:${s.color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5)${active?',0 0 0 3px rgba(200,135,26,.9)':''};border:2px solid rgba(255,255,255,.3)">${iconSvg}</div>`,
    className: '', iconSize: [z, z], iconAnchor: [z/2, z], popupAnchor: [0, -z]
  });
};

const mkPopup = s => `<div class="pp-title">${s.name}</div><div class="pp-sub">${CL[s.cat] || s.cat}</div>`;

function placeM() {
  // Performance: todos os marcadores adicionados imediatamente sem delay escalonado
  gs().forEach(s => {
    const m = L.marker([s.lat, s.lng], { icon: mkIco(s) });
    m.bindPopup(mkPopup(s), { maxWidth: 210 });
    m.on('click', () => focusSpot(s.id));
    m.addTo(map);
    markers[s.id] = m;
  });
  updCnt();
}

function refreshM() {
  const ids = new Set(gs().map(s => s.id));
  Object.keys(markers).forEach(id => {
    if (!ids.has(id)) { if (map.hasLayer(markers[id])) markers[id].remove(); delete markers[id]; }
  });
  gs().forEach(s => {
    if (!markers[s.id]) {
      const m = L.marker([s.lat, s.lng], { icon: mkIco(s) });
      m.bindPopup(mkPopup(s), { maxWidth: 210 });
      m.on('click', () => focusSpot(s.id));
      if (map) { m.addTo(map); markers[s.id] = m; }
    }
  });
  updCnt();
}

/* ── LIST ───────────────────────────────────────────────────────────────── */
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
        ${s.photo ? `<img src="${s.photo}" alt="${s.name}" loading="lazy">` : `<div class="sc-ph" style="background:${s.color}22;color:${s.color}">${s.name.charAt(0)}</div>`}
      </div>
      <div class="sc-body">
        <div class="sc-ic" style="background:${s.color}22"><div class="sc-dot" style="background:${s.color}"></div></div>
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
  hideCarouselSmooth(() => {
    const flyDuration = prefersReducedMotion() ? 0.01 : 1.2;
    const popupDelay = prefersReducedMotion() ? 60 : 1300;
    map.flyTo([s.lat, s.lng], 17, { duration: flyDuration });
    setTimeout(() => { if (markers[id]) markers[id].openPopup(); }, popupDelay);
    openD(id); hlCard(id); closeSbMob();
  });
}

/* ── DETAIL PANEL (bottom sheet drag) ──────────────────────────────────── */
let _dpDragStartY = 0, _dpDragStartScroll = 0, _dpDragging = false;

function initDpDrag() {
  const dp = document.getElementById('dp');
  const handle = document.getElementById('dpHandle');
  if (!handle || !dp) return;

  handle.addEventListener('touchstart', e => {
    _dpDragStartY = e.touches[0].clientY;
    _dpDragging = true;
    dp.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    if (!_dpDragging) return;
    const dy = e.touches[0].clientY - _dpDragStartY;
    if (dy > 0) dp.style.transform = `translateY(${dy}px)`;
    else if (dy < -30) dp.classList.add('expanded');
  }, { passive: true });

  handle.addEventListener('touchend', e => {
    if (!_dpDragging) return;
    _dpDragging = false;
    dp.style.transition = '';
    const dy = e.changedTouches[0].clientY - _dpDragStartY;
    if (dy > 80) closeDetail();
    else dp.style.transform = '';
  });
}

function openD(id) {
  const s = gs().find(x => String(x.id) === String(id)); if (!s) return;

  // atualiza URL para compartilhamento sem recarregar a página
  history.replaceState(null, '', `?id=${id}`);

  const photoEl = document.getElementById('dpPhoto');
  photoEl.innerHTML = s.photo
    ? `<img src="${s.photo}" alt="${s.name}" loading="lazy">`
    : `<div class="dp-ph" style="background:${s.color}22;color:${s.color}">${s.name.charAt(0)}</div>`;
  photoEl.onclick = () => window.location.href = `sobral_post.html?id=${s.id}`;

  document.getElementById('dpTitle').textContent = s.name;
  const ce = document.getElementById('dpCat');
  ce.textContent = CL[s.cat] || s.cat;
  ce.style.cssText = `background:${s.color}33;color:${s.color};border:1px solid ${s.color}66`;
  document.getElementById('dpDesc').textContent = s.desc;

  const evtBadge = s.type === 'event'
    ? `<div style="background:rgba(200,135,26,.15);border:1px solid rgba(200,135,26,.4);border-radius:6px;padding:6px 12px;margin:8px 0;font-size:13px;color:#C8871A;display:inline-flex;align-items:center;gap:6px"><i data-lucide="calendar" class="icon-xs"></i><strong>${fmtEvtDate(s.eventDate, s.eventEnd)}</strong></div>`
    : '';
  document.getElementById('dpEvtBadge').innerHTML = evtBadge;

  // card enxuto: evita repetição com a página de post
  const ds = uLat !== null ? `<span><i data-lucide="ruler" class="icon-xs"></i> <strong>${fd(d(uLat, uLng, s.lat, s.lng))}</strong></span>` : '';
  document.getElementById('dpMeta').innerHTML = ds;

  document.getElementById('dpLink').href = `sobral_post.html?id=${s.id}`;

  // botão compartilhar
  document.getElementById('dpShare').onclick = () => shareSpot(s);

  const dp = document.getElementById('dp');
  dp.classList.remove('expanded');
  dp.style.transform = '';
  dp.classList.add('open');
  document.getElementById('stbar').classList.add('hidden');
  lucide.createIcons();
  // mostra o raio sempre que houver localização ativa (com ou sem login)
  showRadius(s.id);
  renderReactionBtns(s.id);
}

function closeDetail(showCarousel = true) {
  document.getElementById('dp').classList.remove('open', 'expanded');
  document.getElementById('dp').style.transform = '';
  document.getElementById('stbar').classList.remove('hidden');
  history.replaceState(null, '', location.pathname);
  if (showCarousel) showCarouselSmooth();
}

// ── Compartilhamento ───────────────────────────────────────────────────────
function shareSpot(s) {
  const url = `${location.origin}${location.pathname}?id=${s.id}`;
  if (navigator.share) {
    navigator.share({ title: s.name, text: `${s.name} — Sobral Cultural`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => toast('Link copiado!')).catch(() => {
      prompt('Copie o link:', url);
    });
  }
}


function hlCard(id) {
  document.querySelectorAll('.sc').forEach(c => c.classList.remove('active'));
  const c = document.getElementById('card-' + id);
  if (c) { c.classList.add('active'); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

/* ── GEO ────────────────────────────────────────────────────────────────── */
let _radiusCircle = null;

function setGeoUiState(enabled, locating = false) {
  const btn = document.getElementById('btnGeo');
  const bnavGeo = document.querySelector('.bnav-item[data-page="geo"]');
  if (btn) {
    btn.classList.toggle('locating', locating);
    btn.style.background = enabled ? '#1B6B6B' : '';
  }
  if (bnavGeo) {
    bnavGeo.classList.toggle('bnav-locating', locating);
    bnavGeo.style.color = enabled ? 'var(--teal)' : '';
  }
}

function applyUserLocation(pos, { focus = false, notify = false } = {}) {
  uLat = pos.coords.latitude;
  uLng = pos.coords.longitude;
  localStorage.setItem(GEO_LAST_KEY, JSON.stringify({ lat: uLat, lng: uLng, ts: Date.now() }));
  if (uMk) uMk.remove();
  if (_radiusCircle) { _radiusCircle.remove(); _radiusCircle = null; }
  uMk = L.marker([uLat, uLng], {
    icon: L.divIcon({ html: '<div class="user-dot"></div>', className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
  }).addTo(map);
  uMk.bindPopup('<div class="pp-title">Você está aqui</div>');
  if (focus) map.flyTo([uLat, uLng], 15, { duration: prefersReducedMotion() ? 0.01 : 1.5 });
  document.getElementById('stGeo').style.display = 'flex';
  buildList();
  if (notify) toast('Localização ativa e persistente.');
}

function startPersistentGeoWatch() {
  if (!navigator.geolocation || _geoWatchId !== null) return;
  _geoWatchId = navigator.geolocation.watchPosition(
    pos => {
      applyUserLocation(pos, { focus: false, notify: false });
      setGeoUiState(true, false);
    },
    e => {
      setGeoUiState(false, false);
      if (e.code === 1) {
        localStorage.removeItem(GEO_PREF_KEY);
        if (_geoWatchId !== null) { navigator.geolocation.clearWatch(_geoWatchId); _geoWatchId = null; }
      }
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
  );
}

function restorePersistentGeo() {
  try {
    const saved = localStorage.getItem(GEO_LAST_KEY);
    if (saved && map) {
      const p = JSON.parse(saved);
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
        applyUserLocation({ coords: { latitude: p.lat, longitude: p.lng } }, { focus: false, notify: false });
      }
    }
  } catch (_) {}
  if (localStorage.getItem(GEO_PREF_KEY) === '1') startPersistentGeoWatch();
}

function getUserLocation() {
  if (!navigator.geolocation) { toast('Geolocalização não suportada.', true); return; }
  setGeoUiState(false, true);
  navigator.geolocation.getCurrentPosition(p => {
    localStorage.setItem(GEO_PREF_KEY, '1');
    applyUserLocation(p, { focus: true, notify: true });
    setGeoUiState(true, false);
    startPersistentGeoWatch();
  }, e => {
    setGeoUiState(false, false);
    if (e.code === 1) localStorage.removeItem(GEO_PREF_KEY);
    toast(e.code === 1 ? 'Permissão negada.' : 'Erro ao localizar.', true);
  }, { timeout: 10000, enableHighAccuracy: true });
}

// raio visual ao abrir um painel com localização ativa
function showRadius(spotId) {
  if (uLat === null) return;
  const s = gs().find(x => x.id === spotId); if (!s) return;
  if (_radiusCircle) _radiusCircle.remove();
  const dist = d(uLat, uLng, s.lat, s.lng);
  _radiusCircle = L.circle([uLat, uLng], {
    radius: dist, color: 'rgba(200,135,26,.5)', fillColor: 'rgba(200,135,26,.05)',
    fillOpacity: 1, weight: 1, dashArray: '4 4'
  }).addTo(map);
}

/* ── FILTERS ─────────────────────────────────────────────────────────────── */
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

/* ── DRAWER / SIDEBAR ────────────────────────────────────────────────────── */
function toggleDrw() { ['hbg','drw','dov'].forEach(id => document.getElementById(id).classList.toggle('open')); }
function closeDrw()  { ['hbg','drw','dov'].forEach(id => document.getElementById(id).classList.remove('open')); }
function toggleSbMob() {
  document.getElementById('sb').classList.toggle('mob-open');
  document.getElementById('sbBack').style.display = document.getElementById('sb').classList.contains('mob-open') ? 'block' : 'none';
}
function closeSbMob() {
  document.getElementById('sb').classList.remove('mob-open');
  document.getElementById('sbBack').style.display = 'none';
}

/* ── ONBOARDING (primeira visita) ────────────────────────────────────────── */
function maybeShowOnboarding() {
  if (localStorage.getItem('sc_onboarded')) return;
  const ov = document.getElementById('onboarding');
  if (ov) { ov.classList.add('show'); localStorage.setItem('sc_onboarded', '1'); }
}
function closeOnboarding() {
  const ov = document.getElementById('onboarding');
  if (ov) ov.classList.remove('show');
}

/* ── UTILS ───────────────────────────────────────────────────────────────── */
function d(a, b, c, e) {
  const R = 6371e3, dL = (c - a) * Math.PI / 180, dN = (e - b) * Math.PI / 180,
    x = Math.sin(dL/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dN/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function fd(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m/1e3).toFixed(1)}km`; }
function updCnt(n) { document.getElementById('cntVis').textContent = n !== undefined ? n : gs().length; }
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  setTimeout(() => t.className = 'toast' + (err ? ' err' : ''), 3800);
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURED CAROUSEL
══════════════════════════════════════════════════════════════════════════ */
let _carIdx = 0, _carItems = [], _carTimer = null;
let _carouselHiddenByInteraction = false;
const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildCarousel() {
  const featured = SPOTS.filter(s => s.isFeatured);
  const el = document.getElementById('fcarousel');
  if (!featured.length) { el.style.display = 'none'; document.body.classList.remove('has-carousel'); return; }
  _carItems = featured;
  if (_carouselHiddenByInteraction) {
    el.style.display = 'none';
    document.body.classList.remove('has-carousel');
    return;
  }
  el.style.display = 'block';
  document.body.classList.add('has-carousel');
  el.classList.remove('is-hiding');
  el.innerHTML = '<div class="fcar-track" id="fcarTrack"></div><div class="fcar-dots" id="fcarDots"></div>';
  document.getElementById('fcarTrack').innerHTML = _carItems.map((s, i) => `
    <div class="fcar-slide" data-i="${i}">
      ${s.photo ? `<img src="${s.photo}" alt="${s.name}" draggable="false">` : `<div class="fcar-slide-ph" style="background:${s.color}22;color:${s.color}">${s.name.charAt(0)}</div>`}
      <div class="fcar-grad"></div>
      <div class="fcar-info">
        <div class="fcar-badge"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Destaque</div>
        <div class="fcar-name">${s.name}</div>
        <div class="fcar-cat">${CL[s.cat] || s.cat}</div>
      </div>
    </div>`).join('');
  renderCarDots(); carGoTo(0); carAutoplay(); initCarSwipe();
}

function renderCarDots() {
  const d = document.getElementById('fcarDots'); if (!d) return;
  d.innerHTML = _carItems.map((_, i) => `<div class="fcar-dot${i===_carIdx?' act':''}" onclick="carGoTo(${i})"></div>`).join('');
}
function carGoTo(i) {
  _carIdx = ((i % _carItems.length) + _carItems.length) % _carItems.length;
  const t = document.getElementById('fcarTrack'); if (t) t.style.transform = `translateX(-${_carIdx*100}%)`;
  renderCarDots();
}
function carAutoplay() { clearInterval(_carTimer); if (_carItems.length < 2) return; _carTimer = setInterval(() => carGoTo(_carIdx+1), 5000); }
function initCarSwipe() {
  const el = document.getElementById('fcarousel'); if (!el) return;
  let startX=0, startY=0, dx=0, dragging=false, lockAxis=null;
  el.addEventListener('touchstart', e => { const t=e.touches[0]; startX=t.clientX; startY=t.clientY; dx=0; dragging=true; lockAxis=null; const track=document.getElementById('fcarTrack'); if(track) track.style.transition='none'; clearInterval(_carTimer); }, {passive:true});
  el.addEventListener('touchmove', e => { if(!dragging) return; const t=e.touches[0]; const curDx=t.clientX-startX; const curDy=t.clientY-startY; if(!lockAxis) lockAxis=Math.abs(curDx)>Math.abs(curDy)?'x':'y'; if(lockAxis!=='x') return; e.preventDefault(); dx=curDx; const track=document.getElementById('fcarTrack'); if(track) track.style.transform=`translateX(calc(${-_carIdx*100}% + ${dx}px))`; }, {passive:false});
  el.addEventListener('touchend', () => { if(!dragging) return; dragging=false; const track=document.getElementById('fcarTrack'); if(track) track.style.transition=''; if(lockAxis==='x'){ if(dx<-40) carGoTo(_carIdx+1); else if(dx>40) carGoTo(_carIdx-1); else carGoTo(_carIdx); } dx=0; lockAxis=null; carAutoplay(); });
  el.addEventListener('touchcancel', () => { dragging=false; dx=0; lockAxis=null; const track=document.getElementById('fcarTrack'); if(track){track.style.transition=''; carGoTo(_carIdx);} carAutoplay(); });
  el.addEventListener('click', e => { if(Math.abs(dx)>5) return; const slide=e.target.closest('.fcar-slide'); if(!slide) return; const s=_carItems[_carIdx]; if(s) window.location.href=`sobral_post.html?id=${s.id}`; });
}

function hideCarouselSmooth(afterHide) {
  const el = document.getElementById('fcarousel');
  const hasCarouselOnScreen = document.body.classList.contains('has-carousel') && el && el.style.display !== 'none';
  if (!hasCarouselOnScreen) {
    if (typeof afterHide === 'function') afterHide();
    return;
  }
  _carouselHiddenByInteraction = true;
  clearInterval(_carTimer);
  el.classList.add('is-hiding');
  const transitionMs = prefersReducedMotion() ? 0 : 320;
  setTimeout(() => {
    el.style.display = 'none';
    document.body.classList.remove('has-carousel');
    el.classList.remove('is-hiding');
    if (typeof afterHide === 'function') afterHide();
  }, transitionMs);
}

function showCarouselSmooth() {
  const el = document.getElementById('fcarousel');
  const hasFeaturedItems = _carItems.length > 0;
  const isAlreadyVisible = document.body.classList.contains('has-carousel') && el && el.style.display !== 'none';
  if (!el || !hasFeaturedItems || isAlreadyVisible) return;

  _carouselHiddenByInteraction = false;
  el.style.display = 'block';
  document.body.classList.add('has-carousel');
  el.classList.add('is-showing');
  requestAnimationFrame(() => el.classList.remove('is-showing'));
  carAutoplay();
}

/* ══════════════════════════════════════════════════════════════════════════
   BOTTOM NAV AUTH
══════════════════════════════════════════════════════════════════════════ */
function updateBnavAuth(user) {
  const el = document.getElementById('bnavAuth'); if (!el) return;
  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Eu';
    const av   = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
    el.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:var(--ochre);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--deep);overflow:hidden;flex-shrink:0">${av?`<img src="${av}" style="width:100%;height:100%;object-fit:cover">`:name.charAt(0).toUpperCase()}</div><span>${name.split(' ')[0]}</span>`;
    el.onclick = () => { window.location.href = 'sobral_perfil.html'; };
  } else {
    el.innerHTML = `<i data-lucide="user" class="bnav-ico"></i><span>Perfil</span>`;
    el.onclick = () => { window.location.href = 'sobral_login.html?redirect=/'; };
    lucide.createIcons({ nodes: [el] });
  }
}

/* ── AUTH ────────────────────────────────────────────────────────────────── */
let CUR_USER = null, CUR_REACTIONS = [];
let REACTION_COUNTS = {};

async function initAuth() {
  const { data: { session } } = await supa.auth.getSession();
  CUR_USER = session?.user || null;
  renderAuthChip();
  updateBnavAuth(CUR_USER);
  if (CUR_USER) await loadUserReactions();
}

async function renderAuthChip() {
  const chip = document.getElementById('authChip');
  const drawerSection = document.getElementById('drawerAuthSection');
  if (!chip) return;
  if (CUR_USER) {
    const av   = CUR_USER.user_metadata?.avatar_url || CUR_USER.user_metadata?.picture || '';
    const name = CUR_USER.user_metadata?.full_name  || CUR_USER.email?.split('@')[0]    || 'Eu';
    chip.innerHTML = `<a href="sobral_perfil.html" class="user-chip"><div class="uc-av">${av?`<img src="${av}" alt="">`:name.charAt(0).toUpperCase()}</div><span>${name.split(' ')[0]}</span></a>`;
    if (drawerSection) drawerSection.innerHTML = `
      <a href="sobral_perfil.html" class="drw-lnk"><div class="drw-ic"><i data-lucide="user"></i></div> Meu Perfil</a>
      <a href="sobral_submeter.html" class="drw-lnk"><div class="drw-ic"><i data-lucide="plus"></i></div> Sugerir Ponto ou Evento</a>
      <button class="drw-lnk" onclick="logoutMap();closeDrw()"><div class="drw-ic"><i data-lucide="log-out"></i></div> Sair</button>`;
    const { data: prof } = await supa.from('profiles').select('role').eq('id', CUR_USER.id).single();
    const isAdmin = prof?.role === 'admin';
    ['adminLink','drawerAdminLink','drawerAdminSec'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display=isAdmin?'':'none'; });
  } else {
    chip.innerHTML = `<a href="sobral_login.html?redirect=/" class="btn-login">Entrar</a>`;
    if (drawerSection) drawerSection.innerHTML = `<a href="sobral_login.html?redirect=/" class="drw-lnk"><div class="drw-ic"><i data-lucide="user"></i></div> Entrar / Criar Conta</a>`;
    ['adminLink','drawerAdminLink','drawerAdminSec'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  }
  lucide.createIcons();
}

async function logoutMap() {
  await supa.auth.signOut();
  CUR_USER = null; CUR_REACTIONS = [];
  renderAuthChip(); updateBnavAuth(null);
  toast('Sessão encerrada.');
}

async function loadUserReactions() {
  if (!CUR_USER) { CUR_REACTIONS = []; return; }
  const { data } = await supa.from('reactions').select('*').eq('user_id', CUR_USER.id);
  CUR_REACTIONS = data || [];
}

/* ── REACTIONS ───────────────────────────────────────────────────────────── */
async function renderReactionBtns(spotId) {
  const el = document.getElementById('rxnBtns'); if (!el) return;
  el.innerHTML = `<div style="display:flex;gap:8px;opacity:.35;pointer-events:none"><div style="height:32px;width:72px;border-radius:8px;background:rgba(245,237,216,.15)"></div><div style="height:32px;width:72px;border-radius:8px;background:rgba(245,237,216,.15)"></div><div style="height:32px;width:72px;border-radius:8px;background:rgba(245,237,216,.15)"></div></div>`;
  if (!REACTION_COUNTS[spotId]) {
    const { data: counts } = await supa.from('reactions').select('reaction').eq('spot_id', String(spotId));
    REACTION_COUNTS[spotId] = {
      like:  (counts||[]).filter(r=>r.reaction==='like').length,
      been:  (counts||[]).filter(r=>r.reaction==='been').length,
      going: (counts||[]).filter(r=>r.reaction==='going').length,
    };
  }
  const { like: lc, been: bc, going: gc } = REACTION_COUNTS[spotId];
  const myLike  = CUR_REACTIONS.find(r=>r.spot_id===String(spotId)&&r.reaction==='like');
  const myBeen  = CUR_REACTIONS.find(r=>r.spot_id===String(spotId)&&r.reaction==='been');
  const myGoing = CUR_REACTIONS.find(r=>r.spot_id===String(spotId)&&r.reaction==='going');
  if (!CUR_USER) { el.innerHTML = `<div style="font-size:11.5px;color:rgba(245,237,216,.4)"><a href="sobral_login.html?redirect=/" style="color:var(--ochre)">Entre</a> para curtir e marcar pontos</div>`; return; }
  el.innerHTML = `
    <button class="rxn-btn ${myLike?'active-like':''}"  onclick="toggleReaction('${spotId}','like')"  title="Gostei"><i data-lucide="heart"    class="icon-sm"></i><span>Gostei</span>${lc>0?`<span class="rxn-count">${lc}</span>`:''}</button>
    <button class="rxn-btn ${myBeen?'active-been':''}"  onclick="toggleReaction('${spotId}','been')"  title="Eu Fui"><i data-lucide="check"    class="icon-sm"></i><span>Eu Fui</span>${bc>0?`<span class="rxn-count">${bc}</span>`:''}</button>
    <button class="rxn-btn ${myGoing?'active-going':''}" onclick="toggleReaction('${spotId}','going')" title="Eu Vou"><i data-lucide="calendar" class="icon-sm"></i><span>Eu Vou</span>${gc>0?`<span class="rxn-count">${gc}</span>`:''}</button>`;
  lucide.createIcons();
}

async function toggleReaction(spotId, reaction) {
  if (!CUR_USER) { toast('Entre para reagir aos pontos!', true); return; }
  const existing = CUR_REACTIONS.find(r=>r.spot_id===String(spotId)&&r.reaction===reaction);
  if (existing) {
    await supa.from('reactions').delete().eq('id', existing.id);
    CUR_REACTIONS = CUR_REACTIONS.filter(r=>r.id!==existing.id);
    if (REACTION_COUNTS[spotId]) REACTION_COUNTS[spotId][reaction] = Math.max(0, REACTION_COUNTS[spotId][reaction]-1);
    toast(reaction==='like'?'Gostei removido':reaction==='been'?'Eu Fui removido':'Eu Vou removido');
  } else {
    const { data } = await supa.from('reactions').insert({ user_id:CUR_USER.id, spot_id:String(spotId), reaction, spot_type:'spot' }).select().single();
    if (data) CUR_REACTIONS.push(data);
    if (REACTION_COUNTS[spotId]) REACTION_COUNTS[spotId][reaction]+=1;
    toast(reaction==='like'?'Gostei!':reaction==='been'?'Marcado como Eu Fui!':'Marcado como Eu Vou!');
  }
  renderReactionBtns(spotId);
}

/* ── BOOT ────────────────────────────────────────────────────────────────── */
window.addEventListener('load', async () => {
  const ok = await loadSpots();
  if (!ok) {
    const l = document.getElementById('loading');
    l.querySelector('.lsp').style.display = 'none';
    const err = document.createElement('div');
    err.style.cssText = 'font-size:13px;color:#e55;margin-top:8px;text-align:center;max-width:260px;line-height:1.5';
    err.textContent = 'Não foi possível carregar os dados. Verifique sua conexão e recarregue a página.';
    l.appendChild(err);
    return;
  }
  initMap();
  buildCarousel();
  startRT();
  initAuth();
  initDpDrag();
  lucide.createIcons();
  restorePersistentGeo();
  const l = document.getElementById('loading');
  l.classList.add('fade');
  setTimeout(() => l.remove(), 700);
  setTimeout(maybeShowOnboarding, 1200);
});
