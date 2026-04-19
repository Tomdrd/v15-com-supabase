// ══════════════════════════════════════════
//  SUPABASE
// ══════════════════════════════════════════
const SUPA_URL = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const BUCKET  = 'spots-photos';
const supa    = supabase.createClient(SUPA_URL, SUPA_KEY);

// ══════════════════════════════════════════
//  CONSTANTES — sem emojis
// ══════════════════════════════════════════
const CAT_LABELS = {
  todos:     'Todos',
  religioso: 'Religioso',
  cultura:   'Cultura',
  historico: 'Histórico',
  natureza:  'Natureza',
  lazer:     'Lazer'
};

// Ícones Lucide por categoria (usados nas renderizações dinâmicas)
const CAT_ICONS = {
  todos:     'layers',
  religioso: 'church',
  cultura:   'drama',
  historico: 'landmark',
  natureza:  'tree-pine',
  lazer:     'ferris-wheel'
};

const COLORS = ['#1B6B6B','#6440B4','#B54A2A','#3C7828','#C8871A','#1A5F8B','#8B2E6B','#2E6B1A','#6B3A1A','#1A3A6B'];

// ══════════════════════════════════════════
//  CACHE + LEITURA
// ══════════════════════════════════════════
let _cache = [];
let _pendingPhoto = null; // foto pendente de upload (era window._pendingPhoto)

function mapRow(r) {
  return { id:r.id, name:r.name, cat:r.cat, color:r.color,
    lat:r.lat, lng:r.lng, desc:r.description, address:r.address,
    horario:r.horario, entrada:r.entrada, photo:r.photo,
    blogTitle:r.blog_title, blogContent:r.blog_content,
    blogAuthor:r.blog_author, blogDate:r.blog_date, createdAt:r.created_at,
    isFeatured:!!r.is_featured };
}

function getSpots() { return _cache; }

async function loadSpots() {
  const { data, error } = await supa.from('spots').select('*').order('created_at', { ascending: true });
  if (error) { showToast('Erro ao carregar: ' + error.message, 'error'); return; }
  _cache = (data || []).map(mapRow);
  updateBadge();
}

function startRealtime() {
  supa.channel('spots-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, async () => {
      await loadSpots();
      if (currentView === 'list') {
        const f = document.getElementById('listSearch')?.value || '';
        const c = document.getElementById('listCat')?.value || 'todos';
        document.getElementById('mainContent').innerHTML = renderList(f, c);
      } else if (currentView === 'dashboard') {
        document.getElementById('mainContent').innerHTML = renderDashboard();
      }
      lucide.createIcons();
    })
    .subscribe();
}

function updateBadge() {
  const el = document.getElementById('spotCountBadge');
  if (el) el.textContent = _cache.length;
}

// ══════════════════════════════════════════
//  SALVAR SPOT
// ══════════════════════════════════════════
async function saveSpotToSupabase(spot) {
  try {
    let photoUrl = spot.photo;
    if (_pendingPhoto && _pendingPhoto.startsWith('data:')) {
      showToast('Enviando foto ao Supabase Storage…', 'info');
      photoUrl = await uploadPhoto(spot.id, _pendingPhoto);
      _pendingPhoto = undefined;
    }
    const row = {
      id: spot.id, name: spot.name, cat: spot.cat, emoji: '',
      color: spot.color, lat: spot.lat, lng: spot.lng,
      type: spot.type || 'spot',
      event_date: spot.event_date || null,
      event_end: spot.event_end || null,
      description: spot.desc, address: spot.address,
      horario: spot.horario, entrada: spot.entrada, photo: photoUrl,
      blog_title: spot.blogTitle, blog_content: spot.blogContent,
      blog_author: spot.blogAuthor, blog_date: spot.blogDate || new Date().toISOString().split('T')[0],
      created_at: spot.createdAt || new Date().toISOString(),
      is_featured: spot.isFeatured || false
    };
    const { error } = await supa.from('spots').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    await loadSpots();
    return true;
  } catch(e) {
    console.error(e);
    showToast('Erro ao salvar: ' + e.message, 'error');
    return false;
  }
}

// ══════════════════════════════════════════
//  UPLOAD FOTO
// ══════════════════════════════════════════
async function uploadPhoto(spotId, base64DataUrl) {
  const res = await fetch(base64DataUrl);
  const blob = await res.blob();
  const path = `${spotId}/photo.jpg`;
  await supa.storage.from(BUCKET).remove([path]);
  const { error } = await supa.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supa.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl + '?v=' + Date.now();
}

// ══════════════════════════════════════════
//  DELETAR SPOT
// ══════════════════════════════════════════
async function deleteSpotFromSupabase(id) {
  try {
    await supa.storage.from(BUCKET).remove([`${id}/photo.jpg`]);
    const { error } = await supa.from('spots').delete().eq('id', id);
    if (error) throw error;
    await loadSpots();
    return true;
  } catch(e) {
    console.error(e);
    showToast('Erro ao excluir: ' + e.message, 'error');
    return false;
  }
}

// ══════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════
function isAuthenticated() { return !!window._adminUser; }
function showLoginOverlay(show = true) {
  const ov = document.getElementById('loginOverlay'), app = document.querySelector('.app');
  if (show) { ov.classList.add('active'); if (app) { app.style.filter='blur(2px)'; app.style.pointerEvents='none'; } }
  else { ov.classList.remove('active'); if (app) { app.style.filter=''; app.style.pointerEvents=''; } }
}
async function performLogin() {
  const email = document.getElementById('adminUser')?.value.trim();
  const pass  = document.getElementById('adminPass')?.value.trim();
  const err   = document.getElementById('loginError');
  if (!email || !pass) { err.textContent = 'Preencha e-mail e senha.'; return; }
  const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = 'Credenciais inválidas.'; return; }
  const { data: prof } = await supa.from('profiles').select('role').eq('id', data.user.id).single();
  if (!prof || prof.role !== 'admin') {
    await supa.auth.signOut();
    err.textContent = 'Acesso negado: conta sem permissão de administrador.';
    return;
  }
  window._adminUser = data.user;
  err.textContent = '';
  showToast('Login realizado com sucesso.', 'success');
  showLoginOverlay(false);
  navigate('dashboard');
}
async function logout() {
  await supa.auth.signOut();
  window._adminUser = null;
  showLoginOverlay(true);
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  showToast('Sessão encerrada.', 'info');
}
function requireAuth() {
  if (!isAuthenticated()) { showLoginOverlay(true); return false; }
  showLoginOverlay(false); return true;
}

// ══════════════════════════════════════════
//  NAVEGAÇÃO
// ══════════════════════════════════════════
let currentView = 'dashboard', editingId = null, coordPickerMap = null, coordMarker = null;

function navigate(view, id = null) {
  if (!requireAuth()) return;
  currentView = view; editingId = id;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nm = { dashboard:0, list:1, new:2, messages:3, moderation:4, pages:5, backup:6 };
  const btns = document.querySelectorAll('.nav-btn');
  if (view === 'edit') btns[2]?.classList.add('active');
  else if (nm[view] !== undefined) btns[nm[view]]?.classList.add('active');
  const main = document.getElementById('mainContent');
  if      (view === 'dashboard')  main.innerHTML = renderDashboard();
  else if (view === 'list')       main.innerHTML = renderList();
  else if (view === 'new')      { main.innerHTML = renderForm(null); initFormExtras(); }
  else if (view === 'edit')     { main.innerHTML = renderForm(id);   initFormExtras(id); }
  else if (view === 'messages')   main.innerHTML = renderMessages();
  else if (view === 'backup')     main.innerHTML = renderBackup();
  else if (view === 'moderation') main.innerHTML = renderModeration();
  else if (view === 'pages')      main.innerHTML = renderPagesManager();
  else if (view === 'editPage') { main.innerHTML = renderPageEditor(id); initPageEditor(id); }
  main.scrollTop = 0;
  closeAdmSb();
  lucide.createIcons();
}

