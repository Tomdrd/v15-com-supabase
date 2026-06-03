/* ═══════════════════════════════════════════════════════════════
   sobral_chat.js — Chat Privado por Proximidade
   Lógica: auth → geoloc → listar próximos → chat 1-a-1 realtime
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Constantes ──────────────────────────────────────────────────
const MAX_DIST_KM   = 14;      // distância máxima para conversar
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
let ALBUM_COUNTS = {}; // { userId: photoCount }
let FRIEND_RELATIONS = {}; // { userId: friendRequest }
let FRIEND_FILTER = 'all'; // all, friends, pending, not_friends
let LOCATION_INTERVAL = null; // referência do setInterval de localização

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
// ── Modal E2EE ───────────────────────────────────────────────────
/**
 * Exibe o modal de configuração de criptografia.
 * mode: 'create'  → primeiro acesso, cria par + senha
 *       'restore' → dispositivo novo, restaura par com a senha
 *       'reset'   → esqueceu a senha, gera par novo
 * Retorna quando o usuário conclui ou cancela (sem E2EE).
 */
function e2eeSetupModal(mode) {
  return new Promise(resolve => {
    // Remove modal anterior se existir
    document.getElementById('e2eeModal')?.remove();

    const isCreate  = mode === 'create';
    const isRestore = mode === 'restore';
    const isProtect = mode === 'protect';

    const modal = document.createElement('div');
    modal.id = 'e2eeModal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.7);backdrop-filter:blur(6px);
    `;

    modal.innerHTML = `
      <div style="
        background:var(--deep,#1a1410);
        border:1px solid rgba(200,135,26,.3);
        border-radius:16px;padding:32px;
        width:min(420px,90vw);
        box-shadow:0 24px 64px rgba(0,0,0,.6);
      ">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <i data-lucide="lock" style="width:22px;height:22px;color:var(--ochre,#c8871a)"></i>
          <h2 style="margin:0;font-size:18px;color:var(--cream,#f5edd8);font-weight:600">
            ${isCreate  ? 'Proteja suas mensagens' :
              isRestore ? 'Acessar chat neste dispositivo' :
              isProtect ? 'Crie uma senha para suas chaves' :
                          'Criar nova chave de criptografia'}
          </h2>
        </div>
        <p style="font-size:13px;color:rgba(245,237,216,.6);margin:0 0 20px;line-height:1.6">
          ${isCreate
            ? 'Crie uma senha para criptografar suas mensagens. <strong style="color:var(--ochre)">Guarde-a bem</strong> — você vai precisar dela em novos dispositivos.'
            : isProtect
            ? 'Sua chave ainda não está protegida. Crie uma senha para acessar o chat em outros dispositivos.'
            : isRestore
            ? 'Digite a senha que você criou no primeiro acesso para restaurar sua chave de criptografia neste dispositivo.'
            : 'Você vai perder acesso às mensagens anteriores. Mensagens novas funcionarão normalmente.'}
        </p>

        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="position:relative">
            <input id="e2eePass" type="password" placeholder="Senha de criptografia"
              autocomplete="${(isCreate || isProtect) ? 'new-password' : 'current-password'}"
              style="
                width:100%;box-sizing:border-box;
                background:rgba(255,255,255,.06);
                border:1px solid rgba(200,135,26,.25);
                border-radius:10px;padding:12px 44px 12px 14px;
                color:var(--cream,#f5edd8);font-size:14px;outline:none;
              "/>
            <i id="e2eeToggle" data-lucide="eye" style="
              position:absolute;right:14px;top:50%;transform:translateY(-50%);
              width:18px;height:18px;color:rgba(245,237,216,.4);cursor:pointer;
            "></i>
          </div>

          ${(isCreate || isProtect) ? `
          <input id="e2eePassConfirm" type="password" placeholder="Confirmar senha"
            autocomplete="new-password"
            style="
              background:rgba(255,255,255,.06);
              border:1px solid rgba(200,135,26,.25);
              border-radius:10px;padding:12px 14px;
              color:var(--cream,#f5edd8);font-size:14px;outline:none;
              box-sizing:border-box;width:100%;
            "/>
          ` : ''}

          <p id="e2eeError" style="
            color:#f87171;font-size:12px;margin:0;min-height:16px;
          "></p>

          <button id="e2eeSubmit" style="
            background:var(--ochre,#c8871a);color:#1a1410;
            border:none;border-radius:10px;padding:13px;
            font-size:14px;font-weight:700;cursor:pointer;
            transition:opacity .15s;
          ">
            ${isCreate ? 'Criar senha' : isRestore ? 'Entrar' : isProtect ? 'Salvar senha' : 'Criar nova chave'}
          </button>

          <button id="e2eeSkip" style="
            background:transparent;color:rgba(245,237,216,.4);
            border:none;padding:8px;font-size:13px;cursor:pointer;
          ">
            ${isRestore ? 'Esqueci minha senha' : isProtect ? 'Pular por agora' : 'Pular por agora (sem criptografia)'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const passEl    = modal.querySelector('#e2eePass');
    const confirmEl = modal.querySelector('#e2eePassConfirm');
    const errorEl   = modal.querySelector('#e2eeError');
    const submitBtn = modal.querySelector('#e2eeSubmit');
    const skipBtn   = modal.querySelector('#e2eeSkip');
    const toggleBtn = modal.querySelector('#e2eeToggle');

    // Toggle visibilidade da senha
    toggleBtn?.addEventListener('click', () => {
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
    });

    // Enter submete
    modal.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitBtn.click();
    });

    passEl.focus();

    submitBtn.addEventListener('click', async () => {
      errorEl.textContent = '';
      const pass = passEl.value.trim();

      if (pass.length < 8) {
        errorEl.textContent = 'Mínimo 8 caracteres.';
        return;
      }
      if ((isCreate || isProtect) && confirmEl && pass !== confirmEl.value.trim()) {
        errorEl.textContent = 'As senhas não coincidem.';
        return;
      }

      submitBtn.textContent = '...';
      submitBtn.disabled = true;

      try {
        if (isProtect) {
          // Cifra a chave privada já existente no localStorage com a nova senha
          const existingPrivKey = SobralCrypto.loadPrivateKey(USER.id);
          if (!existingPrivKey) throw new Error('Chave local não encontrada');
          const blob = await SobralCrypto.wrapPrivateKey(existingPrivKey, pass);
          const { error } = await supa.from('profiles')
            .update({ private_key_enc: blob }).eq('id', USER.id);
          if (error) throw new Error('Erro ao salvar no banco: ' + error.message);
          MY_PROFILE.private_key_enc = blob;

        } else if (isCreate) {
          // Gera par RSA, cifra a privada com a senha, salva tudo no banco
          const keys = await SobralCrypto.generateKeyPair();
          const blob = await SobralCrypto.wrapPrivateKey(keys.privateKey, pass);
          const { error } = await supa.from('profiles').update({
            public_key:      keys.publicKey,
            private_key_enc: blob,
          }).eq('id', USER.id);
          if (error) throw new Error('Erro ao salvar no banco: ' + error.message);
          SobralCrypto.savePrivateKey(USER.id, keys.privateKey);
          MY_PROFILE.public_key      = keys.publicKey;
          MY_PROFILE.private_key_enc = blob;

        } else if (isRestore) {
          // Baixa blob do banco e decripta com a senha
          const privKey = await SobralCrypto.unwrapPrivateKey(MY_PROFILE.private_key_enc, pass);
          SobralCrypto.savePrivateKey(USER.id, privKey);

        } else {
          // Reset: gera par novo, sobrescreve banco
          const keys = await SobralCrypto.generateKeyPair();
          const blob = await SobralCrypto.wrapPrivateKey(keys.privateKey, pass);
          await supa.from('profiles').update({
            public_key:      keys.publicKey,
            private_key_enc: blob,
          }).eq('id', USER.id);
          SobralCrypto.savePrivateKey(USER.id, keys.privateKey);
          MY_PROFILE.public_key      = keys.publicKey;
          MY_PROFILE.private_key_enc = blob;
        }

        modal.remove();
        resolve(true);

      } catch(e) {
        errorEl.textContent = e.message === 'Senha incorreta'
          ? 'Senha incorreta. Tente novamente.'
          : 'Erro inesperado. Tente novamente.';
        submitBtn.textContent = isCreate ? 'Criar senha' : isRestore ? 'Entrar' : isProtect ? 'Salvar senha' : 'Criar nova chave';
        submitBtn.disabled = false;
      }
    });

    skipBtn.addEventListener('click', () => {
      if (isRestore) {
        // Esqueceu a senha → oferece reset
        modal.remove();
        e2eeSetupModal('reset').then(resolve);
      } else {
        // Pular: segue sem E2EE
        modal.remove();
        resolve(false);
      }
    });
  });
}

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

  // ── E2EE: inicialização da chave ────────────────────────────────
  if (typeof SobralCrypto !== 'undefined' && window.crypto?.subtle) {
    const hasLocal = SobralCrypto.hasKeys(USER.id);
    const hasBank  = !!(MY_PROFILE.public_key && MY_PROFILE.private_key_enc);

    if (!hasLocal && !hasBank) {
      // Primeiro acesso: pede senha para criar o par
      await e2eeSetupModal('create');
    } else if (!hasLocal && hasBank) {
      // Dispositivo novo: tem blob no banco, pede senha para restaurar
      await e2eeSetupModal('restore');
    } else if (hasLocal && MY_PROFILE.public_key && !MY_PROFILE.private_key_enc) {
      // Tem chave local mas ainda não salvou o blob no banco (usuário antigo)
      // Pede senha para proteger a chave existente sem gerar um par novo
      await e2eeSetupModal('protect');
    }
    // hasLocal = true + hasBank = true → chave já no localStorage, segue sem modal
  }

  // 1. Tenta usar a última localização salva no banco se for recente (menos de LOC_TTL_MIN min)
  if (MY_PROFILE.location_updated_at && MY_PROFILE.lat && MY_PROFILE.lng) {
    const lastUpdate = new Date(MY_PROFILE.location_updated_at);
    const diffMins = (new Date() - lastUpdate) / 1000 / 60;

    if (diffMins < LOC_TTL_MIN && MY_PROFILE.location_active) {
      MY_LAT = MY_PROFILE.lat;
      MY_LNG = MY_PROFILE.lng;
      showState('chatMain');
      updateLocationBanner();
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

  // 3. Ainda assim, mostra a lista de membros e permite ativar geolocalização
  showState('chatMain');
  updateLocationBanner();
  loadNearbyUsers();
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
      updateLocationBanner();
      loadNearbyUsers();

      // Atualiza localização periodicamente (a cada 5 min)
      if (!LOCATION_INTERVAL) LOCATION_INTERVAL = setInterval(updateLocationSilent, 5 * 60 * 1000);
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
  updateLocationBanner();
  if (!LOCATION_INTERVAL) LOCATION_INTERVAL = setInterval(updateLocationSilent, 5 * 60 * 1000);
}

function updateLocationBanner() {
  const banner = document.getElementById('locationBanner');
  if (!banner) return;
  banner.style.display = MY_LAT != null && MY_LNG != null ? 'none' : 'flex';
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
    updateLocationBanner();
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
  // Busca bloqueios (onde eu bloqueei ou fui bloqueado)
  // RLS já filtra: só retorna bloqueios onde eu sou blocker ou blocked
  const { data: blocks } = await supa
    .from('chat_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${USER.id},blocked_id.eq.${USER.id}`);
  const blockedIds = new Set(
    (blocks || []).map(b => b.blocker_id === USER.id ? b.blocked_id : b.blocker_id)
  );

  const [profilesResult, albumResult] = await Promise.all([
    supa.from('profiles').select('id, full_name, avatar_url, bio, lat, lng, location_updated_at, public_key').neq('id', USER.id),
    supa.from('album_photos').select('user_id').eq('status', 'verified')
  ]);

  const { data: profiles, error } = profilesResult;

  if (error) {
    listEl.innerHTML = `<div class="list-empty"><div class="list-empty-icon"><i data-lucide="alert-triangle"></i></div>Erro ao carregar membros.</div>`;
    window.lucide?.createIcons();
    return;
  }

  // Monta mapa de contagem de fotos por usuário
  ALBUM_COUNTS = {};
  (albumResult.data || []).forEach(row => {
    ALBUM_COUNTS[row.user_id] = (ALBUM_COUNTS[row.user_id] || 0) + 1;
  });

  NEARBY_USERS = (profiles || [])
    .filter(p => !blockedIds.has(p.id))
    .map(p => {
      const hasDistance = MY_LAT != null && MY_LNG != null && p.lat != null && p.lng != null;
      return {
        ...p,
        distance: hasDistance ? haversine(MY_LAT, MY_LNG, p.lat, p.lng) : null
      };
    })
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return (a.full_name || '').localeCompare(b.full_name || '');
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  // Badge com total de membros
  document.getElementById('myDistBadge').innerHTML =
    `<i data-lucide="map-pin" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-top:-2px"></i> ${NEARBY_USERS.length} membro${NEARBY_USERS.length !== 1 ? 's' : ''} cadastrado${NEARBY_USERS.length !== 1 ? 's' : ''}`;
  window.lucide?.createIcons();

  FILTERED_USERS = NEARBY_USERS;
  await loadFriendRelations();
  applyChatFilters();
}

async function loadFriendRelations() {
  FRIEND_RELATIONS = {};
  const { data, error } = await supa.from('friend_requests')
    .select('id,sender_id,receiver_id,status')
    .or(`sender_id.eq.${USER.id},receiver_id.eq.${USER.id}`);

  if (error) {
    console.error('loadFriendRelations', error.message);
    return;
  }

  (data || []).forEach(req => {
    const otherId = req.sender_id === USER.id ? req.receiver_id : req.sender_id;
    const existing = FRIEND_RELATIONS[otherId];
    if (!existing || existing.status !== 'accepted') {
      FRIEND_RELATIONS[otherId] = req;
    }
  });
}

function getFriendActionHtml(user) {
  const rel = FRIEND_RELATIONS[user.id];
  if (!rel) {
    if (FRIEND_FILTER === 'all') {
      return '';
    }
    return `<button class="btn btn-primary btn-sm" style="font-size:11px;white-space:nowrap;flex-shrink:0" onclick="event.stopPropagation();handleFriendAction('${user.id}')"><i data-lucide="user-plus" style="width:12px;height:12px;pointer-events:none"></i> Adicionar</button>`;
  }
  if (rel.status === 'accepted') {
    return '';
  }
  if (rel.status === 'pending') {
    if (rel.sender_id === USER.id) {
      if (FRIEND_FILTER === 'all' || FRIEND_FILTER === 'pending') {
        return '';
      }
      return `<button class="btn btn-secondary btn-sm" style="font-size:11px;white-space:nowrap;flex-shrink:0" onclick="event.stopPropagation();cancelFriendRequestFromChat('${rel.id}','${user.id}')"><i data-lucide="x-circle" style="width:12px;height:12px;pointer-events:none"></i> Cancelar</button>`;
    }
    return `<button class="btn btn-primary btn-sm" style="font-size:11px;white-space:nowrap;flex-shrink:0" onclick="event.stopPropagation();handleFriendAction('${user.id}','${rel.id}')"><i data-lucide="check-circle" style="width:12px;height:12px;pointer-events:none"></i> Aceitar</button>`;
  }
  return `<button class="btn btn-primary btn-sm" style="font-size:11px;white-space:nowrap;flex-shrink:0" onclick="event.stopPropagation();handleFriendAction('${user.id}')"><i data-lucide="user-plus" style="width:12px;height:12px;pointer-events:none"></i> Adicionar</button>`;
}

async function handleFriendAction(userId, requestId) {
  if (!USER) return;
  const rel = FRIEND_RELATIONS[userId];
  if (rel && rel.status === 'pending' && rel.receiver_id === USER.id) {
    await acceptFriendRequestFromChat(requestId || rel.id);
    return;
  }
  if (rel && rel.status === 'accepted') {
    toast('Vocês já são amigos.', 'info');
    return;
  }
  await sendFriendRequestToUser(userId);
}

async function sendFriendRequestToUser(userId) {
  if (!userId || userId === USER.id) return;

  const { data: existing, error: existingError } = await supa.from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${USER.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${USER.id})`)
    .maybeSingle();

  if (existingError) {
    toast('Erro ao verificar amizade existente: ' + existingError.message, 'err');
    return;
  }

  if (existing) {
    if (existing.status === 'accepted') {
      FRIEND_RELATIONS[userId] = existing;
      toast('Vocês já são amigos.', 'info');
      renderUserList(FILTERED_USERS);
      return;
    }
    if (existing.status === 'pending' && existing.receiver_id === USER.id) {
      await acceptFriendRequestFromChat(existing.id);
      return;
    }
    if (existing.status === 'pending') {
      FRIEND_RELATIONS[userId] = existing;
      toast('Pedido já enviado.', 'info');
      renderUserList(FILTERED_USERS);
      return;
    }
  }

  const { data, error } = await supa.from('friend_requests')
    .insert({ sender_id: USER.id, receiver_id: userId, status: 'pending' })
    .select()
    .maybeSingle();

  if (error) {
    toast('Não foi possível enviar o pedido: ' + error.message, 'err');
    return;
  }

  FRIEND_RELATIONS[userId] = data;
  toast('Pedido de amizade enviado!', 'ok');
  renderUserList(FILTERED_USERS);
}

async function acceptFriendRequestFromChat(requestId) {
  if (!requestId) return;
  const { data, error } = await supa.from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .maybeSingle();

  if (error) {
    toast('Erro ao aceitar amizade: ' + error.message, 'err');
    return;
  }

  const otherId = data.sender_id === USER.id ? data.receiver_id : data.sender_id;
  FRIEND_RELATIONS[otherId] = data;
  toast('Amizade aceita!', 'ok');
  renderUserList(FILTERED_USERS);
  const activeWrap = document.getElementById('convFriendWrap');
  if (activeWrap && ACTIVE_USER?.id === otherId) {
    renderConversationFriendButton(ACTIVE_USER);
    window.lucide?.createIcons();
  }
}

async function cancelFriendRequestFromChat(requestId, userId) {
  if (!requestId) return;
  const { error } = await supa.from('friend_requests').delete().eq('id', requestId);
  if (error) {
    toast('Erro ao cancelar pedido: ' + error.message, 'err');
    return;
  }
  delete FRIEND_RELATIONS[userId];
  toast('Pedido de amizade cancelado.', 'ok');
  renderUserList(FILTERED_USERS);
  if (ACTIVE_USER?.id === userId) {
    renderConversationFriendButton(ACTIVE_USER);
    window.lucide?.createIcons();
  }
}

async function removeFriendFromChat(userId) {
  if (!userId) return;
  const rel = FRIEND_RELATIONS[userId];
  if (!rel || rel.status !== 'accepted') return;

  const { error } = await supa.from('friend_requests')
    .delete()
    .or(`and(sender_id.eq.${USER.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${USER.id})`)
    .eq('status','accepted');

  if (error) {
    toast('Erro ao remover amigo: ' + error.message, 'err');
    return;
  }

  delete FRIEND_RELATIONS[userId];
  toast('Amigo removido.', 'ok');
  renderUserList(FILTERED_USERS);
  if (ACTIVE_USER?.id === userId) {
    renderConversationFriendButton(ACTIVE_USER);
    window.lucide?.createIcons();
  }
}

function renderConversationFriendButton(profile) {
  const wrap = document.getElementById('convFriendWrap');
  if (!wrap) return;
  const rel = FRIEND_RELATIONS[profile.id];
  let html = '';
  if (!rel) {
    html = `<button id="convFriendBtn" class="btn btn-primary btn-sm" style="font-size:12px;white-space:nowrap" onclick="handleFriendAction('${profile.id}')"><i data-lucide="user-plus" style="width:12px;height:12px;pointer-events:none"></i> Adicionar</button>`;
  } else if (rel.status === 'accepted') {
    html = '';
  } else if (rel.status === 'pending') {
    if (rel.sender_id === USER.id) {
      html = '';
    } else {
      html = `<button id="convFriendBtn" class="btn btn-primary btn-sm" style="font-size:12px;white-space:nowrap" onclick="handleFriendAction('${profile.id}','${rel.id}')"><i data-lucide="check-circle" style="width:12px;height:12px;pointer-events:none"></i> Aceitar amizade</button>`;
    }
  }
  wrap.innerHTML = html;
}

function renderUserList(users) {
  const listEl = document.getElementById('userList');
  if (!users.length) {
    listEl.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon"><i data-lucide="globe"></i></div>
        <strong>Nenhum membro encontrado</strong><br>
        Verifique a busca ou tente novamente mais tarde.
      </div>`;
    window.lucide?.createIcons();
    return;
  }

  listEl.innerHTML = users.map((u, i) => {
    const hasLocation = u.distance !== null;
    const tooFar  = hasLocation && u.distance > MAX_DIST_KM;
    const distStr = hasLocation ? fmtDist(u.distance) : `<i data-lucide="map-pin-off" class="dist-icon" title="Sem localização"></i>`;
    const isActive = ACTIVE_USER?.id === u.id;
    const statusHtml = getFriendStatusLabel(u.id);

    return `
      <div class="user-card${isActive ? ' active' : ''}${tooFar ? ' far' : ''}${!hasLocation ? ' no-location' : ''}"
           id="ucard-${u.id}"
           onclick="openChat('${u.id}')"
           style="animation-delay:${i * 0.04}s"
           title="${tooFar ? `Muito longe (${distStr}). Máximo: ${MAX_DIST_KM} km` : !hasLocation ? 'Esse membro não tem localização ativa' : `Abrir conversa com ${u.full_name}`}" >
        <div class="user-avatar">
          ${avatarHtml(u, 44)}
          ${hasLocation && !tooFar ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="user-card-info">
          <div class="user-card-name" style="display:flex;align-items:center;gap:5px">${u.full_name || 'Membro'} ${getChatBadgeHtml(u.id)}</div>
          <div class="user-card-sub">${u.bio ? u.bio.substring(0, 35) + (u.bio.length > 35 ? '…' : '') : 'Membro Sobral Cultural'}</div>
          ${statusHtml ? `<div class="user-card-status">${statusHtml}</div>` : ''}
        </div>
        ${getFriendActionHtml(u)}
        <span class="dist-badge${tooFar ? ' far' : ''}">${distStr}</span>
      </div>`;
  }).join('');

  window.lucide?.createIcons();
}

/**
 * Retorna o HTML do selo de verificação baseado no número de fotos no álbum
 */
function getChatBadgeHtml(userId) {
  const count = ALBUM_COUNTS[userId] || 0;
  if (count === 0) return '';
  
  if (count === 1) {
    return `<i data-lucide="badge-check" class="verif-badge bronze" title="Verificado Bronze (1 foto)"></i>`;
  } else if (count >= 2 && count <= 3) {
    return `<i data-lucide="badge-check" class="verif-badge silver" title="Verificado Prata (${count} fotos)"></i>`;
  } else if (count >= 4) {
    return `<i data-lucide="badge-check" class="verif-badge gold" title="Verificado Ouro (${count} fotos)"></i>`;
  }
  return '';
}

function getFriendStatusLabel(userId) {
  const rel = FRIEND_RELATIONS[userId];
  if (!rel) return '';
  if (rel.status === 'accepted') {
    return '';
  }
  if (rel.status === 'pending') {
    if (rel.sender_id === USER.id && (FRIEND_FILTER === 'all' || FRIEND_FILTER === 'pending')) {
      return '';
    }
    return rel.sender_id === USER.id
      ? `<span class="friend-status pending">Pedido enviado</span>`
      : `<span class="friend-status pending">Pendente</span>`;
  }
  return '';
}

function applyChatFilters() {
  let users = NEARBY_USERS;
  if (searchTerm) {
    users = users.filter(u => (u.full_name || '').toLowerCase().includes(searchTerm));
  }
  if (FRIEND_FILTER === 'friends') {
    users = users.filter(u => FRIEND_RELATIONS[u.id]?.status === 'accepted');
  } else if (FRIEND_FILTER === 'pending') {
    users = users.filter(u => FRIEND_RELATIONS[u.id]?.status === 'pending');
  } else if (FRIEND_FILTER === 'not_friends') {
    users = users.filter(u => !FRIEND_RELATIONS[u.id]);
  }
  FILTERED_USERS = users;
  renderUserList(FILTERED_USERS);
}

function setFriendFilter(filter) {
  FRIEND_FILTER = filter;
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  applyChatFilters();
}

// ── Filtro de busca ───────────────────────────────────────────────
function filterUsers(term) {
  searchTerm = term.toLowerCase().trim();
  applyChatFilters();
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

  if (MY_LAT == null || MY_LNG == null) {
    toast('Ative sua localização para conversar com membros próximos.', 'err');
    return;
  }

  if (profile.distance == null) {
    toast('Não é possível iniciar chat. Esse membro não tem localização ativa.', 'err');
    return;
  }

  // Verifica distância
  if (profile.distance > MAX_DIST_KM) {
    toast(`${profile.full_name} está muito longe. Máximo permitido: ${MAX_DIST_KM} km.`, 'err');
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
  // Monta nome + selo no header
  const convNameEl = document.getElementById('convName');
  convNameEl.innerHTML = '';
  const nameSpan = document.createElement('span');
  nameSpan.textContent = profile.full_name || 'Membro';
  convNameEl.appendChild(nameSpan);
  const badgeNode = document.createElement('span');
  badgeNode.innerHTML = getChatBadgeHtml(profile.id);
  if (badgeNode.firstChild) convNameEl.appendChild(badgeNode.firstChild);
  convNameEl.style.cssText = 'display:flex;align-items:center;gap:6px';

  const profUrl = profile.username ? `/${profile.username}` : `sobral_perfil.html?id=${profile.id}`;
  document.getElementById('convProfileLink').href = profUrl;
  document.getElementById('convProfileLink').target = '_blank';
  document.getElementById('convDist').innerHTML    =
    `<i data-lucide="map-pin" style="width:11px;height:11px"></i> ${profile.distance != null ? `${fmtDist(profile.distance)} de distância` : 'Localização indisponível'}`;

  renderConversationFriendButton(profile);
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
  MESSAGES = []; // limpa para evitar flash de mensagens antigas ao abrir outra conversa
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

  const now = new Date().toISOString();

  // Atualiza no banco as mensagens recebidas ainda não lidas
  const { error } = await supa
    .from('chat_messages')
    .update({ read_at: now })
    .eq('conversation_id', ACTIVE_CONV.id)
    .neq('sender_id', USER.id)
    .is('read_at', null);

  if (!error) {
    // Sincroniza o array local para refletir imediatamente (sem esperar o Realtime)
    let changed = false;
    MESSAGES.forEach(m => {
      if (String(m.sender_id).toLowerCase() !== String(USER.id).toLowerCase() && !m.read_at) {
        m.read_at = now;
        changed = true;
      }
    });
    if (changed) renderMessages();
  }

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
  const _isInitialLoad = true; // sinaliza que a próxima renderMessages deve forçar o scroll
  const privKey = typeof SobralCrypto !== 'undefined' ? SobralCrypto.loadPrivateKey(USER.id) : null;
  if (privKey) {
    for (const msg of MESSAGES) {
      const isMine = String(msg.sender_id).toLowerCase() === String(USER.id).toLowerCase();
      
      if (isMine) {
        // Se a mensagem foi enviada por mim, tento descriptografar a versão "sender_encrypted_text"
        const senderEncryptedPayload = SobralCrypto.deserializePayload(msg.sender_encrypted_text);
        if (senderEncryptedPayload) {
          try {
            const decryptedText = await SobralCrypto.decrypt(senderEncryptedPayload, privKey);
            // Se decrypt falhar (chave trocada, mensagem antiga), mantém o texto original
            if (decryptedText) msg.text = decryptedText;
          } catch (e) {
            console.warn("Erro ao descriptografar própria mensagem:", e);
            // Não substitui o texto — mantém o que veio do banco (pode ser legível)
          }
        } else {
          // sem sender_encrypted_text: mantém msg.text (pode ser plaintext de época sem E2EE)
        }
      } else {
        // Se a mensagem é de outro usuário, descriptografa com proteção
        const encPayload = SobralCrypto.deserializePayload(msg.text);
        if (encPayload) {
          try {
            const dec = await SobralCrypto.decrypt(encPayload, privKey);
            msg.text = dec || msg.text; // se falhou, mantém o texto original (plaintext ou payload)
          } catch (e) {
            console.warn('Erro ao descriptografar mensagem recebida:', e);
            msg.text = '[Mensagem não pôde ser lida]';
          }
        }
      }
    }
  }
  renderMessages();
  scrollToBottom(true);
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
    const isMine   = String(msg.sender_id).toLowerCase() === String(USER.id).toLowerCase();
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

    const d = new Date(msg.created_at);
    const timeOnly = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Define o ícone de status para as minhas mensagens
    let statusHtml = '';
    if (isMine) {
      const isOptimistic = msg.id.toString().startsWith('temp-');
      // SVG inline — evita duplicação causada pelo lucide.createIcons()
      // Cores escuras para contrastar com o fundo dourado da bolha
      const color  = msg.read_at ? '#15803d' : 'rgba(0,0,0,0.45)';
      const svgClock = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:4px"><polyline points="20 6 9 17 4 12"/></svg>`;
      const svgCheckCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:4px"><polyline points="17 1 9 12 5 8"/><polyline points="22 6 12 17 7 12"/></svg>`;
      statusHtml = isOptimistic ? svgClock : (msg.read_at ? svgCheckCheck : svgCheck);
    }

    html += `
      <div class="msg-row ${isMine ? 'mine' : 'other'}${grouped ? ' grouped' : ''}" data-msg="${msg.id}">
        ${miniAvatar}
        <div>
          <div class="msg-bubble">
            ${escapeHtml(msg.text)}
            <div class="msg-footer" style="display:flex; align-items:center; justify-content:flex-end; margin-top:2px; font-size:10px; opacity:0.7;">
              <span>${timeOnly}</span>
              ${statusHtml}
            </div>
          </div>
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

function scrollToBottom(force = false) {
  const area = document.getElementById('messagesArea');
  if (!area) return;
  // Só rola automaticamente se o usuário já está perto do fim (< 100px do fundo)
  // ou se for forçado (ex: ao abrir a conversa pela primeira vez)
  const nearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 100;
  if (force || nearBottom) area.scrollTop = area.scrollHeight;
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
    created_at: new Date().toISOString(),
    _optimistic: true // Adiciona uma flag para identificar mensagens otimistas
  };
  MESSAGES.push(tempMsg);
  renderMessages();

  let textToSend = text;
  let senderEncryptedText = null;

  const canEncrypt = typeof SobralCrypto !== 'undefined' && window.crypto?.subtle;
  if (canEncrypt) {
    // Criptografa para o destinatário (só se ele tiver public_key)
    if (ACTIVE_USER?.public_key) {
      try {
        const payload = await SobralCrypto.encrypt(text, ACTIVE_USER.public_key);
        textToSend = SobralCrypto.serializePayload(payload);
      } catch (e) {
        console.warn('[E2EE] Erro ao criptografar para destinatário:', e.message);
        // Continua com plaintext — mensagem ainda é entregue
      }
    }
    // Criptografa para o próprio remetente poder ler depois
    if (MY_PROFILE?.public_key) {
      try {
        const senderPayload = await SobralCrypto.encrypt(text, MY_PROFILE.public_key);
        senderEncryptedText = SobralCrypto.serializePayload(senderPayload);
      } catch (e) {
        console.warn('[E2EE] Erro ao criptografar cópia do remetente:', e.message);
      }
    }
  }

  const { data, error } = await supa
    .from('chat_messages')
    .insert({
      conversation_id: ACTIVE_CONV.id,
      sender_id: USER.id,
      text: textToSend, // Mensagem criptografada para o destinatário
      sender_encrypted_text: senderEncryptedText // Mensagem criptografada para o remetente
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

  // Substitui a mensagem otimista pela mensagem real do banco, preservando o texto original
  const idx = MESSAGES.findIndex(m => m.id === tempMsg.id);
  if (idx !== -1) {
    MESSAGES[idx] = {
      ...data,
      text: tempMsg.text, // Mantém o texto original (plaintext) da mensagem otimista
      _optimistic: false
    };
  }
  renderMessages();

  // Atualiza last_message
  await supa.from('chat_conversations').update({
    last_message_at: data.created_at,
    last_message_text: '[mensagem criptografada]'
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
    }, async (payload) => {
      const msg = payload.new;

      // Se a mensagem real já existe, ignora (reconexão / duplicata)
      if (MESSAGES.some(m => m.id === msg.id)) return;

      const isMine = String(msg.sender_id).toLowerCase() === String(USER.id).toLowerCase();

      // FIX: Se veio do próprio usuário, substitui a mensagem otimista (temp-xxx)
      // em vez de adicionar duplicata
      if (isMine) {
        const tempIdx = MESSAGES.findIndex(m =>
          m._optimistic && m.conversation_id === msg.conversation_id
        );
        if (tempIdx !== -1) {
          MESSAGES[tempIdx] = { ...MESSAGES[tempIdx], id: msg.id, _optimistic: false, read_at: msg.read_at };
          renderMessages();
          return;
        }
      }

      const rtPrivKey = typeof SobralCrypto !== 'undefined' ? SobralCrypto.loadPrivateKey(USER.id) : null;

      if (rtPrivKey) {
        const payloadToDecrypt = isMine ? msg.sender_encrypted_text : msg.text;
        const encPayload = SobralCrypto.deserializePayload(payloadToDecrypt);
        if (encPayload) {
          try {
            msg.text = await SobralCrypto.decrypt(encPayload, rtPrivKey);
          } catch (e) {
            msg.text = isMine ? "[Erro ao ler sua mensagem]" : "[mensagem não pode ser lida]";
          }
        }
      } else if (typeof SobralCrypto !== 'undefined') {
        // FIX: sem chave privada local, verifica se o texto é um payload criptografado
        // Se for, avisa — em vez de exibir o base64 cru
        const encPayload = SobralCrypto.deserializePayload(isMine ? msg.sender_encrypted_text : msg.text);
        if (encPayload) {
          msg.text = '[Mensagem criptografada — recarregue a página para ler]';
        }
      }

      MESSAGES.push(msg);
      renderMessages();
      // Só marca como lida se a mensagem foi enviada pelo outro usuário
      if (!isMine) markMessagesAsRead();
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${ACTIVE_CONV.id}`
    }, (payload) => {
      const updatedMsg = payload.new;
      // Atualiza APENAS o read_at no array local — não sobrescreve o texto
      // já descriptografado em memória com o payload criptografado do banco
      const idx = MESSAGES.findIndex(m => m.id === updatedMsg.id);
      if (idx !== -1 && updatedMsg.read_at && !MESSAGES[idx].read_at) {
        MESSAGES[idx].read_at = updatedMsg.read_at;
        renderMessages();
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