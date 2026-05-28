/* ═══════════════════════════════════════════════════════════════
   sobral_chat.js — Chat Privado por Proximidade
   Lógica: auth → geoloc → listar próximos → chat 1-a-1 realtime
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Supabase ────────────────────────────────────────────────────
const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = window.supa = supabase.createClient(SU, SK);

// ── Constantes ──────────────────────────────────────────────────
const MAX_DIST_KM   = 14;      // distância máxima para conversar
const GEO_MAX_AGE   = 30 * 60; // posição válida por 30 min (segundos)
const LOC_TTL_MIN   = 30;      // tempo máximo que uma posição é considerada "recente"
const MSG_PAGE_SIZE = 60;      // mensagens carregadas por conversa

// ── Estado global ────────────────────────────────────────────────
let USER         = null;   // auth user
let MY_PROFILE   = null;   // profile do usuário logado
let MY_LAT       = null;
let MY_LNG       = null;
let NEARBY_USERS = [];     // usuários próximos com distância calculada
let FILTERED_USERS = [];   // após busca
let ACTIVE_USER  = null;   // usuário com quem estamos conversando
let ACTIVE_CONV  = null;   // conversa ativa { id, user1_id, user2_id }
let MESSAGES     = [];     // mensagens carregadas
let REALTIME_CH  = null;   // canal Supabase Realtime
let searchTerm   = '';

// ── Rate Limiting (client-side) ──────────────────────────────────
const RATE_LIMIT      = 20;   // máx. mensagens
const RATE_WINDOW_MS  = 60000; // por 1 minuto
let sentTimestamps    = [];    // timestamps das mensagens enviadas

// ── Drawer/topbar ────────────────────────────────────────────────
function toggleDrw() { ['hbg','drw','dov'].forEach(id => document.getElementById(id)?.classList.toggle('open')); }
function closeDrw()  { ['hbg','drw','dov'].forEach(id => document.getElementById(id)?.classList.remove('open')); }

// ── Toast ────────────────────────────────────────────────────────
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type === 'ok' ? 'ok' : type === 'err' ? 'err' : '');
  setTimeout(() => t.className = 'toast', 3800);
}

// ── Haversine: distância entre dois pontos (km) ──────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Formatações ──────────────────────────────────────────────────
function fmtDist(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' '
    + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateSep(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function avatarHtml(profile, size = 44) {
  const name = profile.full_name || 'U';
  const initial = name.charAt(0).toUpperCase();
  if (profile.avatar_url) {
    return `<img src="${profile.avatar_url}" alt="${name}" loading="lazy">`;
  }
  return `<span style="font-size:${Math.round(size*0.38)}px">${initial}</span>`;
}

// ── Show/hide panels ─────────────────────────────────────────────
function showState(id) {
  ['stateNoAuth','stateNoGeo','stateLocating','chatMain'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'flex' : 'none';
  });
}

// ── INIT ─────────────────────────────────────────────────────────
async function init() {
  // Aguarda Supabase
  if (!window.supabase) {
    await new Promise(r => setTimeout(r, 600));
  }

  const { data: { session } } = await supa.auth.getSession();
  USER = session?.user || null;

  if (!USER) {
    showState('stateNoAuth');
    return;
  }

  // Busca perfil
  const { data: prof } = await supa.from('profiles').select('*').eq('id', USER.id).single();
  MY_PROFILE = prof || { id: USER.id, full_name: USER.user_metadata?.full_name || 'Você' };

  // 1. Tenta usar a última localização salva no banco se for recente (menos de LOC_TTL_MIN min)
  if (MY_PROFILE.location_updated_at && MY_PROFILE.lat && MY_PROFILE.lng) {
    const lastUpdate = new Date(MY_PROFILE.location_updated_at);
    const diffMins = (new Date() - lastUpdate) / 1000 / 60;
    
    if (diffMins < LOC_TTL_MIN && MY_PROFILE.location_active) {
      MY_LAT = MY_PROFILE.lat;
      MY_LNG = MY_PROFILE.lng;
      showState('chatApp');
      startLocationWatcher();
      loadNearbyUsers();
      return;
    }
  }

  // 2. Se o navegador já tem permissão concedida, ativa automaticamente
  if (navigator.permissions && navigator.geolocation) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        activateLocation();
        return;
      }
    } catch (e) {
      // Ignora erro de permissões antigas
    }
  }

  // 3. Caso contrário, pede para clicar no botão "Ativar Localização"
  showState('stateNoGeo');
}

// ── Ativar localização ────────────────────────────────────────────
async function activateLocation() {
  if (!navigator.geolocation) {
    toast('Geolocalização não suportada pelo seu navegador.', 'err');
    return;
  }
  showState('stateLocating');

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      MY_LAT = pos.coords.latitude;
      MY_LNG = pos.coords.longitude;

      // Salva localização no perfil
      await supa.from('profiles').update({
        lat: MY_LAT,
        lng: MY_LNG,
        location_active: true,
        location_updated_at: new Date().toISOString()
      }).eq('id', USER.id);

      // Mostra interface principal
      document.getElementById('chatMain').style.display = 'flex';
      showState('chatMain');
      loadNearbyUsers();

      // Atualiza localização periodicamente (a cada 5 min)
      setInterval(updateLocationSilent, 5 * 60 * 1000);
    },
    (err) => {
      console.warn('Geo error:', err);
      showState('stateNoGeo');
      toast('Não foi possível obter sua localização. Verifique as permissões.', 'err');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function startLocationWatcher() {
  document.getElementById('chatMain').style.display = 'flex';
  showState('chatMain');
  setInterval(updateLocationSilent, 5 * 60 * 1000);
}

async function updateLocationSilent() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    MY_LAT = pos.coords.latitude;
    MY_LNG = pos.coords.longitude;
    await supa.from('profiles').update({
      lat: MY_LAT,
      lng: MY_LNG,
      location_updated_at: new Date().toISOString()
    }).eq('id', USER.id);
  }, () => {}, { timeout: 10000 });
}

// ── Carregar usuários próximos ────────────────────────────────────
async function loadNearbyUsers() {
  const listEl = document.getElementById('userList');
  listEl.innerHTML = `
    <div class="skeleton-user shimmer"></div>
    <div class="skeleton-user shimmer" style="opacity:.7"></div>
    <div class="skeleton-user shimmer" style="opacity:.4"></div>`;

  // Limite temporal: localização atualizada há menos de LOC_TTL_MIN min
  const cutoff = new Date(Date.now() - LOC_TTL_MIN * 60 * 1000).toISOString();

  // Busca bloqueios (onde eu bloqueei ou fui bloqueado)
  const { data: blocks } = await supa.from('chat_blocks').select('blocker_id, blocked_id');
  const blockedIds = new Set(
    (blocks || []).map(b => b.blocker_id === USER.id ? b.blocked_id : b.blocker_id)
  );

  const { data: profiles, error } = await supa
    .from('profiles')
    .select('id, full_name, avatar_url, bio, lat, lng, location_updated_at')
    .eq('location_active', true)
    .gte('location_updated_at', cutoff)
    .neq('id', USER.id);

  if (error) {
    listEl.innerHTML = `<div class="list-empty"><div class="list-empty-icon"><i data-lucide="alert-triangle"></i></div>Erro ao carregar membros.</div>`;
    window.lucide?.createIcons();
    return;
  }

  // Calcula distância e filtra ≤ MAX_DIST_KM, e ignora bloqueados
  NEARBY_USERS = (profiles || [])
    .filter(p => p.lat != null && p.lng != null && !blockedIds.has(p.id))
    .map(p => ({
      ...p,
      distance: haversine(MY_LAT, MY_LNG, p.lat, p.lng)
    }))
    .sort((a, b) => a.distance - b.distance);

  // Badge com raio
  document.getElementById('myDistBadge').innerHTML =
    `<i data-lucide="map-pin" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-top:-2px"></i> ${NEARBY_USERS.length} membro${NEARBY_USERS.length !== 1 ? 's' : ''} próximo${NEARBY_USERS.length !== 1 ? 's' : ''}`;
  window.lucide?.createIcons();

  FILTERED_USERS = NEARBY_USERS;
  renderUserList(FILTERED_USERS);
}

function renderUserList(users) {
  const listEl = document.getElementById('userList');
  if (!users.length) {
    listEl.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">🌍</div>
        <strong>Nenhum membro próximo</strong><br>
        Não há membros com localização ativa em um raio de ${MAX_DIST_KM} km.
      </div>`;
    return;
  }

  listEl.innerHTML = users.map((u, i) => {
    const tooFar  = u.distance > MAX_DIST_KM;
    const distStr = fmtDist(u.distance);
    const isActive = ACTIVE_USER?.id === u.id;

    return `
      <div class="user-card${isActive ? ' active' : ''}"
           id="ucard-${u.id}"
           onclick="openChat('${u.id}')"
           style="animation-delay:${i * 0.04}s"
           title="${tooFar ? `Muito longe (${distStr}). Máximo: ${MAX_DIST_KM} km` : `Abrir conversa com ${u.full_name}`}">
        <div class="user-avatar">
          ${avatarHtml(u, 44)}
          ${!tooFar ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="user-card-info">
          <div class="user-card-name">${u.full_name || 'Membro'}</div>
          <div class="user-card-sub">${u.bio ? u.bio.substring(0, 35) + (u.bio.length > 35 ? '…' : '') : 'Membro Sobral Cultural'}</div>
        </div>
        <span class="dist-badge${tooFar ? ' far' : ''}">${distStr}</span>
      </div>`;
  }).join('');

  window.lucide?.createIcons();
}

// ── Filtro de busca ───────────────────────────────────────────────
function filterUsers(term) {
  searchTerm = term.toLowerCase().trim();
  FILTERED_USERS = searchTerm
    ? NEARBY_USERS.filter(u => (u.full_name || '').toLowerCase().includes(searchTerm))
    : NEARBY_USERS;
  renderUserList(FILTERED_USERS);
}

// ── Refresh ───────────────────────────────────────────────────────
async function refreshNearby() {
  const btn = document.getElementById('btnRefresh');
  btn.classList.add('spinning');
  await loadNearbyUsers();
  btn.classList.remove('spinning');
  toast('Lista atualizada!', 'ok');
}

// ── Abrir conversa ────────────────────────────────────────────────
async function openChat(userId) {
  const profile = NEARBY_USERS.find(u => u.id === userId);
  if (!profile) return;

  // Verifica distância
  if (profile.distance > MAX_DIST_KM) {
    toast(`${profile.full_name} está a ${fmtDist(profile.distance)} de você. Máximo permitido: ${MAX_DIST_KM} km.`, 'err');
    return;
  }

  ACTIVE_USER = profile;

  // Marca card ativo
  document.querySelectorAll('.user-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`ucard-${userId}`)?.classList.add('active');

  // Mobile: esconde sidebar, mostra área de chat
  document.getElementById('chatSidebar').classList.add('hidden-mobile');
  document.getElementById('chatArea').classList.add('active-mobile');

  // Exibe conversa
  document.getElementById('chatEmpty').style.display       = 'none';
  document.getElementById('chatConversation').style.display = 'flex';

  // Preenche header
  document.getElementById('convAvatar').innerHTML = avatarHtml(profile, 40);
  document.getElementById('convName').textContent  = profile.full_name || 'Membro';
  document.getElementById('convDist').innerHTML    =
    `<i data-lucide="map-pin" style="width:11px;height:11px"></i> ${fmtDist(profile.distance)} de distância`;

  window.lucide?.createIcons();

  // Carrega ou cria conversa
  await loadOrCreateConversation(userId);
}

// ── Voltar (mobile) ───────────────────────────────────────────────
function backToList() {
  document.getElementById('chatSidebar').classList.remove('hidden-mobile');
  document.getElementById('chatArea').classList.remove('active-mobile');
  document.getElementById('chatConversation').style.display = 'none';
  document.getElementById('chatEmpty').style.display        = 'flex';
  ACTIVE_USER = null;
  ACTIVE_CONV = null;
  unsubRealtime();
}

// ── Conversa (criar ou buscar) ────────────────────────────────────
async function loadOrCreateConversation(otherUserId) {
  const msgArea = document.getElementById('messagesArea');
  msgArea.innerHTML = `
    <div class="messages-loading">
      <div class="skeleton-msg right shimmer"></div>
      <div class="skeleton-msg left shimmer" style="width:40%;opacity:.7"></div>
      <div class="skeleton-msg right shimmer" style="width:50%;opacity:.5"></div>
    </div>`;

  // Busca conversa existente (ordem dos IDs normalizada)
  const { data: existing } = await supa
    .from('chat_conversations')
    .select('*')
    .or(`and(user1_id.eq.${USER.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${USER.id})`)
    .maybeSingle();

  if (existing) {
    ACTIVE_CONV = existing;
  } else {
    // Cria nova conversa
    const { data: created, error } = await supa
      .from('chat_conversations')
      .insert({ user1_id: USER.id, user2_id: otherUserId })
      .select()
      .single();

    if (error) {
      msgArea.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(245,237,216,.4)">Erro ao iniciar conversa.</div>`;
      return;
    }
    ACTIVE_CONV = created;
  }

  await loadMessages();
  await markMessagesAsRead();
  subscribeRealtime();
}

async function markMessagesAsRead() {
  if (!ACTIVE_CONV || !USER) return;
  
  // Atualiza no banco as mensagens recebidas
  await supa
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', ACTIVE_CONV.id)
    .neq('sender_id', USER.id)
    .is('read_at', null);

  // Zera badge global na interface se existir a função
  if (window.resetGlobalUnreadBadge) window.resetGlobalUnreadBadge();
}

// ── Carregar mensagens ────────────────────────────────────────────
async function loadMessages() {
  const { data, error } = await supa
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', ACTIVE_CONV.id)
    .order('created_at', { ascending: true })
    .limit(MSG_PAGE_SIZE);

  if (error) {
    document.getElementById('messagesArea').innerHTML =
      `<div style="text-align:center;padding:32px;color:rgba(245,237,216,.4)">Erro ao carregar mensagens.</div>`;
    return;
  }

  MESSAGES = data || [];
  renderMessages();
}

// ── Renderizar mensagens ──────────────────────────────────────────
function renderMessages() {
  const area = document.getElementById('messagesArea');
  if (!MESSAGES.length) {
    area.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;opacity:.5;text-align:center;padding:32px">
        <div style="color:var(--cream);opacity:.8"><i data-lucide="message-square" style="width:40px;height:40px;stroke-width:1.5"></i></div>
        <div style="font-size:14px;color:var(--cream);font-weight:600">Início da conversa</div>
        <div style="font-size:13px;color:rgba(245,237,216,.5)">Diga olá para ${ACTIVE_USER?.full_name?.split(' ')[0] || 'esse membro'}!</div>
        <div style="font-size:11px;color:var(--ochre);margin-top:12px;padding:6px 12px;background:rgba(200,135,26,.1);border-radius:12px;border:1px solid rgba(200,135,26,.2)">
          <i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-top:-2px"></i> Mensagens são apagadas automaticamente após 24h.
        </div>
      </div>`;
    return;
  }

  let html = '';
  let lastDate = '';
  let lastSender = '';

  MESSAGES.forEach((msg, i) => {
    const isMine   = msg.sender_id === USER.id;
    const dateStr  = fmtDateSep(msg.created_at);
    const grouped  = lastSender === msg.sender_id;
    lastSender     = msg.sender_id;

    if (dateStr !== lastDate) {
      html += `<div class="date-separator">${dateStr}</div>`;
      lastDate = dateStr;
    }

    const miniAvatar = !isMine
      ? `<div class="msg-mini-avatar">${avatarHtml(ACTIVE_USER, 28)}</div>`
      : '';

    html += `
      <div class="msg-row ${isMine ? 'mine' : 'other'}${grouped ? ' grouped' : ''}" data-msg="${msg.id}">
        ${miniAvatar}
        <div>
          <div class="msg-bubble">${escapeHtml(msg.text)}<span class="msg-time">${fmtTime(msg.created_at)}</span></div>
        </div>
      </div>`;
  });

  area.innerHTML = html;
  scrollToBottom();
  window.lucide?.createIcons();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function scrollToBottom() {
  const area = document.getElementById('messagesArea');
  if (area) area.scrollTop = area.scrollHeight;
}

// ── Enviar mensagem ───────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text || !ACTIVE_CONV) return;
  if (text.length > 1000) { toast('Mensagem muito longa (máx. 1000 caracteres).', 'err'); return; }

  // Rate limit client-side
  const now = Date.now();
  sentTimestamps = sentTimestamps.filter(t => now - t < RATE_WINDOW_MS);
  if (sentTimestamps.length >= RATE_LIMIT) {
    const waitSec = Math.ceil((RATE_WINDOW_MS - (now - sentTimestamps[0])) / 1000);
    toast(`Muitas mensagens seguidas. Aguarde ${waitSec}s.`, 'err');
    return;
  }
  sentTimestamps.push(now);

  input.value = '';
  input.style.height = '';
  input.focus();

  // Otimista: adiciona na tela antes de confirmar
  const tempMsg = {
    id: 'temp-' + Date.now(),
    conversation_id: ACTIVE_CONV.id,
    sender_id: USER.id,
    text,
    created_at: new Date().toISOString()
  };
  MESSAGES.push(tempMsg);
  renderMessages();

  const { data, error } = await supa
    .from('chat_messages')
    .insert({
      conversation_id: ACTIVE_CONV.id,
      sender_id: USER.id,
      text
    })
    .select()
    .single();

  if (error) {
    toast('Erro ao enviar mensagem.', 'err');
    MESSAGES = MESSAGES.filter(m => m.id !== tempMsg.id);
    renderMessages();
    input.value = text;
    return;
  }

  // Substitui temporário pelo real
  MESSAGES = MESSAGES.filter(m => m.id !== tempMsg.id);
  MESSAGES.push(data);
  renderMessages();

  // Atualiza last_message
  await supa.from('chat_conversations').update({
    last_message_at: data.created_at,
    last_message_text: text.substring(0, 80)
  }).eq('id', ACTIVE_CONV.id);
}

// ── Realtime ──────────────────────────────────────────────────────
function subscribeRealtime() {
  unsubRealtime();

  REALTIME_CH = supa
    .channel(`chat_conv_${ACTIVE_CONV.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${ACTIVE_CONV.id}`
    }, (payload) => {
      const msg = payload.new;
      // Se não for minha, adiciona à tela
      if (msg.sender_id !== USER.id) {
        MESSAGES.push(msg);
        renderMessages();
        markMessagesAsRead(); // Marca como lida assim que chega
      }
    })
    .subscribe();
}

function unsubRealtime() {
  if (REALTIME_CH) {
    supa.removeChannel(REALTIME_CH);
    REALTIME_CH = null;
  }
}

// ── Teclado ───────────────────────────────────────────────────────
function handleMsgKey(e) {
  // Enter envia, Shift+Enter quebra linha
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResizeInput(el) {
  el.style.height = '';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Cleanup ao sair da página ────────────────────────────────────
window.addEventListener('beforeunload', async () => {
  unsubRealtime();
  // Marca localização como inativa ao sair
  if (USER) {
    await supa.from('profiles').update({ location_active: false }).eq('id', USER.id);
  }
});

// ── Start ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Aguarda Supabase JS carregar (defer)
  if (window.supabase) {
    init();
  } else {
    document.querySelector('script[src*="supabase"]')
      ?.addEventListener('load', init);
    // Fallback
    setTimeout(init, 800);
  }
});

// ── Opções da Conversa ────────────────────────────────────────────
function toggleConvOptions() {
  document.getElementById('convOptMenu')?.classList.toggle('open');
}

// Fecha o menu de opções se clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.conv-options')) {
    document.getElementById('convOptMenu')?.classList.remove('open');
  }
});

// ── Sistema de Bloqueio ───────────────────────────────────────────
async function promptBlockUser() {
  toggleConvOptions();
  if (!ACTIVE_USER) return;
  const conf = confirm(`Tem certeza que deseja bloquear ${ACTIVE_USER.full_name}? Vocês não poderão mais se ver nem trocar mensagens.`);
  if (!conf) return;

  await executeBlock(ACTIVE_USER.id);
  toast('Usuário bloqueado com sucesso.', 'ok');
}

async function executeBlock(targetId) {
  // 1. Insere na tabela chat_blocks
  const { error } = await supa.from('chat_blocks').insert({
    blocker_id: USER.id,
    blocked_id: targetId
  });

  if (error && error.code !== '23505') { // ignora erro de unique constraint se já estiver bloqueado
    toast('Erro ao bloquear usuário.', 'err');
    return;
  }

  // 2. Fecha conversa ativa e atualiza lista
  backToList();
  await loadNearbyUsers();
}

// ── Sistema de Denúncia ───────────────────────────────────────────
function openReportModal() {
  toggleConvOptions();
  document.getElementById('reportModal').style.display = 'flex';
  document.getElementById('reportDetails').value = '';
  const radios = document.getElementsByName('reportReason');
  radios.forEach(r => r.checked = false);
}

function closeReportModal() {
  document.getElementById('reportModal').style.display = 'none';
}

async function submitReport() {
  if (!ACTIVE_USER) return;

  const reasonEl = document.querySelector('input[name="reportReason"]:checked');
  if (!reasonEl) {
    toast('Selecione um motivo para a denúncia.', 'err');
    return;
  }

  const reason = reasonEl.value;
  const details = document.getElementById('reportDetails').value.trim();

  // Desabilita botão enquanto envia
  const btn = document.querySelector('.btn-primary.danger');
  const originalText = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  // 1. Insere denúncia
  const { error } = await supa.from('chat_reports').insert({
    reporter_id: USER.id,
    reported_id: ACTIVE_USER.id,
    reason,
    details
  });

  btn.textContent = originalText;
  btn.disabled = false;

  if (error) {
    toast('Erro ao enviar denúncia. Tente novamente.', 'err');
    return;
  }

  // 2. Fecha modal e bloqueia usuário automaticamente
  closeReportModal();
  toast('Denúncia enviada. O usuário foi bloqueado.', 'ok');
  await executeBlock(ACTIVE_USER.id);
}