function toggleAdmSb() {
  const sb = document.getElementById('admSidebar');
  const bk = document.getElementById('mobSbBack');
  const hb = document.getElementById('admHbg');
  const open = sb.classList.toggle('mob-open');
  bk.style.display = open ? 'block' : 'none';
  hb?.classList.toggle('open', open);
}
function closeAdmSb() {
  document.getElementById('admSidebar')?.classList.remove('mob-open');
  const bk = document.getElementById('mobSbBack');
  if (bk) bk.style.display = 'none';
  document.getElementById('admHbg')?.classList.remove('open');
}

// ══════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════
function renderDashboard() {
  const spots = getSpots(), bycat = {};
  spots.forEach(s => { bycat[s.cat] = (bycat[s.cat]||0)+1; });
  const unread  = _messages.filter(m => !m.read).length;
  const pending = _submissions.filter(s => s.status === 'pending').length;
  return `
  <div class="page-header">
    <div class="page-title">
      <h2>Painel Geral</h2>
      <p>Visão geral · <span style="color:var(--teal);font-size:11px">Supabase conectado</span></p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="navigate('new')">
        <i data-lucide="plus" class="icon-sm"></i> Novo Ponto
      </button>
    </div>
  </div>
  <div class="page-content">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i data-lucide="map-pin" class="icon-xl"></i></div>
        <div class="stat-num">${spots.length}</div>
        <div class="stat-label">Total de Pontos Turísticos</div>
      </div>
      <div class="stat-card" data-c="green" style="cursor:pointer" onclick="navigate('moderation')">
        <div class="stat-icon"><i data-lucide="shield-check" class="icon-xl"></i></div>
        <div class="stat-num">${pending}</div>
        <div class="stat-label">Aguardando Moderação</div>
      </div>
      <div class="stat-card" data-c="terra" style="cursor:pointer" onclick="navigate('messages')">
        <div class="stat-icon"><i data-lucide="mail" class="icon-xl"></i></div>
        <div class="stat-num">${unread}</div>
        <div class="stat-label">Mensagens Não Lidas</div>
      </div>
      <div class="stat-card" data-c="teal">
        <div class="stat-icon"><i data-lucide="layers" class="icon-xl"></i></div>
        <div class="stat-num">${Object.keys(bycat).length}</div>
        <div class="stat-label">Categorias Ativas</div>
      </div>
    </div>

    <div class="section-title">Pontos por Categoria</div>
    <div class="section-sub">Distribuição atual</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px">
      ${Object.entries(bycat).map(([k,v]) => `
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:14px 20px;min-width:130px">
          <div style="margin-bottom:6px;color:var(--ochre)"><i data-lucide="${CAT_ICONS[k]||'map-pin'}" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.5"></i></div>
          <div style="font-size:24px;font-family:'Playfair Display',serif;font-weight:800;color:var(--cream)">${v}</div>
          <div style="font-size:12px;color:var(--muted)">${CAT_LABELS[k]||k}</div>
        </div>`).join('')}
    </div>

    ${unread > 0 ? `
    <div style="background:rgba(181,74,42,.1);border:1px solid rgba(181,74,42,.3);border-radius:var(--radius);padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer" onclick="navigate('messages')">
      <div style="display:flex;align-items:center;gap:10px">
        <i data-lucide="mail" style="width:20px;height:20px;stroke:#e89e7e;fill:none;stroke-width:1.5;flex-shrink:0"></i>
        <div>
          <div style="font-weight:600;font-size:14px;color:var(--cream)">Você tem ${unread} mensagem${unread!==1?'s':''} não lida${unread!==1?'s':''}</div>
          <div style="font-size:12px;color:var(--muted)">Clique para ver as mensagens de contato</div>
        </div>
      </div>
      <button class="btn btn-sm btn-secondary">Ver mensagens</button>
    </div>` : ''}

    <div class="section-title">Acesso Rápido</div>
    <div class="section-sub">Últimos pontos cadastrados</div>
    <div class="spots-grid">${spots.slice(-4).reverse().map(s => spotCard(s)).join('')}</div>
  </div>`;
}

// ══════════════════════════════════════════
//  LISTA
// ══════════════════════════════════════════
function renderList(filter = '', cat = 'todos') {
  const spots = getSpots();
  const filtered = spots.filter(s => (cat==='todos'||s.cat===cat) && s.name.toLowerCase().includes(filter.toLowerCase()));
  return `
  <div class="page-header">
    <div class="page-title"><h2>Pontos Turísticos</h2><p>${spots.length} pontos no Supabase</p></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="navigate('new')">
        <i data-lucide="plus" class="icon-sm"></i> Novo Ponto
      </button>
    </div>
  </div>
  <div class="page-content">
    <div class="search-bar">
      <input id="listSearch" placeholder="Buscar por nome…" value="${filter}" oninput="refreshList()" style="max-width:300px">
      <select class="filter-select" id="listCat" onchange="refreshList()">
        ${Object.entries(CAT_LABELS).map(([k,v]) => `<option value="${k}" ${cat===k?'selected':''}>${v}</option>`).join('')}
      </select>
      <span style="font-size:13px;color:var(--muted);margin-left:4px">${filtered.length} resultado${filtered.length!==1?'s':''}</span>
    </div>
    ${filtered.length===0
      ? `<div class="empty-state">
           <div class="es-icon"><i data-lucide="search-x" style="width:48px;height:48px;stroke:currentColor;fill:none;stroke-width:1.5;opacity:.4"></i></div>
           <h3>Nenhum ponto encontrado</h3>
           <button class="btn btn-primary" onclick="navigate('new')">
             <i data-lucide="plus" class="icon-sm"></i> Adicionar Ponto
           </button>
         </div>`
      : `<div class="spots-grid">${filtered.map(s => spotCard(s)).join('')}</div>`}
  </div>`;
}

function refreshList() {
  const f = document.getElementById('listSearch')?.value || '';
  const c = document.getElementById('listCat')?.value || 'todos';
  document.getElementById('mainContent').innerHTML = renderList(f, c);
  lucide.createIcons();
}

function spotCard(s) {
  return `<div class="spot-item" id="scard-${s.id}">
    <div class="spot-photo">
      ${s.photo
        ? `<img src="${s.photo}" alt="${s.name}">`
        : `<div class="spot-photo-placeholder" style="background:${s.color}22;color:${s.color}">
             <i data-lucide="${CAT_ICONS[s.cat]||'map-pin'}" style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:1.5"></i>
           </div>`}
      <div class="spot-photo-badge">${CAT_LABELS[s.cat]||s.cat}</div>
    </div>
    <div class="spot-body">
      <div class="spot-name">${s.name}</div>
      <div class="spot-meta">${s.address||'—'}<br>${s.horario||''}</div>
      <div class="spot-actions">
        <button class="btn btn-sm btn-secondary" onclick="navigate('edit','${s.id}')">
          <i data-lucide="pencil" class="icon-sm"></i> Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="confirmDelete('${s.id}')">
          <i data-lucide="trash-2" class="icon-sm"></i>
        </button>
        <a href="sobral_post.html?id=${s.id}" target="_blank" class="btn btn-sm btn-ghost">
          <i data-lucide="eye" class="icon-sm"></i>
        </a>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════
//  FORMULÁRIO
// ══════════════════════════════════════════
function renderForm(id) {
  const spots = getSpots(), s = id ? spots.find(x => x.id === id) : null;
  return `
  <div class="page-header">
    <div class="page-title">
      <h2>${s ? `Editar: ${s.name}` : 'Adicionar Novo Ponto'}</h2>
      <p>${s ? 'Altere as informações e salve' : 'Preencha os campos abaixo'}</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-ghost" onclick="navigate('list')">← Cancelar</button>
      <button class="btn btn-primary" onclick="saveForm()">
        <i data-lucide="save" class="icon-sm"></i> Salvar Ponto
      </button>
    </div>
  </div>
  <div class="page-content">

    <div class="form-section" id="sec-basic">
      <div class="form-section-header" onclick="toggleSection('basic')">
        <span class="form-section-icon"><i data-lucide="file-text" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Informações Básicas</h3>
        <span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div class="form-row" style="margin-bottom:16px">
          <div class="form-group">
            <label>Tipo <em>*</em></label>
            <div class="type-seg" style="display:flex;background:rgba(0,0,0,.25);border:1.5px solid rgba(200,135,26,.2);border-radius:10px;padding:4px;gap:4px;margin-top:4px">
              <button type="button" id="tsBtnSpot"
                onclick="selectTypeAdmin('spot')"
                style="flex:1;padding:9px 12px;border-radius:7px;border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all .2s;background:${(!s||s.type!=='event')?'var(--ochre)':'transparent'};color:${(!s||s.type!=='event')?'var(--deep)':'var(--muted)'}">
                Ponto Turístico
              </button>
              <button type="button" id="tsBtnEvent"
                onclick="selectTypeAdmin('event')"
                style="flex:1;padding:9px 12px;border-radius:7px;border:none;cursor:pointer;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all .2s;background:${s?.type==='event'?'var(--ochre)':'transparent'};color:${s?.type==='event'?'var(--deep)':'var(--muted)'}">
                Evento
              </button>
            </div>
            <input type="hidden" id="f-type" value="${s?.type||'spot'}">
          </div>
        </div>
        <div id="adminEventDates" style="display:${s?.type==='event'?'block':'none'}">
          <div class="form-row cols-2">
            <div class="form-group"><label>Data de Início <em>*</em></label><input id="f-date-start" type="date" value="${s?.event_date||''}"></div>
            <div class="form-group"><label>Data de Fim</label><input id="f-date-end" type="date" value="${s?.event_end||''}"></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Nome <em>*</em></label><input id="f-name" placeholder="Ex: Teatro São João" value="${s?.name||''}"></div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label>Categoria <em>*</em></label>
            <select id="f-cat">${['cultura','religioso','historico','natureza','lazer'].map(k=>`<option value="${k}" ${s?.cat===k?'selected':''}>${CAT_LABELS[k]}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>Endereço</label><input id="f-address" placeholder="Rua, bairro — Sobral" value="${s?.address||''}"></div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group"><label>Horário</label><input id="f-horario" placeholder="Ex: Ter–Dom, 9h–18h" value="${s?.horario||''}"></div>
          <div class="form-group"><label>Entrada</label><input id="f-entrada" placeholder="Ex: Gratuita ou R$ 10,00" value="${s?.entrada||''}"></div>
          <div class="form-group form-group-check">
            <label class="check-label">
              <input type="checkbox" id="f-featured" ${s?.isFeatured ? 'checked' : ''}>
              <span class="check-box"></span>
              <span>Exibir no carrossel de destaques</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Descrição Curta <em>*</em> <span id="descCount" style="float:right;font-weight:400"></span></label>
          <textarea id="f-desc" rows="3" maxlength="350" placeholder="Descrição exibida no mapa (máx. 350 caracteres)" oninput="updateCharCount()">${s?.desc||''}</textarea>
          <div class="helper">Esta descrição aparece no card do mapa.</div>
        </div>
        <div class="form-group">
          <label>Cor do Marcador</label>
          <input id="f-color" type="text" value="${s?.color||'#1B6B6B'}" readonly style="font-family:monospace">
          <div class="color-row">${COLORS.map(c=>`<div class="color-opt ${s?.color===c?'selected':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('')}</div>
        </div>
      </div>
    </div>

    <div class="form-section" id="sec-loc">
      <div class="form-section-header" onclick="toggleSection('loc')">
        <span class="form-section-icon"><i data-lucide="map-pin" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Localização no Mapa</h3>
        <span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div class="coord-hint">Clique no mapa para definir a localização</div>
        <div id="coordMap" style="margin-top:10px"></div>
        <div class="coord-display">
          <div class="form-group" style="flex:1"><label>Latitude</label><input id="f-lat" type="number" step="any" placeholder="-3.6862" value="${s?.lat||''}"></div>
          <div class="form-group" style="flex:1"><label>Longitude</label><input id="f-lng" type="number" step="any" placeholder="-40.3507" value="${s?.lng||''}"></div>
        </div>
      </div>
    </div>

    <div class="form-section" id="sec-photo">
      <div class="form-section-header" onclick="toggleSection('photo')">
        <span class="form-section-icon"><i data-lucide="image" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Foto do Ponto Turístico</h3>
        <span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div id="photoArea">${s?.photo ? renderPhotoPreview(s.photo) : renderDropZone()}</div>
        <div class="helper" style="margin-top:10px">Foto enviada ao <strong>Supabase Storage</strong>. Formatos: JPG, PNG, WEBP. Máx. 5 MB. Comprimida automaticamente.</div>
      </div>
    </div>

    <div class="form-section" id="sec-blog">
      <div class="form-section-header" onclick="toggleSection('blog')">
        <span class="form-section-icon"><i data-lucide="newspaper" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Conteúdo do Blog / Post</h3>
        <span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div class="helper" style="margin-bottom:14px">Este conteúdo aparece quando o visitante clica em "Ver Post Completo" no mapa.</div>
        <div class="form-row cols-2">
          <div class="form-group"><label>Título do Post</label><input id="f-btitle" placeholder="Ex: Teatro São João: O Palco da Cultura" value="${s?.blogTitle||''}"></div>
          <div class="form-group"><label>Autor</label><input id="f-bauthor" value="${s?.blogAuthor||'Equipe Sobral Cultural'}"></div>
        </div>
        <div class="form-group" style="margin-bottom:4px"><label>Conteúdo do Post (editor de texto)</label></div>
        <div class="editor-toolbar">
          <button onclick="fmt('bold')" title="Negrito"><b>B</b></button>
          <button onclick="fmt('italic')" title="Itálico"><i>I</i></button>
          <div class="sep"></div>
          <button onclick="fmt('formatBlock','h2')">H2</button>
          <button onclick="fmt('formatBlock','h3')">H3</button>
          <button onclick="fmt('formatBlock','p')">¶</button>
          <div class="sep"></div>
          <button onclick="fmt('insertUnorderedList')">•</button>
          <button onclick="fmt('insertOrderedList')">1.</button>
          <button onclick="fmt('formatBlock','blockquote')">❝</button>
          <div class="sep"></div>
          <button onclick="insertLink()" title="Link">
            <i data-lucide="link" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2"></i>
          </button>
          <button onclick="fmt('removeFormat')" title="Limpar">✕</button>
        </div>
        <div id="blogEditor" class="blog-editor" contenteditable="true">${s?.blogContent||'<p>Escreva aqui o conteúdo completo sobre este ponto turístico…</p>'}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
      <button class="btn btn-ghost" onclick="navigate('list')">← Cancelar</button>
      <button class="btn btn-primary" onclick="saveForm()">
        <i data-lucide="save" class="icon-sm"></i> Salvar Ponto
      </button>
    </div>
  </div>`;
}

function renderDropZone() {
  return `<div class="drop-zone" id="dropZone">
    <input type="file" accept="image/*" onchange="handlePhoto(this.files[0])">
    <div class="drop-zone-icon"><i data-lucide="upload-cloud" style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:1.5;opacity:.5"></i></div>
    <p>Arraste uma foto aqui ou clique para escolher</p>
    <small>JPG, PNG, WEBP — máximo 5 MB</small>
  </div>`;
}
function renderPhotoPreview(src) {
  return `<div class="photo-preview">
    <img src="${src}" alt="Foto">
    <div class="photo-preview-actions">
      <button class="btn btn-sm btn-secondary" onclick="removePhoto()">
        <i data-lucide="trash-2" class="icon-sm"></i> Remover
      </button>
    </div>
  </div>
  <div class="photo-size-info" id="photoInfo">Foto carregada</div>`;
}

function initFormExtras(id = null) {
  const s = id ? getSpots().find(x => x.id === id) : null;
  updateCharCount(); setupDropZone();
  setTimeout(() => {
    const el = document.getElementById('coordMap');
    if (!el || coordPickerMap) return;
    const lat = s?.lat || -3.6880, lng = s?.lng || -40.3497;
    coordPickerMap = L.map('coordMap', { center:[lat,lng], zoom:14, zoomControl:true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution:'© OSM © CARTO', subdomains:'abcd', maxZoom:19 }).addTo(coordPickerMap);
    if (s?.lat) {
      coordMarker = L.marker([s.lat,s.lng], { draggable:true }).addTo(coordPickerMap);
      coordMarker.on('dragend', updateCoordsFromMarker);
    }
    coordPickerMap.on('click', e => {
      const { lat, lng } = e.latlng;
      document.getElementById('f-lat').value = lat.toFixed(6);
      document.getElementById('f-lng').value = lng.toFixed(6);
      if (coordMarker) coordMarker.setLatLng([lat, lng]);
      else { coordMarker = L.marker([lat,lng],{draggable:true}).addTo(coordPickerMap); coordMarker.on('dragend', updateCoordsFromMarker); }
    });
    lucide.createIcons();
  }, 100);
}
function updateCoordsFromMarker() { const p = coordMarker.getLatLng(); document.getElementById('f-lat').value = p.lat.toFixed(6); document.getElementById('f-lng').value = p.lng.toFixed(6); }
function setupDropZone() {
  const dz = document.getElementById('dropZone'); if (!dz) return;
  dz.addEventListener('dragover', e=>{e.preventDefault();dz.classList.add('drag-over');});
  dz.addEventListener('dragleave', ()=>dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e=>{e.preventDefault();dz.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)handlePhoto(f);});
}
async function handlePhoto(file) {
  if (!file || !file.type.startsWith('image/')) { showToast('Escolha uma imagem válida.', 'error'); return; }
  if (file.size > 5*1024*1024) { showToast('Imagem muito grande. Máximo 5 MB.', 'error'); return; }
  showToast('Comprimindo imagem…', 'info');
  const compressed = await compressImage(file);
  _pendingPhoto = compressed;
  document.getElementById('photoArea').innerHTML = renderPhotoPreview(compressed);
  document.getElementById('photoInfo').textContent = `Foto processada (~${Math.round(compressed.length*.75/1024)} KB) — será enviada ao Storage`;
  lucide.createIcons();
}
async function compressImage(file, maxW=900, quality=0.78) {
  return new Promise(r => { const reader = new FileReader(); reader.onload = e => { const img = new Image(); img.onload = () => { const ratio = Math.min(maxW/img.width,1); const c = document.createElement('canvas'); c.width = img.width*ratio; c.height = img.height*ratio; c.getContext('2d').drawImage(img,0,0,c.width,c.height); r(c.toDataURL('image/jpeg',quality)); }; img.src = e.target.result; }; reader.readAsDataURL(file); });
}
function removePhoto() { _pendingPhoto = null; document.getElementById('photoArea').innerHTML = renderDropZone(); setupDropZone(); lucide.createIcons(); }

// ══════════════════════════════════════════
//  SALVAR FORMULÁRIO
// ══════════════════════════════════════════
async function saveForm() {
  const name = document.getElementById('f-name')?.value?.trim();
  if (!name) { showToast('Preencha o nome do ponto.', 'error'); return; }
  const lat = parseFloat(document.getElementById('f-lat')?.value);
  const lng = parseFloat(document.getElementById('f-lng')?.value);
  if (!lat || !lng) { showToast('Defina a localização no mapa.', 'error'); return; }

  const isEdit = !!editingId, existing = isEdit ? getSpots().find(s => s.id===editingId) : null;
  const newId = isEdit ? editingId : crypto.randomUUID();
  let photoVal = (_pendingPhoto !== undefined) ? _pendingPhoto : (existing?.photo || null);

  const fType = document.getElementById('f-type')?.value || 'spot';
  const spot = {
    id: newId, name,
    type:    fType,
    cat:     document.getElementById('f-cat')?.value || 'cultura',
    color:   document.getElementById('f-color')?.value || '#1B6B6B',
    lat, lng,
    desc:    document.getElementById('f-desc')?.value?.trim() || '',
    address: document.getElementById('f-address')?.value?.trim() || '',
    horario: document.getElementById('f-horario')?.value?.trim() || '',
    entrada: document.getElementById('f-entrada')?.value?.trim() || '',
    photo:   photoVal,
    event_date: fType === 'event' ? (document.getElementById('f-date-start')?.value || null) : null,
    event_end:  fType === 'event' ? (document.getElementById('f-date-end')?.value || null) : null,
    blogTitle:   document.getElementById('f-btitle')?.value?.trim() || name,
    blogContent: document.getElementById('blogEditor')?.innerHTML || '',
    blogAuthor:  document.getElementById('f-bauthor')?.value?.trim() || 'Equipe Sobral Cultural',
    blogDate:    new Date().toISOString().split('T')[0],
    createdAt:   existing?.createdAt || new Date().toISOString(),
    isFeatured:  !!(document.getElementById('f-featured')?.checked)
  };

  const btn = document.querySelector('button[onclick="saveForm()"]');
  if (btn) { btn.disabled=true; btn.textContent='Salvando…'; }
  const ok = await saveSpotToSupabase(spot);
  if (btn) { btn.disabled=false; btn.innerHTML='<i data-lucide="save" class="icon-sm"></i> Salvar Ponto'; lucide.createIcons(); }
  if (ok) { _pendingPhoto=undefined; coordPickerMap=null; coordMarker=null; showToast(`"${name}" salvo com sucesso!`, 'success'); setTimeout(()=>navigate('list'), 900); }
}

function selectTypeAdmin(type) {
  const inp = document.getElementById('f-type');
  if (inp) inp.value = type;
  const btnSpot  = document.getElementById('tsBtnSpot');
  const btnEvent = document.getElementById('tsBtnEvent');
  if (btnSpot && btnEvent) {
    btnSpot.style.background  = type === 'spot'  ? 'var(--ochre)' : 'transparent';
    btnSpot.style.color       = type === 'spot'  ? 'var(--deep)'  : 'var(--muted)';
    btnEvent.style.background = type === 'event' ? 'var(--ochre)' : 'transparent';
    btnEvent.style.color      = type === 'event' ? 'var(--deep)'  : 'var(--muted)';
  }
  const el = document.getElementById('adminEventDates');
  if (el) el.style.display = type === 'event' ? 'block' : 'none';
}

// mantido por compatibilidade
function toggleEventDatesAdmin(type) { selectTypeAdmin(type); }

// ══════════════════════════════════════════
//  DELETAR
// ══════════════════════════════════════════
function confirmDelete(id) {
  const s = getSpots().find(x => x.id===id);
  document.getElementById('confirmTitle').textContent = `Excluir "${s?.name}"?`;
  document.getElementById('confirmMsg').textContent = 'Esta ação não pode ser desfeita. O ponto e sua foto serão removidos do Supabase.';
  document.getElementById('confirmOk').onclick = () => { deleteSpot(id); closeModal(); };
  document.getElementById('confirmModal').classList.add('open');
}
async function deleteSpot(id) {
  const ok = await deleteSpotFromSupabase(id);
  if (ok) { showToast('Ponto excluído.', 'info'); if (currentView==='list') navigate('list'); else navigate('dashboard'); }
}
function closeModal() { document.getElementById('confirmModal').classList.remove('open'); }

// ══════════════════════════════════════════
//  BACKUP
// ══════════════════════════════════════════
function renderBackup() {
  return `
  <div class="page-header">
    <div class="page-title"><h2>Backup e Restauração</h2><p>Exporte ou importe dados do Supabase</p></div>
  </div>
  <div class="page-content">
    <div style="background:var(--panel);border:1px solid rgba(27,107,107,.4);border-radius:var(--radius);padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
      <i data-lucide="cloud" style="width:22px;height:22px;stroke:#7ecece;fill:none;stroke-width:1.5;flex-shrink:0"></i>
      <div>
        <div style="font-size:13.5px;font-weight:600;color:#7ecece">Supabase Ativo — sobral-cultural-storage</div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:2px">Dados em nuvem (PostgreSQL). Fotos no Supabase Storage. Sincronização em tempo real.</div>
      </div>
    </div>
    <div class="backup-area">
      <div class="backup-card">
        <div class="icon"><i data-lucide="download" style="width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.5"></i></div>
        <h3>Exportar Dados</h3>
        <p>Baixe todos os pontos como arquivo JSON para backup local de segurança.</p>
        <button class="btn btn-primary" onclick="exportData()">
          <i data-lucide="download" class="icon-sm"></i> Baixar Backup JSON
        </button>
      </div>
      <div class="backup-card">
        <div class="icon"><i data-lucide="upload" style="width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.5"></i></div>
        <h3>Importar Dados</h3>
        <p>Restaure um backup JSON anterior. Substituirá todos os dados atuais no Supabase.</p>
        <input type="file" accept=".json" id="importFile" style="display:none" onchange="importData(this)">
        <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
          <i data-lucide="upload" class="icon-sm"></i> Carregar Arquivo JSON
        </button>
      </div>
    </div>
    <div style="background:var(--panel);border:1px solid rgba(181,74,42,.3);border-radius:var(--radius);padding:18px;margin-top:20px">
      <div style="font-size:13.5px;font-weight:600;color:#e89e7e;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <i data-lucide="alert-triangle" style="width:14px;height:14px;stroke:#e89e7e;fill:none;stroke-width:2"></i> Informações
      </div>
      <div style="font-size:13px;color:var(--muted);line-height:1.6">
        • Dados salvos no Supabase — acessíveis de qualquer dispositivo com internet.<br>
        • Fotos no Supabase Storage com URL pública permanente.<br>
        • Atualizações refletem no mapa em tempo real via Realtime.<br>
        • Faça backups JSON periodicamente como proteção extra.
      </div>
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-danger" onclick="confirmReset()">
        <i data-lucide="rotate-ccw" class="icon-sm"></i> Restaurar Dados Padrão
      </button>
      <span style="font-size:12px;color:var(--muted);margin-left:12px">Apaga tudo e volta para os 8 pontos iniciais</span>
    </div>
  </div>`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(getSpots(), null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `sobral-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  showToast('Backup exportado com sucesso.', 'success');
}
function importData(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Formato inválido');
      document.getElementById('confirmTitle').textContent = 'Importar Backup no Supabase?';
      document.getElementById('confirmMsg').textContent = `Substituirá ${getSpots().length} pontos atuais por ${data.length} pontos do arquivo.`;
      document.getElementById('confirmOk').onclick = async () => {
        closeModal(); showToast('Importando…', 'info');
        await supa.from('spots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        for (const s of data) {
          const row = { id:s.id||crypto.randomUUID(), name:s.name, cat:s.cat, emoji:'', color:s.color, lat:s.lat, lng:s.lng, description:s.desc, address:s.address, horario:s.horario, entrada:s.entrada, photo:s.photo, blog_title:s.blogTitle, blog_content:s.blogContent, blog_author:s.blogAuthor, blog_date:s.blogDate, created_at:s.createdAt||new Date().toISOString() };
          await supa.from('spots').upsert(row, { onConflict:'id' });
        }
        await loadSpots(); showToast(`${data.length} pontos importados com sucesso!`, 'success'); navigate('dashboard');
      };
      document.getElementById('confirmModal').classList.add('open');
    } catch(err) { showToast('Arquivo inválido: ' + err.message, 'error'); }
  };
  reader.readAsText(file);
}
function confirmReset() {
  document.getElementById('confirmTitle').textContent = 'Restaurar dados padrão?';
  document.getElementById('confirmMsg').textContent = 'Todos os pontos atuais serão apagados do Supabase e substituídos pelos 8 pontos originais.';
  document.getElementById('confirmOk').onclick = async () => {
    closeModal(); showToast('Restaurando…', 'info');
    const defaults = [
      {id:'00000000-0000-0000-0000-000000000001',name:'Teatro São João',cat:'cultura',emoji:'',color:'#1B6B6B',lat:-3.6862,lng:-40.3507,description:'Inaugurado em 1880, um dos teatros mais antigos do Ceará.',address:'Praça Dom José, Centro — Sobral',horario:'Ter–Dom, 9h–18h',entrada:'Gratuita',blog_title:'Teatro São João: O Palco da Cultura Sobralense',blog_content:'<h2>Uma joia histórica do Ceará</h2><p>O Teatro São João é o coração cultural de Sobral.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-01-15',created_at:'2024-01-15T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000002',name:'Catedral de Nossa Senhora da Conceição',cat:'religioso',emoji:'',color:'#6440B4',lat:-3.6878,lng:-40.3495,description:'Símbolo majestoso de Sobral, construída no século XIX.',address:'Praça da Sé, Centro — Sobral',horario:'Diariamente, 7h–19h',entrada:'Gratuita',blog_title:'Catedral de Sobral: Fé e Patrimônio',blog_content:'<h2>Símbolo da Fé Nordestina</h2><p>O monumento mais imponente de Sobral.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-01-20',created_at:'2024-01-20T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000003',name:'Museu Diocesano Dom José',cat:'historico',emoji:'',color:'#B54A2A',lat:-3.6870,lng:-40.3502,description:'Um dos museus mais ricos do Ceará, abriga peças sacras e documentos históricos.',address:'Praça Dom José, Centro — Sobral',horario:'Ter–Sex, 8h–17h',entrada:'R$ 5,00',blog_title:'Museu Diocesano: Memória Viva de Sobral',blog_content:'<h2>Um Acervo Extraordinário</h2><p>Acervos sacros do Nordeste.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-02-01',created_at:'2024-02-01T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000004',name:'Parque da Cidade',cat:'natureza',emoji:'',color:'#3C7828',lat:-3.7048,lng:-40.3572,description:'O maior parque urbano de Sobral com trilhas e ciclovia.',address:'Av. John Sanford, Sobral',horario:'Diariamente, 5h–22h',entrada:'Gratuita',blog_title:'Parque da Cidade: O Verde no Coração de Sobral',blog_content:'<h2>Natureza Urbana</h2><p>O maior espaço verde de Sobral.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-02-10',created_at:'2024-02-10T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000005',name:'Corredor Cultural',cat:'cultura',emoji:'',color:'#1B6B6B',lat:-3.6855,lng:-40.3520,description:'Eixo de arte ao ar livre com grafites, esculturas e apresentações.',address:'Rua Conselheiro José Júlio, Centro — Sobral',horario:'Sempre aberto',entrada:'Gratuita',blog_title:'Corredor Cultural: Arte nas Ruas de Sobral',blog_content:'<h2>Arte Para Todos</h2><p>Arte democrática nas ruas de Sobral.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-02-15',created_at:'2024-02-15T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000006',name:'Mercado Municipal',cat:'cultura',emoji:'',color:'#1B6B6B',lat:-3.6892,lng:-40.3530,description:'Coração econômico com ervas, artesanato e comidas típicas.',address:'Praça do Mercado, Centro — Sobral',horario:'Seg–Sáb, 6h–18h',entrada:'Gratuita',blog_title:'Mercado Municipal: O Sabor Nordestino',blog_content:'<h2>Tradição e Sabor</h2><p>Patrimônio da cultura popular nordestina.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-02-20',created_at:'2024-02-20T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000007',name:'Morro do Urubu',cat:'natureza',emoji:'',color:'#3C7828',lat:-3.6730,lng:-40.3600,description:'Vista panorâmica de Sobral e da Serra da Meruoca.',address:'Zona Norte — Sobral',horario:'Diariamente (trilha)',entrada:'Gratuita',blog_title:'Morro do Urubu: Vista 360° de Sobral',blog_content:'<h2>No Topo da Cidade</h2><p>Vista panorâmica do norte cearense.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-03-01',created_at:'2024-03-01T00:00:00'},
      {id:'00000000-0000-0000-0000-000000000008',name:'Igreja Nossa Senhora do Rosário',cat:'religioso',emoji:'',color:'#6440B4',lat:-3.6895,lng:-40.3480,description:'Igreja do século XVIII construída pela irmandade dos escravizados.',address:'Rua João Pinheiro, Centro — Sobral',horario:'Ter–Dom, 8h–17h',entrada:'Gratuita',blog_title:'Igreja do Rosário: História e Resistência',blog_content:'<h2>Memória da Resistência Negra</h2><p>Símbolo de resistência e fé.</p>',blog_author:'Equipe Sobral Cultural',blog_date:'2024-03-05',created_at:'2024-03-05T00:00:00'}
    ];
    await supa.from('spots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    for (const r of defaults) await supa.from('spots').upsert(r, { onConflict:'id' });
    await loadSpots(); showToast('Dados restaurados com sucesso.', 'info'); navigate('dashboard');
  };
  document.getElementById('confirmModal').classList.add('open');
}

// ══════════════════════════════════════════
//  MODERATION
// ══════════════════════════════════════════
let _submissions = [];

async function loadSubmissions() {
  const { data } = await supa.from('submissions').select('*').order('created_at', { ascending: false });
  _submissions = data || [];
  const pending = _submissions.filter(s => s.status === 'pending').length;
  const badge = document.getElementById('modBadge');
  if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-flex' : 'none'; }
}

function renderModeration() {
  const pending  = _submissions.filter(s => s.status === 'pending');
  const approved = _submissions.filter(s => s.status === 'approved');
  const rejected = _submissions.filter(s => s.status === 'rejected');

  const renderCard = (s, showActions = false) => {
    const user = s.profiles?.full_name || 'Usuário';
    const dt   = new Date(s.created_at).toLocaleDateString('pt-BR');
    const typeLabel = s.type === 'event' ? 'Evento' : 'Ponto Turístico';
    return `<div style="background:var(--panel);border:1px solid var(--border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column">
      <div style="height:100px;overflow:hidden;background:var(--card);position:relative">
        ${s.photo
          ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;filter:brightness(.8)">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:.3">
               <i data-lucide="${CAT_ICONS[s.cat]||'map-pin'}" style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:1.5"></i>
             </div>`}
        <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.6);padding:2px 9px;border-radius:10px;font-size:10.5px;color:#fff">${typeLabel}</div>
      </div>
      <div style="padding:12px 14px;flex:1">
        <div style="font-weight:600;font-size:14px;color:var(--cream);margin-bottom:3px">${s.name}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">Por ${user} · ${dt}<br>${CAT_LABELS[s.cat]||s.cat||''} · ${s.address||'Sem endereço'}</div>
        ${s.description ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">${s.description.substring(0,120)}${s.description.length>120?'…':''}</div>` : ''}
        ${showActions ? `<div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:7px">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick="moderateSubmission('${s.id}','approved')">
              <i data-lucide="check" class="icon-sm"></i> Aprovar
            </button>
            <button class="btn btn-sm btn-danger" style="flex:1" onclick="promptReject('${s.id}')">
              <i data-lucide="x" class="icon-sm"></i> Rejeitar
            </button>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="previewSubmission('${s.id}')">
            <i data-lucide="eye" class="icon-sm"></i> Ver Detalhes
          </button>
        </div>` : `<div style="display:flex;gap:7px">
          ${s.status==='approved'
            ? `<button class="btn btn-sm btn-danger" onclick="moderateSubmission('${s.id}','rejected')">Revogar</button>`
            : `<button class="btn btn-sm btn-primary" onclick="moderateSubmission('${s.id}','approved')">Re-aprovar</button>`}
        </div>`}
      </div>
    </div>`;
  };

  return `
  <div class="page-header">
    <div class="page-title"><h2>Moderação de Conteúdo</h2><p>${pending.length} aguardando · ${approved.length} aprovado${approved.length!==1?'s':''} · ${rejected.length} rejeitado${rejected.length!==1?'s':''}</p></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="loadSubmissions().then(()=>navigate('moderation'))">
        <i data-lucide="refresh-cw" class="icon-sm"></i> Atualizar
      </button>
    </div>
  </div>
  <div class="page-content">
    ${pending.length > 0 ? `
    <div style="background:rgba(200,135,26,.08);border:1px solid rgba(200,135,26,.3);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
      <i data-lucide="clock" style="width:20px;height:20px;stroke:var(--ochre);fill:none;stroke-width:1.5;flex-shrink:0"></i>
      <div><strong style="color:var(--ochre)">${pending.length} submissão${pending.length!==1?'s':''} aguardando revisão</strong>
      <div style="font-size:12px;color:var(--muted)">Revise e aprove ou rejeite cada uma abaixo</div></div>
    </div>` : ''}

    <div class="section-title" style="margin-bottom:6px">Aguardando Aprovação (${pending.length})</div>
    ${pending.length === 0
      ? `<div class="empty-state" style="padding:28px">
           <div class="es-icon"><i data-lucide="check-circle" style="width:28px;height:28px;stroke:currentColor;fill:none;stroke-width:1.5;margin-bottom:8px;opacity:.5"></i></div>
           <p style="font-size:13px">Nenhuma submissão pendente.</p>
         </div>`
      : `<div class="spots-grid" style="margin-bottom:28px">${pending.map(s => renderCard(s, true)).join('')}</div>`}

    <div class="section-title" style="margin-bottom:6px">Aprovados (${approved.length})</div>
    ${approved.length === 0
      ? `<div style="font-size:13px;color:var(--muted);padding:16px 0 24px">Nenhuma submissão aprovada ainda.</div>`
      : `<div class="spots-grid" style="margin-bottom:28px">${approved.slice(0,6).map(s => renderCard(s, false)).join('')}</div>`}

    <div class="section-title" style="margin-bottom:6px">Rejeitados (${rejected.length})</div>
    ${rejected.length === 0
      ? `<div style="font-size:13px;color:var(--muted);padding:16px 0">Nenhuma submissão rejeitada.</div>`
      : `<div class="spots-grid">${rejected.slice(0,6).map(s => renderCard(s, false)).join('')}</div>`}
  </div>`;
}

async function moderateSubmission(id, status, adminNote = '') {
  const sub = _submissions.find(s => s.id === id);
  if (!sub) return;
  if (status === 'approved' && (sub.type === 'spot' || sub.type === 'event')) {
    const spotRow = { id:sub.id, name:sub.name, cat:sub.cat, emoji:'', color:sub.color||'#C8871A', lat:sub.lat, lng:sub.lng, description:sub.description, address:sub.address, horario:sub.horario, entrada:sub.entrada, photo:sub.photo, type:sub.type||'spot', event_date:sub.event_date||null, event_end:sub.event_end||null, blog_title:sub.name, blog_content:`<p>${sub.description||''}</p>`, blog_author:sub.profiles?.full_name||'Sobral Cultural', blog_date:new Date().toISOString().split('T')[0], created_at:new Date().toISOString() };
    await supa.from('spots').upsert(spotRow, { onConflict: 'id' });
  }
  if (status === 'rejected' && sub.status === 'approved' && (sub.type === 'spot' || sub.type === 'event')) {
    await supa.from('spots').delete().eq('id', sub.id);
  }
  await supa.from('submissions').update({ status, admin_note: adminNote, updated_at: new Date().toISOString() }).eq('id', id);
  await loadSubmissions();
  await loadSpots();
  showToast(`Submissão ${status === 'approved' ? 'aprovada' : 'rejeitada'}.`, status === 'approved' ? 'success' : 'info');
  navigate('moderation');
}

function promptReject(id) {
  const note = prompt('Motivo da rejeição (será exibido ao usuário):');
  if (note === null) return;
  moderateSubmission(id, 'rejected', note || 'Não atende aos critérios da plataforma.');
}

function previewSubmission(id) {
  const s = _submissions.find(x => x.id === id);
  if (!s) return;
  document.getElementById('confirmTitle').textContent = s.name;
  document.getElementById('confirmMsg').innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${s.type==='event'?'Evento':'Ponto'} · ${CAT_LABELS[s.cat]||s.cat} · ${new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
    ${s.photo ? `<img src="${s.photo}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:10px">` : ''}
    <div style="font-size:13px;line-height:1.6;color:var(--muted);background:rgba(0,0,0,.2);border-radius:8px;padding:12px">${s.description||'Sem descrição'}</div>
    <div style="font-size:12px;margin-top:10px;color:var(--muted)">${s.address||'—'} · ${s.horario||'—'} · ${s.entrada||'—'}</div>
    ${s.lat&&s.lng ? `<div style="font-size:11px;margin-top:6px;color:var(--muted)">Coords: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</div>` : ''}`;
  document.getElementById('confirmOk').textContent = 'Aprovar';
  document.getElementById('confirmOk').className = 'btn btn-primary';
  document.getElementById('confirmOk').onclick = () => { moderateSubmission(s.id,'approved'); closeModal(); };
  document.getElementById('confirmModal').classList.add('open');
}

// ══════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════
let _messages = [];

async function loadMessages() {
  const { data } = await supa.from('contacts').select('*').order('created_at', { ascending: false });
  _messages = data || [];
  const unread = _messages.filter(m => !m.read).length;
  const badge = document.getElementById('msgBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline-flex' : 'none'; }
}

function renderMessages() {
  const msgs = _messages;
  const unread = msgs.filter(m => !m.read).length;
  return `
  <div class="page-header">
    <div class="page-title"><h2>Mensagens de Contato</h2><p>${msgs.length} recebida${msgs.length!==1?'s':''} · <strong style="color:var(--ochre)">${unread} não lida${unread!==1?'s':''}</strong></p></div>
    <div class="page-actions">
      <button class="btn btn-secondary" onclick="markAllRead()">
        <i data-lucide="check-check" class="icon-sm"></i> Todas como lidas
      </button>
    </div>
  </div>
  <div class="page-content">
    ${msgs.length === 0
      ? `<div class="empty-state">
           <div class="es-icon"><i data-lucide="mail" style="width:48px;height:48px;stroke:currentColor;fill:none;stroke-width:1.5;opacity:.4"></i></div>
           <h3>Nenhuma mensagem ainda</h3>
           <p>Mensagens enviadas pela página de Contato aparecerão aqui.</p>
         </div>`
      : `<div style="overflow-x:auto"><table class="msg-table">
          <thead><tr><th>Status</th><th>Nome</th><th>E-mail</th><th>Assunto</th><th>Data</th><th></th></tr></thead>
          <tbody>${msgs.map(m => {
            const dt = new Date(m.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'});
            return `<tr class="msg-row ${!m.read?'unread':''}" onclick="openMessage('${m.id}')">
              <td><span class="msg-badge ${!m.read?'new':'read'}">${!m.read?'Nova':'Lida'}</span></td>
              <td style="font-weight:${!m.read?'600':'400'};white-space:nowrap">${m.name}</td>
              <td style="color:var(--muted)">${m.email}</td>
              <td style="color:var(--muted)">${m.subject||'—'}</td>
              <td style="color:var(--muted);white-space:nowrap">${dt}</td>
              <td onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteMsg('${m.id}')">
                  <i data-lucide="trash-2" class="icon-sm"></i>
                </button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`
    }
  </div>`;
}

function openMessage(id) {
  const m = _messages.find(x => x.id === id);
  if (!m) return;
  const dt = new Date(m.created_at).toLocaleString('pt-BR');
  document.getElementById('confirmTitle').textContent = m.name;
  document.getElementById('confirmMsg').innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${dt}${m.subject?` · ${m.subject}`:''}</div>
    <div style="font-size:13px;margin-bottom:12px">
      <strong style="color:var(--ochre)">Email:</strong> <a href="mailto:${m.email}" style="color:var(--ochre)">${m.email}</a>
      ${m.phone?` &nbsp;·&nbsp; <strong style="color:var(--ochre)">Tel:</strong> ${m.phone}`:''}
    </div>
    <div style="background:rgba(0,0,0,.25);border-radius:9px;padding:14px;font-size:13.5px;line-height:1.7;color:var(--muted);white-space:pre-wrap">${m.message}</div>`;
  document.getElementById('confirmOk').innerHTML = '<i data-lucide="mail" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2"></i> Responder por E-mail';
  document.getElementById('confirmOk').className = 'btn btn-primary';
  document.getElementById('confirmOk').onclick = () => { window.open(`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject||'Sobral Cultural')}`); closeModal(); };
  document.getElementById('confirmModal').classList.add('open');
  lucide.createIcons();
  if (!m.read) markRead(id);
}

async function markRead(id) {
  await supa.from('contacts').update({ read: true }).eq('id', id);
  await loadMessages();
  if (currentView === 'messages') { document.getElementById('mainContent').innerHTML = renderMessages(); lucide.createIcons(); }
}
async function markAllRead() {
  await supa.from('contacts').update({ read: true }).eq('read', false);
  await loadMessages();
  document.getElementById('mainContent').innerHTML = renderMessages();
  lucide.createIcons();
  showToast('Todas marcadas como lidas.', 'success');
}
function confirmDeleteMsg(id) {
  const m = _messages.find(x => x.id === id);
  document.getElementById('confirmTitle').textContent = `Excluir mensagem de "${m?.name}"?`;
  document.getElementById('confirmMsg').textContent = 'Esta ação não pode ser desfeita.';
  document.getElementById('confirmOk').textContent = 'Excluir';
  document.getElementById('confirmOk').className = 'btn btn-danger';
  document.getElementById('confirmOk').onclick = async () => {
    closeModal();
    await supa.from('contacts').delete().eq('id', id);
    await loadMessages();
    document.getElementById('mainContent').innerHTML = renderMessages();
    lucide.createIcons();
    showToast('Mensagem excluída.', 'info');
  };
  document.getElementById('confirmModal').classList.add('open');
}

// ══════════════════════════════════════════
//  PAGES MANAGER
// ══════════════════════════════════════════
const PAGE_DEFS = [
  { id:'sobre', icon:'info', name:'Sobre o Projeto', desc:'Conteúdo da página Sobre', url:'sobral_sobre.html' },
];
let _pagesCache = {};

async function loadPages() {
  const { data } = await supa.from('pages').select('*');
  _pagesCache = {};
  (data || []).forEach(p => { _pagesCache[p.id] = p; });
}

function renderPagesManager() {
  const custom = Object.values(_pagesCache).filter(p => !PAGE_DEFS.find(d => d.id === p.id));
  return `
  <div class="page-header">
    <div class="page-title"><h2>Gerenciar Páginas</h2><p>Crie, edite e exclua páginas do site</p></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="navigate('editPage','nova')">
        <i data-lucide="plus" class="icon-sm"></i> Nova Página
      </button>
    </div>
  </div>
  <div class="page-content">
    <div class="section-title" style="margin-bottom:6px">Páginas do Site</div>
    <div class="section-sub">Conteúdo editável das páginas fixas</div>
    <div class="pages-list" style="margin-bottom:28px">
      ${PAGE_DEFS.map(p => {
        const pg = _pagesCache[p.id];
        const upd = pg?.updated_at ? new Date(pg.updated_at).toLocaleDateString('pt-BR') : 'Nunca editada';
        return `<div class="page-item" onclick="navigate('editPage','${p.id}')">
          <div class="page-item-icon"><i data-lucide="${p.icon}" style="width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.5"></i></div>
          <div class="page-item-info"><div class="page-item-name">${p.name}</div><div class="page-item-meta">${p.desc} · Última edição: ${upd}</div></div>
          <div class="page-item-actions">
            <a href="${p.url}" target="_blank" class="btn btn-sm btn-ghost" onclick="event.stopPropagation()">
              <i data-lucide="eye" class="icon-sm"></i>
            </a>
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();navigate('editPage','${p.id}')">
              <i data-lucide="pencil" class="icon-sm"></i> Editar
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="section-title" style="margin-bottom:6px">Páginas Personalizadas</div>
    <div class="section-sub">Páginas extras criadas por você</div>
    <div class="pages-list">
      ${custom.length === 0
        ? `<div class="empty-state" style="padding:28px">
             <div class="es-icon"><i data-lucide="file-plus" style="width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.5;margin-bottom:10px;opacity:.4"></i></div>
             <p style="font-size:13px">Nenhuma página personalizada. Clique em "Nova Página" para criar.</p>
           </div>`
        : custom.map(p => `<div class="page-item" onclick="navigate('editPage','${p.id}')">
            <div class="page-item-icon"><i data-lucide="file-text" style="width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.5"></i></div>
            <div class="page-item-info"><div class="page-item-name">${p.title}</div><div class="page-item-meta">ID: ${p.id} · ${new Date(p.updated_at).toLocaleDateString('pt-BR')}</div></div>
            <div class="page-item-actions">
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();confirmDeletePage('${p.id}')">
                <i data-lucide="trash-2" class="icon-sm"></i>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();navigate('editPage','${p.id}')">
                <i data-lucide="pencil" class="icon-sm"></i>
              </button>
            </div>
          </div>`).join('')
      }
    </div>
  </div>`;
}

function renderPageEditor(pageId) {
  const isNew = pageId === 'nova';
  const predef = PAGE_DEFS.find(p => p.id === pageId);
  const existing = _pagesCache[pageId];
  const title = isNew ? 'Nova Página' : (predef?.name || existing?.title || 'Editar');
  const content = existing?.content || '';
  const pgTitle = existing?.title || predef?.name || '';
  return `
  <div class="page-header">
    <div class="page-title"><h2>${isNew ? 'Nova Página' : title}</h2><p>${isNew ? 'Preencha e salve para criar' : 'Edite e salve as alterações'}</p></div>
    <div class="page-actions">
      <button class="btn btn-ghost" onclick="navigate('pages')">← Cancelar</button>
      <button class="btn btn-primary" onclick="savePage('${pageId}')">
        <i data-lucide="save" class="icon-sm"></i> Salvar
      </button>
    </div>
  </div>
  <div class="page-content">
    <div class="form-section" id="sec-pageinfo">
      <div class="form-section-header" onclick="toggleSection('pageinfo')">
        <span class="form-section-icon"><i data-lucide="file-text" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Informações</h3><span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div class="form-row cols-2">
          <div class="form-group">
            <label>Título <em>*</em></label>
            <input id="pg-title" placeholder="Ex: Sobre o Projeto" value="${pgTitle}" ${predef&&!isNew?'readonly style="opacity:.6"':''}>
          </div>
          <div class="form-group">
            <label>ID / Slug ${isNew?'<em>*</em>':''}</label>
            <input id="pg-id" placeholder="ex: sobre" value="${isNew?'':pageId}" ${!isNew?'readonly style="opacity:.6"':''}>
            <div class="helper">Minúsculas, sem espaços.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="form-section" id="sec-pagecontent">
      <div class="form-section-header" onclick="toggleSection('pagecontent')">
        <span class="form-section-icon"><i data-lucide="file-text" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5"></i></span>
        <h3>Conteúdo da Página</h3><span class="form-section-toggle">▾</span>
      </div>
      <div class="form-section-body">
        <div class="helper" style="margin-bottom:12px">Editor de texto rico. O conteúdo é salvo no Supabase e exibido automaticamente no site.</div>
        <div class="page-editor-wrap">
          <div class="editor-toolbar">
            <button onclick="fmtPg('bold')"><b>B</b></button>
            <button onclick="fmtPg('italic')"><i>I</i></button>
            <div class="sep"></div>
            <button onclick="fmtPg('formatBlock','h2')">H2</button>
            <button onclick="fmtPg('formatBlock','h3')">H3</button>
            <button onclick="fmtPg('formatBlock','p')">¶</button>
            <div class="sep"></div>
            <button onclick="fmtPg('insertUnorderedList')">•</button>
            <button onclick="fmtPg('insertOrderedList')">1.</button>
            <button onclick="fmtPg('formatBlock','blockquote')">❝</button>
            <div class="sep"></div>
            <button onclick="insertPgLink()">
              <i data-lucide="link" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2"></i>
            </button>
            <button onclick="fmtPg('removeFormat')">✕</button>
          </div>
          <div id="pageEditor" class="blog-editor" contenteditable="true">${content||'<p>Escreva aqui o conteúdo da página…</p>'}</div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
      <button class="btn btn-ghost" onclick="navigate('pages')">← Cancelar</button>
      <button class="btn btn-primary" onclick="savePage('${pageId}')">
        <i data-lucide="save" class="icon-sm"></i> Salvar
      </button>
    </div>
  </div>`;
}

function initPageEditor(pageId) { /* nothing extra needed */ }
function fmtPg(cmd, val=null) { document.execCommand(cmd, false, val); document.getElementById('pageEditor')?.focus(); }
function insertPgLink() { const u=prompt('URL:'); if(u) document.execCommand('createLink',false,u); }

async function savePage(pageId) {
  const isNew = pageId === 'nova';
  const pgTitle = document.getElementById('pg-title')?.value?.trim();
  const pgId = isNew
    ? (document.getElementById('pg-id')?.value?.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))
    : pageId;
  const content = document.getElementById('pageEditor')?.innerHTML || '';
  if (!pgTitle) { showToast('Preencha o título.', 'error'); return; }
  if (!pgId) { showToast('Preencha o ID da página.', 'error'); return; }
  const { error } = await supa.from('pages').upsert({ id:pgId, title:pgTitle, content, updated_at:new Date().toISOString() }, { onConflict:'id' });
  if (error) { showToast('Erro ao salvar: ' + error.message, 'error'); return; }
  await loadPages();
  showToast(`"${pgTitle}" salva com sucesso!`, 'success');
  setTimeout(() => navigate('pages'), 900);
}

async function confirmDeletePage(id) {
  const p = _pagesCache[id];
  document.getElementById('confirmTitle').textContent = `Excluir "${p?.title}"?`;
  document.getElementById('confirmMsg').textContent = 'Esta ação não pode ser desfeita.';
  document.getElementById('confirmOk').textContent = 'Excluir';
  document.getElementById('confirmOk').className = 'btn btn-danger';
  document.getElementById('confirmOk').onclick = async () => {
    closeModal();
    await supa.from('pages').delete().eq('id', id);
    await loadPages();
    navigate('pages');
    showToast('Página excluída.', 'info');
  };
  document.getElementById('confirmModal').classList.add('open');
}

// ══════════════════════════════════════════
//  HELPERS GERAIS
// ══════════════════════════════════════════
function fmt(cmd, val=null) { document.execCommand(cmd, false, val); document.getElementById('blogEditor')?.focus(); }
function insertLink() { const url = prompt('URL do link:'); if (url) document.execCommand('createLink', false, url); }
function pickColor(c) {
  document.getElementById('f-color').value = c;
  document.querySelectorAll('.color-opt').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
}
function toggleSection(name) { document.getElementById('sec-'+name)?.classList.toggle('collapsed'); }
function updateCharCount() { const v = document.getElementById('f-desc')?.value||''; const el = document.getElementById('descCount'); if (el) el.textContent = `${v.length}/350`; }

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const iconMap = { success: 'check-circle', error: 'x-circle', info: 'info' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i data-lucide="${iconMap[type]||'info'}" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0"></i> <span>${msg}</span>`;
  c.appendChild(t);
  lucide.createIcons({ el: t });
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(60px)'; setTimeout(()=>t.remove(),300); }, 3500);
}

// ══════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════
window.onload = async () => {
  lucide.createIcons();
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    const { data: prof } = await supa.from('profiles').select('role').eq('id', session.user.id).single();
    if (prof?.role === 'admin') {
      window._adminUser = session.user;
      showLoginOverlay(false);
      showToast('Conectando ao Supabase…', 'info');
      await Promise.all([loadSpots(), loadMessages(), loadPages(), loadSubmissions()]);
      startRealtime();
      navigate('dashboard');
      return;
    }
  }
  showLoginOverlay(true);
};
window.addEventListener('beforeunload', () => { if (coordPickerMap) { coordPickerMap.remove(); coordPickerMap=null; } });
