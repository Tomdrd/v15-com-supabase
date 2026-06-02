const CAT_LABELS={todos:'Todos',religioso:'Religioso',cultura:'Cultura',historico:'Histórico',natureza:'Natureza',lazer:'Lazer'};
const CAT_ICONS={religioso:'church',cultura:'landmark',historico:'castle',natureza:'trees',lazer:'ferris-wheel',eventos:'calendar-days',event:'calendar-days'};
const REACTION_LABELS={like:'Gostei',been:'Eu Fui',going:'Eu Vou'};
const CAT_COLORS={religioso:'#9B8EC4',cultura:'#C8871A',historico:'#7B9E6B',natureza:'#4CAF82',lazer:'#E07B54'};

let USER=null,PROFILE=null,SUBS=[],REACTIONS=[],SPOTS_MAP={};
let currentTab='mymap';
let currentFavFilter='all';
let isMyProfile = false;
let FRIEND_REQUEST = null;
let FRIEND_COUNT = 0;
let FRIEND_COMMON_COUNT = 0;
let FRIENDS = [];
let PENDING_SENT = [];
let PENDING_RECEIVED = [];
let profileMap=null;
let ALBUM_POINTS=[];
let ALBUM_PHOTOS=[];
let ALBUM_PHOTO_LIKE_COUNTS = {};
let ALBUM_PHOTO_MY_LIKES = new Set();
let selectedAlbumSpot=null;

function toggleDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id)?.classList.toggle('open'));}
function closeDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id)?.classList.remove('open'));}
function toast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type==='ok'?'ok':type==='err'?'err':'');setTimeout(()=>t.className='toast',3800);}

(function injectFadeStyle(){
  const s=document.createElement('style');
  s.textContent=`
    @keyframes tabFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .tab-fade{animation:tabFadeIn .22s ease forwards}
    .pstat-btn{background:none;border:none;cursor:pointer;text-align:center;padding:6px 10px;border-radius:10px;transition:.15s;font-family:'Plus Jakarta Sans',sans-serif}
    .pstat-btn:hover{background:rgba(200,135,26,.12)}
    .pstat-btn .pstat-num{font-size:22px;font-weight:800;color:var(--ochre)}
    .pstat-btn .pstat-lbl{font-size:11px;color:var(--muted)}
    .fav-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
    .fav-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;transition:.15s}
    .fav-pill:hover{color:var(--cream);border-color:rgba(200,135,26,.4)}
    .fav-pill.active{background:rgba(200,135,26,.15);border-color:var(--ochre);color:var(--ochre)}

    /* VARIÁVEIS PADRÃO DO PERFIL (Sobral Cultural) */
    body {
      --border: rgba(200,135,26,0.25);
      --input-bg: rgba(255,255,255,0.04);
    }

    /* TRANSIÇÃO SUAVE ENTRE TEMAS */
    body, .profile-hero, .sub-card, .reaction-card, .empty, .edit-form, input, textarea, select {
      transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease;
    }

    /* MODO ESCURO (Dark Mode Clean / Zinc) */
    body.theme-dark {
      --deep: #09090b;
      --mid: #18181b;
      --cream: #f4f4f5;
      --muted: #a1a1aa;
      --border: #27272a;
      --input-bg: #09090b;
      background-color: var(--deep);
      color: var(--cream);
    }
    body.theme-dark .topbar { background: rgba(9, 9, 11, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
    body.theme-dark .profile-hero { background: var(--mid); border-bottom: 1px solid var(--border); }
    
    body.theme-dark .sub-card, body.theme-dark .reaction-card, body.theme-dark .empty, body.theme-dark .edit-form { 
      background: var(--mid); border: 1px solid var(--border); border-radius: 12px; 
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.35s ease;
    }
    body.theme-dark .sub-card:hover, body.theme-dark .reaction-card:hover { transform: translateY(-2px); border-color: rgba(200,135,26,0.4); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
    
    body.theme-dark input, body.theme-dark textarea, body.theme-dark select { background: var(--input-bg); border: 1px solid var(--border); color: var(--cream); }
    body.theme-dark input:focus, body.theme-dark textarea:focus, body.theme-dark select:focus { border-color: var(--ochre); box-shadow: 0 0 0 3px rgba(200,135,26,0.15); }
    
    body.theme-dark .fav-pill { border-color: var(--border); color: var(--muted); background: var(--mid); }
    body.theme-dark .fav-pill:hover { border-color: var(--muted); color: var(--cream); }
    body.theme-dark .fav-pill.active { border-color: var(--ochre); color: var(--ochre); background: rgba(200,135,26,.12); }
    
    body.theme-dark .route-item { background: var(--mid); border-bottom: 1px solid var(--border); transition: transform 0.2s ease, border-color 0.2s ease; }
    body.theme-dark .route-item:hover { transform: translateY(-2px); border-color: rgba(200,135,26,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.4); border-bottom-color: rgba(200,135,26,0.4); border-radius: 8px; z-index: 1; position: relative; }
    body.theme-dark .route-num { background: var(--deep); border-color: var(--border); color: var(--cream); }
    
    body.theme-dark hr { border-top-color: var(--border) !important; }

    /* MODO CLARO (Light Mode Elegante) */
    body.theme-light {
      --deep: #f4f4f5;
      --mid: #ffffff;
      --cream: #18181b;
      --muted: #52525b;
      --border: #d4d4d8;
      --input-bg: #f4f4f5;
      background-color: var(--deep);
      color: var(--cream);
    }
    
    /* Fix Topbar Modo Claro */
    body.theme-light .topbar { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
    body.theme-light .tb-logo-name { color: var(--cream); }
    body.theme-light .tb-nav a { color: var(--muted); }
    body.theme-light .tb-nav a:hover, body.theme-light .tb-nav a.active { color: var(--ochre); background: rgba(200,135,26,0.1); border-color: var(--border); }
    body.theme-light .hbg { background: rgba(0,0,0,0.03); border-color: var(--border); }
    body.theme-light .hbg span { background: var(--cream); }

    /* Fix Hero e Cartões Modo Claro */
    body.theme-light .profile-hero { background: var(--mid); border-bottom: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03); }
    body.theme-light .ptab { color: var(--muted); }
    body.theme-light .ptab.active { color: var(--ochre); font-weight: 600; }
    body.theme-light .ptab:hover { background: rgba(0,0,0,0.03); }
    body.theme-light .pstat-btn:hover { background: rgba(0,0,0,0.04); }
    
    body.theme-light .sub-card, body.theme-light .reaction-card, body.theme-light .empty, body.theme-light .edit-form { 
      background: var(--mid); border: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.03); border-radius: 12px; 
      transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.35s ease, border-color 0.35s ease;
    }
    body.theme-light .sub-card:hover, body.theme-light .reaction-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04); }
    
    body.theme-light input, body.theme-light textarea, body.theme-light select { background: var(--input-bg); border: 1px solid var(--border); color: var(--cream); }
    body.theme-light input:focus, body.theme-light textarea:focus, body.theme-light select:focus { background: var(--mid); border-color: var(--ochre); box-shadow: 0 0 0 3px rgba(200,135,26,0.15); }
    
    body.theme-light .fav-pill { border-color: var(--border); color: var(--muted); background: var(--mid); }
    body.theme-light .fav-pill:hover { border-color: var(--muted); color: var(--cream); }
    body.theme-light .fav-pill.active { border-color: var(--ochre); color: var(--ochre); background: rgba(200,135,26,0.08); }
    
    body.theme-light .route-item { background: var(--mid); border-bottom: 1px solid var(--border); transition: transform 0.2s ease, background 0.2s ease; }
    body.theme-light .route-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.04); border-bottom-color: transparent; border-radius: 8px; z-index: 1; position: relative; }
    body.theme-light .route-num { background: var(--mid); border-color: var(--border); color: var(--cream); }
    
    body.theme-light hr { border-top-color: var(--border) !important; }
    body.theme-light .profile-name { color: var(--cream); }
    body.theme-light .empty-icon i { opacity: 0.2; }
  `;
  document.head.appendChild(s);
})();

async function init(){
  const{data:{session}}=await supa.auth.getSession();
  USER=session?.user || null;

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  let profileUser = urlParams.get('username');

  // Vercel rewrite limpa a search querystring mas mantém o pathname. Extrai do pathname se for URL amigável.
  const path = window.location.pathname;
  if (!profileUser && path !== '/' && !path.endsWith('.html')) {
    profileUser = path.split('/').filter(Boolean).pop();
  }

  let targetUserId = null;
  if (profileUser) {
    const { data: u } = await supa.from('profiles').select('id').eq('username', profileUser).single();
    if (u) targetUserId = u.id;
    else { window.location.href = '/404.html'; return; }
  } else if (profileId) {
    const { data: u } = await supa.from('profiles').select('id').eq('id', profileId).single();
    if (u) targetUserId = u.id;
    else { window.location.href = '/404.html'; return; }
  } else if (USER) {
    targetUserId = USER.id;
  } else {
    location.href='sobral_login.html?redirect=sobral_perfil.html';
    return;
  }

  isMyProfile = USER && targetUserId === USER.id;

  const[{data:prof},{data:subs},{data:reacts}]=await Promise.all([
    supa.from('profiles').select('*').eq('id', targetUserId).single(),
    supa.from('submissions').select('*').eq('user_id', targetUserId).order('created_at',{ascending:false}),
    supa.from('reactions').select('*').eq('user_id', targetUserId).order('created_at',{ascending:false})
  ]);
  PROFILE=prof||{id: targetUserId, role:'user',full_name: USER?.user_metadata?.full_name || 'Usuário'};
  SUBS=subs||[];
  REACTIONS=reacts||[];
  FRIEND_COUNT=0;
  FRIEND_REQUEST=null;
  await loadFriendData(targetUserId);

  document.body.classList.remove('theme-light', 'theme-dark');
  if(PROFILE.theme === 'light') document.body.classList.add('theme-light');
  else if(PROFILE.theme === 'dark') document.body.classList.add('theme-dark');
  
  const ids=[...new Set(REACTIONS.map(r=>r.spot_id).filter(Boolean))];
  if(ids.length){
    const{data:spots}=await supa.from('spots').select('id,name,cat,color,lat,lng,photo').in('id',ids);
    if(spots) spots.forEach(s=>{SPOTS_MAP[s.id]=s;});

    // Fallback: para IDs não encontrados em spots (removidos/rejeitados/pendentes),
    // busca o nome na tabela submissions
    const foundIds=new Set((spots||[]).map(s=>String(s.id)));
    const missingIds=ids.filter(id=>!foundIds.has(String(id)));
    if(missingIds.length){
      const{data:subs}=await supa.from('submissions').select('id,name,cat,color,photo').in('id',missingIds);
      if(subs) subs.forEach(s=>{SPOTS_MAP[s.id]={id:s.id,name:s.name,cat:s.cat,color:s.color,photo:s.photo};});
    }
  }

  try {
    const { data: points } = await supa.from('spots').select('id,name,cat,color,photo,lat,lng').order('id',{ascending:true}).limit(4);
    ALBUM_POINTS = points || [];
  } catch (err) {
    ALBUM_POINTS = [];
  }

  try {
    const { data: album } = await supa.from('album_photos').select('*').eq('user_id', targetUserId);
    ALBUM_PHOTOS = album || [];
  } catch (err) {
    ALBUM_PHOTOS = [];
  }

  await loadAlbumPhotoLikes();
  await normalizeAlbumPhotoUrls();
  renderPage();
}

function renderPage(){
  const avatarSrc=PROFILE.avatar_url||USER?.user_metadata?.avatar_url||USER?.user_metadata?.picture||'';
  const name=PROFILE.full_name||'Usuário';
  const isAdmin=PROFILE.role==='admin';
  const likeCount=REACTIONS.filter(r=>r.reaction==='like').length;
  const beenCount=REACTIONS.filter(r=>r.reaction==='been').length;
  const goingCount=REACTIONS.filter(r=>r.reaction==='going').length;

  const photoCount = ALBUM_PHOTOS.length;
  let badgeHtml = '';
  if (photoCount === 1) {
    badgeHtml = `<i data-lucide="badge-check" class="verif-badge bronze" title="Verificado Bronze (1 foto no álbum)"></i>`;
  } else if (photoCount >= 2 && photoCount <= 3) {
    badgeHtml = `<i data-lucide="badge-check" class="verif-badge silver" title="Verificado Prata (${photoCount} fotos no álbum)"></i>`;
  } else if (photoCount >= 4) {
    badgeHtml = `<i data-lucide="badge-check" class="verif-badge gold" title="Verificado Ouro (${photoCount} fotos no álbum)"></i>`;
  }

  document.getElementById('root').innerHTML=`
    <div class="profile-hero">
      <div class="profile-inner">
        <div class="avatar-wrap">
          ${avatarSrc?`<div class="avatar"><img src="${avatarSrc}" alt="${name}"></div>`:`<div class="avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`}
          <div class="role-badge ${isAdmin?'admin':''}">${isAdmin?'Admin':(PROFILE.role || 'Usuário')}</div>
        </div>
        <div class="profile-info">
          <div class="profile-name">${name} ${badgeHtml}</div>
          ${PROFILE.bio ? `<div class="profile-bio">${PROFILE.bio}</div>` : ''}
          ${FRIEND_COUNT ? `<div style="margin-top:6px;font-size:12px;color:var(--muted)">${FRIEND_COUNT} amigo${FRIEND_COUNT !== 1 ? 's' : ''}</div>` : ''}
          ${FRIEND_COMMON_COUNT ? `<div style="margin-top:4px;font-size:12px;color:var(--muted)">${FRIEND_COMMON_COUNT} amigo${FRIEND_COMMON_COUNT !== 1 ? 's' : ''} em comum</div>` : ''}
          <div style="margin-top:6px;margin-bottom:12px">
            <a href="${PROFILE.username ? window.location.origin + '/' + PROFILE.username : window.location.origin + '/sobral_perfil.html?id=' + PROFILE.id}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:var(--ochre);font-size:12.5px;font-weight:600;text-decoration:none;background:rgba(200,135,26,.1);padding:6px 12px;border-radius:20px;">
              <i data-lucide="link" style="width:13px;height:13px"></i> ${PROFILE.username ? window.location.host + '/' + PROFILE.username : 'Copiar link do perfil'}
            </a>
          </div>
          <div class="profile-stats">
            <button class="pstat-btn" onclick="showTab('submissions')" title="Ver Envios">
              <div class="pstat-num">${SUBS.length}</div><div class="pstat-lbl">Envios</div>
            </button>
            <button class="pstat-btn" onclick="showFavTab('like')" title="Locais que gostei">
              <div class="pstat-num">${likeCount}</div><div class="pstat-lbl">Gostei</div>
            </button>
            <button class="pstat-btn" onclick="showFavTab('been')" title="Locais que visitei">
              <div class="pstat-num">${beenCount}</div><div class="pstat-lbl">Fui</div>
            </button>
            <button class="pstat-btn" onclick="showFavTab('going')" title="Locais que vou visitar">
              <div class="pstat-num">${goingCount}</div><div class="pstat-lbl">Vou</div>
            </button>
          </div>
        </div>
        ${isMyProfile ? `
        <div style="padding-bottom:16px;flex-shrink:0">
          <button class="btn btn-secondary btn-sm" onclick="showTab('settings')" style="font-size:12px"><i data-lucide="settings" style="width:12px;height:12px;pointer-events:none"></i> Editar Perfil</button>
        </div>
        ` : `
        <div style="padding-bottom:16px;flex-shrink:0">
          ${getFriendActionHtml()}
        </div>
        `}
      </div>
    </div>

    <div class="profile-tabs">
      <div class="profile-tabs-inner">
        <button class="ptab" data-tab="mymap"       onclick="showTab('mymap')"><i data-lucide="map"      style="width:14px;height:14px;pointer-events:none"></i> Meu Mapa</button>
        <button class="ptab" data-tab="favorites"   onclick="showTab('favorites')"><i data-lucide="heart"    style="width:14px;height:14px;pointer-events:none"></i> Reações</button>
        <button class="ptab" data-tab="submissions" onclick="showTab('submissions')"><i data-lucide="map-pin" style="width:14px;height:14px;pointer-events:none"></i> Envios</button>
        <button class="ptab" data-tab="photos" onclick="showTab('photos')"><i data-lucide="camera" style="width:14px;height:14px;pointer-events:none"></i> Fotos</button>
        ${isMyProfile ? `<button class="ptab" data-tab="friends" onclick="showTab('friends')"><i data-lucide="users" style="width:14px;height:14px;pointer-events:none"></i> Amigos</button><button class="ptab" data-tab="settings"    onclick="showTab('settings')"><i data-lucide="settings" style="width:14px;height:14px;pointer-events:none"></i> Configurações</button>` : ''}
      </div>
    </div>

    <div class="profile-content" id="tabContent"></div>
    <input type="file" id="albumPhotoInput" accept="image/*" style="display:none" onchange="handleAlbumPhoto(this.files[0])">`;

  setActiveTab(currentTab);
  renderTab(currentTab);
  window.lucide?.createIcons();
}

function getFriendActionHtml(){
  if(!USER && !isMyProfile){
    return `<button class="btn btn-primary btn-sm" onclick="location.href='sobral_login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)" style="font-size:12px"><i data-lucide="log-in" style="width:12px;height:12px;pointer-events:none"></i> Entrar para adicionar amigo</button>`;
  }
  if(!USER || isMyProfile) return '';
  if(!FRIEND_REQUEST){
    return `<button class="btn btn-primary btn-sm" onclick="sendFriendRequest()" style="font-size:12px"><i data-lucide="user-plus" style="width:12px;height:12px;pointer-events:none"></i> Adicionar</button>`;
  }

  if(FRIEND_REQUEST.status === 'pending'){
    if(FRIEND_REQUEST.sender_id === USER.id){
      return `<button class="btn btn-secondary btn-sm" onclick="cancelFriendRequest('${FRIEND_REQUEST.id}')" style="font-size:12px"><i data-lucide="x-circle" style="width:12px;height:12px;pointer-events:none"></i> Cancelar pedido</button>`;
    }
    if(FRIEND_REQUEST.receiver_id === USER.id){
      return `<button class="btn btn-primary btn-sm" onclick="acceptFriendRequest()" style="font-size:12px"><i data-lucide="check-circle" style="width:12px;height:12px;pointer-events:none"></i> Aceitar amizade</button>`;
    }
  }

  if(FRIEND_REQUEST.status === 'accepted'){
    return `<button class="btn btn-secondary btn-sm" style="font-size:12px" disabled><i data-lucide="users" style="width:12px;height:12px;pointer-events:none"></i> Amigos</button>`;
  }

  return `<button class="btn btn-primary btn-sm" onclick="sendFriendRequest()" style="font-size:12px"><i data-lucide="user-plus" style="width:12px;height:12px;pointer-events:none"></i> Adicionar</button>`;
}

async function loadFriendData(targetUserId){
  if(!targetUserId) return;

  const friendCountQuery = supa.from('friend_requests')
    .select('id')
    .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
    .eq('status','accepted');

  let friendQuery = Promise.resolve({ data: null });
  if(USER){
    friendQuery = supa.from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${USER.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${USER.id})`)
      .maybeSingle();
  }

  const [{ data: friendData }, { data: countData }] = await Promise.all([friendQuery, friendCountQuery]);

  FRIEND_REQUEST = friendData || null;
  FRIEND_COUNT = (countData || []).length;
  FRIEND_COMMON_COUNT = 0;

  if(USER && !isMyProfile){
    const [myFriendsRes, targetFriendsRes] = await Promise.all([
      supa.from('friend_requests').select('sender_id,receiver_id').or(`and(sender_id.eq.${USER.id},status.eq.accepted),and(receiver_id.eq.${USER.id},status.eq.accepted)`),
      supa.from('friend_requests').select('sender_id,receiver_id').or(`and(sender_id.eq.${targetUserId},status.eq.accepted),and(receiver_id.eq.${targetUserId},status.eq.accepted)`)
    ]);

    const myFriendIds = new Set();
    (myFriendsRes.data || []).forEach(req => {
      if(req.sender_id === USER.id) myFriendIds.add(req.receiver_id);
      else if(req.receiver_id === USER.id) myFriendIds.add(req.sender_id);
    });

    const targetFriendIds = new Set();
    (targetFriendsRes.data || []).forEach(req => {
      if(req.sender_id === targetUserId) targetFriendIds.add(req.receiver_id);
      else if(req.receiver_id === targetUserId) targetFriendIds.add(req.sender_id);
    });

    FRIEND_COMMON_COUNT = Array.from(targetFriendIds).filter(id => myFriendIds.has(id)).length;
  }

  if(isMyProfile && USER){
    const [acceptedRes, sentRes, receivedRes] = await Promise.all([
      supa.from('friend_requests').select('*').or(`and(sender_id.eq.${USER.id},status.eq.accepted),and(receiver_id.eq.${USER.id},status.eq.accepted)`),
      supa.from('friend_requests').select('*').eq('sender_id', USER.id).eq('status', 'pending'),
      supa.from('friend_requests').select('*').eq('receiver_id', USER.id).eq('status', 'pending')
    ]);

    const acceptedData = acceptedRes.data || [];
    const sentData = sentRes.data || [];
    const receivedData = receivedRes.data || [];

    const friendIds = new Set();
    const pendingIds = new Set();

    acceptedData.forEach(req => {
      if(req.sender_id === USER.id) friendIds.add(req.receiver_id);
      else if(req.receiver_id === USER.id) friendIds.add(req.sender_id);
    });

    sentData.forEach(req => pendingIds.add(req.receiver_id));
    receivedData.forEach(req => pendingIds.add(req.sender_id));

    let profileIds = Array.from(new Set([...friendIds, ...pendingIds]));
    let profilesData = [];
    if(profileIds.length){
      const { data: profiles, error: profileError } = await supa.from('profiles').select('id,full_name,username,avatar_url,bio').in('id', profileIds);
      if(!profileError) profilesData = profiles || [];
    }

    FRIENDS = Array.from(friendIds).map(id => profilesData.find(p => p.id === id) || { id });
    PENDING_SENT = sentData.map(req => ({
      ...req,
      profile: profilesData.find(p => p.id === req.receiver_id) || { id: req.receiver_id }
    }));
    PENDING_RECEIVED = receivedData.map(req => ({
      ...req,
      profile: profilesData.find(p => p.id === req.sender_id) || { id: req.sender_id }
    }));
  } else {
    FRIENDS = [];
    PENDING_SENT = [];
    PENDING_RECEIVED = [];
  }
}

async function sendFriendRequest(){
  if(!USER){
    location.href = 'sobral_login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }
  if(!PROFILE?.id || isMyProfile) return;
  if(PROFILE.id === USER.id) return;

  const { data: existing, error: existingError } = await supa.from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${USER.id},receiver_id.eq.${PROFILE.id}),and(sender_id.eq.${PROFILE.id},receiver_id.eq.${USER.id})`)
    .maybeSingle();

  if(existingError){
    toast('Erro ao verificar amizade existente: ' + existingError.message, 'err');
    return;
  }

  if(existing){
    if(existing.status === 'accepted'){
      FRIEND_REQUEST = existing;
      toast('Vocês já são amigos.', 'info');
      renderPage();
      return;
    }
    if(existing.status === 'pending'){
      if(existing.sender_id === USER.id){
        FRIEND_REQUEST = existing;
        toast('Pedido já enviado.', 'info');
        renderPage();
        return;
      }
      if(existing.receiver_id === USER.id){
        const { data, error } = await supa.from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .maybeSingle();

        if(error){
          toast('Não foi possível aceitar o pedido existente: ' + error.message, 'err');
          return;
        }

        FRIEND_REQUEST = data || existing;
        toast('Pedido de amizade aceito automaticamente!','ok');
        await loadFriendData(PROFILE.id);
        renderPage();
        return;
      }
    }
  }

  const { data, error } = await supa.from('friend_requests')
    .insert({ sender_id: USER.id, receiver_id: PROFILE.id, status: 'pending' })
    .select()
    .maybeSingle();

  if(error){
    toast('Não foi possível enviar o pedido: ' + error.message, 'err');
    return;
  }

  FRIEND_REQUEST = data || null;
  toast('Pedido de amizade enviado!','ok');
  renderPage();
}

async function acceptFriendRequest(){
  if(!USER || !FRIEND_REQUEST || FRIEND_REQUEST.status !== 'pending') return;
  if(FRIEND_REQUEST.receiver_id !== USER.id) return;

  const { data, error } = await supa.from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', FRIEND_REQUEST.id)
    .select()
    .maybeSingle();

  if(error){
    toast('Não foi possível aceitar o pedido: ' + error.message, 'err');
    return;
  }

  FRIEND_REQUEST = data || FRIEND_REQUEST;
  await loadFriendData(PROFILE.id);
  toast('Amizade aceita!','ok');
  renderPage();
}

function setActiveTab(tab){
  document.querySelectorAll('.ptab').forEach(b=>{
    b.classList.toggle('active',b.dataset.tab===tab);
  });
}

function showTab(tab){
  currentTab=tab;
  setActiveTab(tab);
  renderTab(tab);
}

function renderFriends(){
  if(!isMyProfile){
    return `<div class="empty"><div class="empty-icon"><i data-lucide="users" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Amigos apenas no seu perfil</h3><p>Faça login e visite seu próprio perfil para ver sua lista de amigos.</p></div>`;
  }

  const friendCards = FRIENDS.map(f => {
    const profileUrl = f.username ? `/${f.username}` : `sobral_perfil.html?id=${f.id}`;
    return `<div class="sub-card" style="padding:14px;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:12px">
      <a href="${profileUrl}" style="display:flex;align-items:center;gap:12px;flex:1;text-decoration:none;color:inherit">
        <div style="width:44px;height:44px;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);flex-shrink:0">
          ${f.avatar_url ? `<img src="${f.avatar_url}" alt="${f.full_name||'Amigo'}" style="width:100%;height:100%;object-fit:cover">` : `<div class="avatar-placeholder" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">${(f.full_name||'A').charAt(0).toUpperCase()}</div>`}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${f.full_name || 'Amigo'}</div>
          <div style="font-size:12px;color:var(--muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${f.username ? '@' + f.username : (f.bio ? f.bio.substring(0, 45) : 'Perfil Sobral Cultural')}</div>
        </div>
      </a>
      <button class="btn btn-danger btn-sm" onclick="removeFriend('${f.id}')" style="font-size:12px;white-space:nowrap">Remover</button>
    </div>`;
  }).join('');

  const sentHtml = PENDING_SENT.length ? `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:15px;font-weight:700">Pedidos enviados</div><div style="color:var(--muted);font-size:12px">${PENDING_SENT.length} pedido${PENDING_SENT.length!==1?'s':''}</div></div>
      <div class="cards-grid">${PENDING_SENT.map(req=>{
        const other = req.profile || { id: req.receiver_id, full_name: 'Membro' };
        const profileUrl = other.username ? `/${other.username}` : `sobral_perfil.html?id=${other.id}`;
        return `<div class="sub-card" style="padding:14px;min-width:0;display:flex;flex-direction:column;gap:12px">
          <div>
            <div style="font-weight:600">${other.full_name || 'Membro'}</div>
            <a href="${profileUrl}" style="font-size:12px;color:var(--ochre);text-decoration:none">Ver perfil</a>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="cancelFriendRequest('${req.id}')" style="font-size:12px;width:100%">Cancelar pedido</button>
        </div>`;
      }).join('')}</div>
    </div>` : '';

  const receivedHtml = PENDING_RECEIVED.length ? `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:15px;font-weight:700">Pedidos recebidos</div><div style="color:var(--muted);font-size:12px">${PENDING_RECEIVED.length} pedido${PENDING_RECEIVED.length!==1?'s':''}</div></div>
      <div class="cards-grid">${PENDING_RECEIVED.map(req=>{
        const other = req.profile || { id: req.sender_id, full_name: 'Membro' };
        const profileUrl = other.username ? `/${other.username}` : `sobral_perfil.html?id=${other.id}`;
        return `<div class="sub-card" style="padding:14px;min-width:0;display:flex;flex-direction:column;gap:12px">
          <div>
            <div style="font-weight:600">${other.full_name || 'Membro'}</div>
            <a href="${profileUrl}" style="font-size:12px;color:var(--ochre);text-decoration:none">Ver perfil</a>
          </div>
          <button class="btn btn-primary btn-sm" onclick="acceptFriendRequestById('${req.id}')" style="font-size:12px;width:100%">Aceitar amizade</button>
        </div>`;
      }).join('')}</div>
    </div>` : '';

  if(!FRIENDS.length && !sentHtml && !receivedHtml){
    return `<div class="empty"><div class="empty-icon"><i data-lucide="users" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Você ainda não tem amigos</h3><p>Envie pedidos de amizade para outros membros e eles aparecerão aqui quando aceitarem.</p></div>`;
  }

  return `<div style="display:flex;flex-direction:column;gap:22px">
    ${receivedHtml}
    ${sentHtml}
    ${FRIENDS.length ? `<div><div style="font-size:15px;font-weight:700;margin-bottom:12px">Meus amigos (${FRIENDS.length})</div><div class="cards-grid">${friendCards}</div></div>` : ''}
  </div>`;
}

function acceptFriendRequestById(requestId){
  if(!requestId) return;
  (async () => {
    const { data, error } = await supa.from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if(error){
      toast('Erro ao aceitar amizade: ' + error.message, 'err');
      return;
    }

    toast('Amizade aceita!','ok');
    await loadFriendData(USER.id);
    renderTab('friends');
  })();
}

async function removeFriend(friendId){
  if(!friendId || !USER) return;
  const { error } = await supa.from('friend_requests')
    .delete()
    .or(`and(sender_id.eq.${USER.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${USER.id})`)
    .eq('status','accepted');

  if(error){
    toast('Erro ao remover amigo: ' + error.message, 'err');
    return;
  }

  toast('Amigo removido.','ok');
  await loadFriendData(USER.id);
  renderTab('friends');
}

async function cancelFriendRequest(requestId){
  if(!requestId) return;
  const { error } = await supa.from('friend_requests').delete().eq('id', requestId);
  if(error){
    toast('Erro ao cancelar pedido: ' + error.message, 'err');
    return;
  }
  toast('Pedido cancelado.','ok');
  const targetId = isMyProfile ? USER.id : PROFILE.id;
  await loadFriendData(targetId);
  renderPage();
  if(isMyProfile) renderTab('friends');
}

function showFavTab(filter){
  currentFavFilter=filter;
  showTab('favorites');
}

function renderTab(tab){
  const c=document.getElementById('tabContent');
  if(!c) return;
  if(tab==='mymap'){ renderMyMap(); return; }
  let html='';
  if(tab==='favorites')   html=renderFavorites();
  else if(tab==='photos') html=renderPhotos();
  else if(tab==='submissions') html=renderSubmissions();
  else if(tab==='friends') html=renderFriends();
  else if(tab==='settings')    html=renderSettings();
  c.classList.remove('tab-fade');
  void c.offsetWidth;
  c.innerHTML=html;
  c.classList.add('tab-fade');
  window.lucide?.createIcons();
}

/* ── Meu Mapa ─────────────────────────────────────────────────────────── */
function renderMyMap(){
  const beenSpots=REACTIONS.filter(r=>r.reaction==='been').map(r=>SPOTS_MAP[r.spot_id]).filter(Boolean);
  const goingSpots=REACTIONS.filter(r=>r.reaction==='going').map(r=>SPOTS_MAP[r.spot_id]).filter(Boolean);
  const allSpots=[...new Map([...beenSpots,...goingSpots].map(s=>[s.id,s])).values()];
  const c=document.getElementById('tabContent');

  if(!allSpots.length){
    c.classList.remove('tab-fade');void c.offsetWidth;
    c.innerHTML=`<div class="empty">
      <div class="empty-icon"><i data-lucide="route" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div>
      <h3>Nenhum ponto no seu roteiro</h3>
      <p>Marque lugares como "Eu Fui" ou "Eu Vou" no mapa para criar seu roteiro pessoal.</p>
      <a href="index.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600"><i data-lucide="map" style="width:14px;height:14px;pointer-events:none"></i> Explorar o Mapa</a>
    </div>`;
    c.classList.add('tab-fade');window.lucide?.createIcons();return;
  }

  const beenIds=new Set(beenSpots.map(s=>s.id));
  const goingIds=new Set(goingSpots.map(s=>s.id));

  const legend=`<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)"><div style="width:12px;height:12px;border-radius:50%;background:#4CAF82;flex-shrink:0"></div>Eu Fui (${beenSpots.length})</div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)"><div style="width:12px;height:12px;border-radius:50%;background:#C8871A;flex-shrink:0"></div>Eu Vou (${goingSpots.length})</div>
  </div>`;

  const routeList=allSpots.map((s,i)=>`
    <a href="index.html?id=${s.id}" class="route-item">
      <div class="route-num">${i+1}</div>
      <div class="route-thumb" style="background:${s.color||'#888'}22">
        ${s.photo?`<img src="${s.photo}" alt="${s.name}" loading="lazy">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${s.color||'#888'}">${s.name.charAt(0)}</div>`}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13.5px;color:var(--cream);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
        <div style="font-size:11px;color:var(--muted)">${CAT_LABELS[s.cat]||s.cat}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        ${beenIds.has(s.id)?`<span class="route-badge been">Fui</span>`:''}
        ${goingIds.has(s.id)?`<span class="route-badge going">Vou</span>`:''}
      </div>
    </a>`).join('');

  c.classList.remove('tab-fade');void c.offsetWidth;
  c.innerHTML=`${legend}<div id="profileMap" style="height:320px;border-radius:14px;overflow:hidden;margin-bottom:20px;border:1px solid rgba(200,135,26,.2)"></div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px;font-weight:500">Roteiro (${allSpots.length} ponto${allSpots.length!==1?'s':''})</div>
    <div style="display:flex;flex-direction:column;gap:8px">${routeList}</div>`;
  c.classList.add('tab-fade');
  window.lucide?.createIcons();
  initProfileMap();
}

function initProfileMap(){
  setTimeout(()=>{
    const el=document.getElementById('profileMap');
    if(!el) return;
    if(profileMap){profileMap.remove();profileMap=null;}
        profileMap=L.map('profileMap',{center:[-3.688,-40.3497],zoom:13,zoomControl:true,attributionControl:false});
    
    const isLightMode = document.body.classList.contains('theme-light');
    const tileUrl = isLightMode 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl,{attribution:'© OSM © CARTO',maxZoom:19,subdomains:'abcd'}).addTo(profileMap);
    const beenSpots=REACTIONS.filter(r=>r.reaction==='been').map(r=>SPOTS_MAP[r.spot_id]).filter(Boolean);
    const goingSpots=REACTIONS.filter(r=>r.reaction==='going').map(r=>SPOTS_MAP[r.spot_id]).filter(Boolean);
    const beenIds=new Set(beenSpots.map(s=>s.id));
    const allSpots=[...new Map([...beenSpots,...goingSpots].map(s=>[s.id,s])).values()];
    const bounds=[];
    allSpots.forEach((s,i)=>{
      const color=beenIds.has(s.id)?'#4CAF82':'#C8871A';
      const m=L.marker([s.lat,s.lng],{icon:L.divIcon({html:`<div style="width:32px;height:32px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,.4);box-shadow:0 2px 8px rgba(0,0,0,.4)">${i+1}</div>`,className:'',iconSize:[32,32],iconAnchor:[16,16]})}).addTo(profileMap);
      m.bindPopup(`<div class="pp-title">${s.name}</div><div class="pp-sub"><a href="index.html?id=${s.id}" style="color:var(--ochre)">Ver no mapa →</a></div>`);
      bounds.push([s.lat,s.lng]);
    });
    if(bounds.length>1) L.polyline(bounds,{color:'rgba(200,135,26,.4)',weight:2,dashArray:'5 5'}).addTo(profileMap);
    if(bounds.length) profileMap.fitBounds(L.latLngBounds(bounds).pad(.2));
  },100);
}

/* ── Favoritos ────────────────────────────────────────────────────────── */
function renderFavorites(){
  const all=REACTIONS.filter(r=>['like','been','going'].includes(r.reaction)&&SPOTS_MAP[r.spot_id]);
  const filtered=currentFavFilter==='all'?all:all.filter(r=>r.reaction===currentFavFilter);
  const counts={all:all.length,like:all.filter(r=>r.reaction==='like').length,been:all.filter(r=>r.reaction==='been').length,going:all.filter(r=>r.reaction==='going').length};
  const pills=[{key:'all',label:`<i data-lucide="list" style="width:16px;height:16px"></i> Todos (${counts.all})`},{key:'like',label:`<i data-lucide="heart" style="width:16px;height:16px"></i> Gostei (${counts.like})`},{key:'been',label:`<i data-lucide="check-circle" style="width:16px;height:16px"></i> Eu Fui (${counts.been})`},{key:'going',label:`<i data-lucide="calendar" style="width:16px;height:16px"></i> Eu Vou (${counts.going})`}]
    .map(p=>`<button class="fav-pill${currentFavFilter===p.key?' active':''}" onclick="setFavFilter('${p.key}')">${p.label}</button>`).join('');

  if(!filtered.length){
    const msg=currentFavFilter==='all'?'Explore o mapa e marque lugares que você gostou, visitou ou quer visitar!':currentFavFilter==='like'?'Reaja com "Gostei" em locais no mapa para eles aparecerem aqui.':currentFavFilter==='been'?'Marque lugares que você já visitou no mapa.':'Planeje sua visita marcando lugares como "Eu Vou".';
    return `<div class="fav-pills">${pills}</div><div class="empty"><div class="empty-icon"><i data-lucide="heart" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Nenhum local aqui</h3><p>${msg}</p><a href="index.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600"><i data-lucide="map" style="width:14px;height:14px;pointer-events:none"></i> Explorar o Mapa</a></div>`;
  }

  const iconMap={like:'heart',been:'check-circle',going:'calendar'};
  const colorMap={like:'rgba(200,135,26,.1)',been:'rgba(76,175,130,.1)',going:'rgba(100,64,180,.1)'};
  const cards=filtered.map(r=>`
    <a href="index.html?id=${r.spot_id}" class="reaction-card">
      <div class="rc-emoji" style="background:${colorMap[r.reaction]}"><i data-lucide="${iconMap[r.reaction]}" style="width:22px;height:22px;stroke-width:1.5;opacity:.7"></i></div>
      <div class="rc-info">
        <div class="rc-name">${SPOTS_MAP[r.spot_id]?.name||'Ponto Turístico'}</div>
        <div class="rc-meta">${CAT_LABELS[SPOTS_MAP[r.spot_id]?.cat]||''} · ${new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="rc-type">${REACTION_LABELS[r.reaction]}</div>
    </a>`).join('');

  return `<div class="fav-pills">${pills}</div><div style="font-size:13px;color:var(--muted);margin-bottom:14px">${filtered.length} lugar${filtered.length!==1?'es':''}</div><div style="display:flex;flex-direction:column;gap:10px">${cards}</div>`;
}

function setFavFilter(filter){
  currentFavFilter=filter;
  const c=document.getElementById('tabContent');
  c.classList.remove('tab-fade');void c.offsetWidth;
  c.innerHTML=renderFavorites();
  c.classList.add('tab-fade');
  window.lucide?.createIcons();
}

/* ── Envios ──────────────────────────────────────────────────────── */
function renderSubmissions(){
  if(!SUBS.length) return `<div class="empty"><div class="empty-icon"><i data-lucide="map-pin" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Nenhum envio ainda</h3><p>${isMyProfile ? 'Envie um ponto turístico ou evento para que ele apareça no mapa!' : 'Este usuário ainda não enviou nenhum ponto.'}</p>${isMyProfile ? `<a href="sobral_submeter.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600"><i data-lucide="plus" style="width:14px;height:14px;pointer-events:none"></i> Enviar Ponto ou Evento</a>` : ''}</div>`;
  
  const header = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <div style="font-size:14px;color:var(--muted)">${SUBS.length} envio${SUBS.length!==1?'s':''}</div>
    ${isMyProfile ? `<a href="sobral_submeter.html" class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:12px;height:12px;pointer-events:none"></i> Nova</a>` : ''}
  </div>`;

  return `${header}
  <div class="cards-grid">${SUBS.map(s=>`
    <div class="sub-card">
      <div class="sub-photo">
        ${s.photo?`<img src="${s.photo}" alt="${s.name}">`:`<div class="sub-photo-ph">${s.emoji||'📍'}</div>`}
        <div class="sub-badge ${s.status}">${s.status==='pending'?'<i data-lucide="clock" style="width:12px;height:12px"></i> Aguardando':s.status==='approved'?'<i data-lucide="check-circle" style="width:12px;height:12px"></i> Aprovado':'<i data-lucide="x-circle" style="width:12px;height:12px"></i> Rejeitado'}</div>
      </div>
      <div class="sub-body">
        <div class="sub-name">${s.emoji||''} ${s.name}</div>
        <div class="sub-meta">${CAT_LABELS[s.cat]||s.cat} · ${s.type==='event'?'Evento':'Ponto Turístico'}<br>${new Date(s.created_at).toLocaleDateString('pt-BR')}
        ${s.status==='rejected'&&s.admin_note?`<br><span style="color:#e89e7e;font-size:11px">Motivo: ${s.admin_note}</span>`:''}
        ${s.status==='approved'?`<br><a href="sobral_post.html?id=${s.id}" style="color:var(--ochre);font-size:11px">Ver publicado →</a>`:''}
        </div>
        <div class="sub-actions">
          ${isMyProfile && s.status!=='approved'?`<a href="sobral_submeter.html?edit=${s.id}" class="btn btn-sm btn-secondary"><i data-lucide="pencil" style="width:13px;height:13px;pointer-events:none"></i></a>`:''}
          ${isMyProfile ? `<button class="btn btn-sm btn-danger" onclick="deleteSub('${s.id}')"><i data-lucide="trash-2" style="width:13px;height:13px;pointer-events:none"></i></button>` : ''}
        </div>
      </div>
    </div>`).join('')}</div>`;
}

/* ── Configurações ───────────────────────────────────────────────────── */
function renderSettings(){
  const name=PROFILE.full_name||USER.user_metadata?.full_name||'';
  const bio=PROFILE.bio||'';
  return `<div class="edit-form">
    <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border)"><i data-lucide="settings" style="width:16px;height:16px"></i> Editar Perfil</h3>
    <div class="fg"><label>Nome Completo</label><input id="sName" value="${name}" placeholder="Seu nome"></div>
    <div class="fg"><label>Bio / Descrição</label><textarea id="sBio" rows="3" placeholder="Conte um pouco sobre você…">${bio}</textarea></div>
    <div class="fg">
      <label>URL Personalizada (Nome de Usuário)</label>
      <div style="display:flex;align-items:center;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;padding-left:12px;overflow:hidden;margin-top:4px">
        <span style="color:var(--muted);font-size:13px;white-space:nowrap">${window.location.host}/</span>
        <input id="sUser" value="${PROFILE.username || ''}" placeholder="seunome" style="border:none;background:transparent;padding:10px 8px;flex:1;min-width:0;color:var(--cream);font-family:inherit" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_-]/g,'')">
      </div>
      <small style="color:var(--muted);font-size:11px;display:block;margin-top:6px">Apenas letras, números e traços. Ex: carlos-silva</small>
    </div>
    <div class="fg">
      <label>Tema do Perfil</label>
      <select id="sTheme" style="width:100%;background:var(--input-bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--cream);font-family:inherit;font-size:14px;margin-top:4px;outline:none;cursor:pointer">
        <option value="default" ${PROFILE.theme==='default'||!PROFILE.theme?'selected':''}>Padrão (Sobral)</option>
        <option value="dark" ${PROFILE.theme==='dark'?'selected':''}>Modo Escuro (Dark)</option>
        <option value="light" ${PROFILE.theme==='light'?'selected':''}>Modo Claro (Light)</option>
      </select>
      <small style="color:var(--muted);font-size:11px;display:block;margin-top:6px">Altera as cores da sua página de perfil para você e seus visitantes.</small>
    </div>
    <div class="fg"><label>E-mail (não editável)</label><input value="${USER.email}" disabled style="opacity:.5"></div>
    <div style="display:flex;gap:10px;margin-top:4px">
      <button class="btn btn-primary" onclick="saveProfile()"><i data-lucide="save" style="width:14px;height:14px;pointer-events:none"></i> Salvar Alterações</button>
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:24px 0">
    <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;margin-bottom:14px"><i data-lucide="lock" style="width:15px;height:15px"></i> Alterar Senha</h3>
    <div class="fg"><label>Nova Senha</label><input id="newPass" type="password" placeholder="Mínimo 8 caracteres"></div>
    <div class="fg"><label>Confirmar Nova Senha</label><input id="newPass2" type="password" placeholder="Repita a senha"></div>
    <button class="btn btn-secondary" onclick="changePassword()"><i data-lucide="key" style="width:14px;height:14px;pointer-events:none"></i> Alterar Senha</button>
    <hr style="border:none;border-top:1px solid var(--border);margin:24px 0">
    <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;color:#e89e7e;margin-bottom:12px"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Zona de Perigo</h3>
    <button class="btn btn-danger" onclick="confirmDeleteAccount()"><i data-lucide="trash-2" style="width:14px;height:14px;pointer-events:none"></i> Excluir minha conta</button>
  </div>`;
}

function renderPhotos(){
  if(!ALBUM_POINTS.length){
    return `<div class="empty"><div class="empty-icon"><i data-lucide="camera" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Fotos indisponíveis</h3><p>Não há pontos turísticos cadastrados para este recurso.</p></div>`;
  }

  const photoMap = ALBUM_PHOTOS.reduce((map,item)=>{ map[item.spot_id] = item; return map; }, {});
  const completed = ALBUM_POINTS.filter(p => photoMap[p.id]?.status === 'verified').length;

  const cards = ALBUM_POINTS.map((spot,index) => {
    const photo = photoMap[spot.id];
    const hasPhoto = !!photo?.photo_url;
    const preview = hasPhoto ? `<img src="${photo.photo_url}" alt="${spot.name}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\'photo-slot-empty\'><div><i data-lucide=\'alert-circle\' style=\'width:28px;height:28px\'></i></div><div>Erro ao carregar a foto</div></div>'">` : `<div class="photo-slot-empty"><div><i data-lucide="camera" style="width:28px;height:28px"></i></div><div>Envie uma foto do local</div></div>`;
    const clickable = ' photo-slot-clickable';
    const clickAction = isMyProfile ? ` onclick="choosePhotoForSpot('${spot.id}')"` : ` onclick="location.href='index.html?id=${spot.id}'"`;
    const icon = CAT_ICONS[spot.cat] || 'map-pin';
    const likeCount = photo?.id ? (ALBUM_PHOTO_LIKE_COUNTS[photo.id] || 0) : 0;
    const hasLiked = photo?.id ? ALBUM_PHOTO_MY_LIKES.has(photo.id) : false;
    let likeButton = '';
    let deleteButton = '';
    if(hasPhoto && photo?.id && isMyProfile){
      deleteButton = `<button class="photo-like-btn photo-delete-btn" title="Excluir foto" onclick="event.stopPropagation();deleteAlbumPhoto('${photo.id}','${spot.id}','${photo.photo_path||''}')"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>`;
    }
    if(hasPhoto && photo?.id){
      if(isMyProfile && likeCount > 0){
        likeButton = `<div style="display:inline-flex;gap:4px"><button class="photo-like-btn${hasLiked ? ' active' : ''}" onclick="event.stopPropagation();toggleAlbumPhotoLike('${photo.id}')"><i data-lucide="heart" style="width:16px;height:16px"></i></button><button class="photo-like-btn" onclick="event.stopPropagation();showPhotoLikes('${photo.id}')"><span>${likeCount} curtidas</span></button></div>`;
      } else {
        likeButton = `<button class="photo-like-btn${hasLiked ? ' active' : ''}" onclick="event.stopPropagation();toggleAlbumPhotoLike('${photo.id}')"><i data-lucide="heart" style="width:16px;height:16px"></i></button>`;
      }
    }

    const actionsHtml = (likeButton || deleteButton) ? `<div class="photo-slot-actions">${likeButton}${deleteButton}</div>` : '';

    return `<div class="photo-slot${clickable}"${clickAction}>
      <div class="photo-slot-head"><div class="slot-index"><i data-lucide="${icon}" style="width:16px;height:16px"></i></div><div class="slot-title">${spot.name}</div></div>
      <div class="photo-slot-preview">${preview}</div>
      ${actionsHtml}
    </div>`;
  }).join('');

  const bronzeDone = completed >= 1;
  const silverDone = completed >= 2;
  const goldDone = completed >= 4;
  const progressPercent = Math.min((completed / 4) * 100, 100);

  const checklistHtml = `
    <div class="badge-progress-container" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--cream)">Progresso do Selo de Verificação</div>
      <div class="badge-progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:16px">
        <div style="height:100%;width:${progressPercent}%;background:var(--ochre);border-radius:3px;transition:width 0.5s ease"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="badge-step ${bronzeDone ? 'done' : ''}" style="display:flex;align-items:center;gap:10px;opacity:${bronzeDone ? '1' : '0.5'}">
          <i data-lucide="${bronzeDone ? 'check-circle-2' : 'circle'}" style="width:18px;height:18px;color:${bronzeDone ? '#CD7F32' : 'var(--muted)'}"></i>
          <i data-lucide="badge-check" style="width:20px;height:20px;color:#CD7F32;fill:rgba(205,127,50,0.15)"></i>
          <span style="font-size:13px;color:var(--cream)">Bronze (1 foto)</span>
        </div>
        <div class="badge-step ${silverDone ? 'done' : ''}" style="display:flex;align-items:center;gap:10px;opacity:${silverDone ? '1' : '0.5'}">
          <i data-lucide="${silverDone ? 'check-circle-2' : 'circle'}" style="width:18px;height:18px;color:${silverDone ? '#C0C0C0' : 'var(--muted)'}"></i>
          <i data-lucide="badge-check" style="width:20px;height:20px;color:#C0C0C0;fill:rgba(192,192,192,0.15)"></i>
          <span style="font-size:13px;color:var(--cream)">Prata (2 a 3 fotos)</span>
        </div>
        <div class="badge-step ${goldDone ? 'done' : ''}" style="display:flex;align-items:center;gap:10px;opacity:${goldDone ? '1' : '0.5'}">
          <i data-lucide="${goldDone ? 'check-circle-2' : 'circle'}" style="width:18px;height:18px;color:${goldDone ? '#FFD700' : 'var(--muted)'}"></i>
          <i data-lucide="badge-check" style="width:20px;height:20px;color:#FFD700;fill:rgba(255,215,0,0.15)"></i>
          <span style="font-size:13px;color:var(--cream)">Ouro (4 fotos)</span>
        </div>
      </div>
    </div>
  `;

  return `<div class="photos-intro"><p>Envie apenas fotos tiradas no próprio ponto turístico. A imagem precisa ter localização registrada para ser aceita. Fotos sem dados de localização não serão enviadas.</p>${checklistHtml}<div class="photos-progress" style="margin-top:16px">${completed} de ${ALBUM_POINTS.length} fotos aceitas</div></div><div class="photos-grid">${cards}</div>`;
}

async function loadAlbumPhotoLikes(){
  ALBUM_PHOTO_LIKE_COUNTS = {};
  ALBUM_PHOTO_MY_LIKES = new Set();
  if(!ALBUM_PHOTOS.length || !USER) return;

  const photoIds = ALBUM_PHOTOS.map(p=>p.id).filter(Boolean);
  if(!photoIds.length) return;

  if(isMyProfile){
    const { data, error } = await supa.from('album_photo_likes').select('id,user_id,photo_id').in('photo_id', photoIds);
    if(error){ console.error('loadAlbumPhotoLikes', error.message); return; }
    (data || []).forEach(r => {
      ALBUM_PHOTO_LIKE_COUNTS[r.photo_id] = (ALBUM_PHOTO_LIKE_COUNTS[r.photo_id] || 0) + 1;
      if(r.user_id === USER.id) ALBUM_PHOTO_MY_LIKES.add(r.photo_id);
    });
  } else {
    const { data, error } = await supa.from('album_photo_likes').select('photo_id').eq('user_id', USER.id).in('photo_id', photoIds);
    if(error){ console.error('loadAlbumPhotoLikes', error.message); return; }
    (data || []).forEach(r => ALBUM_PHOTO_MY_LIKES.add(r.photo_id));
  }
}

async function normalizeAlbumPhotoUrls(){
  if(!ALBUM_PHOTOS.length) return;
  await Promise.all(ALBUM_PHOTOS.map(async photo => {
    if(photo.photo_path){
      try {
        const { data, error } = await supa.storage.from('spots-photos').createSignedUrl(photo.photo_path, 60 * 60);
        if(!error && data?.signedUrl){
          photo.photo_url = data.signedUrl;
        }
      } catch (err) {
        console.error('normalizeAlbumPhotoUrls', err);
      }
    }
  }));
}

async function toggleAlbumPhotoLike(photoId){
  if(!USER){ toast('Entre para curtir esta foto.','err'); return; }
  const liked = ALBUM_PHOTO_MY_LIKES.has(photoId);
  if(liked){
    const { error } = await supa.from('album_photo_likes').delete().eq('user_id', USER.id).eq('photo_id', photoId);
    if(error){ toast('Erro ao remover curtida: ' + error.message,'err'); return; }
    ALBUM_PHOTO_MY_LIKES.delete(photoId);
    ALBUM_PHOTO_LIKE_COUNTS[photoId] = Math.max(0, (ALBUM_PHOTO_LIKE_COUNTS[photoId] || 0) - 1);
    toast('Curtida removida','ok');
  } else {
    const { error } = await supa.from('album_photo_likes').insert({ user_id: USER.id, photo_id: photoId });
    if(error){ toast('Erro ao curtir foto: ' + error.message,'err'); return; }
    ALBUM_PHOTO_MY_LIKES.add(photoId);
    ALBUM_PHOTO_LIKE_COUNTS[photoId] = (ALBUM_PHOTO_LIKE_COUNTS[photoId] || 0) + 1;
    toast('Foto curtida','ok');
  }
  if(currentTab === 'photos') renderTab('photos');
}

async function showPhotoLikes(photoId) {
  if(!USER || !isMyProfile) return;
  toast('Carregando curtidas...', 'info');
  
  const { data: likesData, error: likesError } = await supa
    .from('album_photo_likes')
    .select('user_id')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: false });

  if(likesError) { toast('Erro ao carregar curtidas: ' + likesError.message, 'err'); return; }
  
  const userIds = (likesData || []).map(l => l.user_id);
  let profilesData = [];
  
  if (userIds.length > 0) {
    const { data: pData, error: pError } = await supa
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds);
      
    if(!pError) { profilesData = pData || []; }
  }
  
  const mergedData = (likesData || []).map(like => {
    return {
      user_id: like.user_id,
      profiles: profilesData.find(p => p.id === like.user_id) || null
    };
  });
  
  const t = document.getElementById('toast');
  if(t) {
    t.className = 'toast';
    t.style.bottom = ''; // Limpa caso tenha ficado
  }

  renderLikesModal(mergedData);
}

function renderLikesModal(likes) {
  closePhotoLikesModal();
  const overlay = document.createElement('div');
  overlay.id = 'photoLikesModal';
  overlay.className = 'photo-likes-modal-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) closePhotoLikesModal(); };
  
  const content = document.createElement('div');
  content.className = 'photo-likes-modal-content';
  
  const header = document.createElement('div');
  header.className = 'photo-likes-header';
  header.innerHTML = `<h3 style="display:flex;align-items:center;font-size:16px;margin:0;font-family:'Plus Jakarta Sans',sans-serif"><i data-lucide="heart" style="width:16px;height:16px;margin-right:6px"></i> Quem curtiu</h3><button style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px" onclick="closePhotoLikesModal()"><i data-lucide="x" style="width:20px;height:20px"></i></button>`;
  
  const list = document.createElement('div');
  list.className = 'photo-likes-list';
  
  if(likes.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Ninguém curtiu ainda.</div>`;
  } else {
    likes.forEach(like => {
      const p = like.profiles || {};
      const name = p.full_name || 'Usuário';
      
      let avatarHtml = '';
      if(p.avatar_url){
        avatarHtml = `<div class="avatar" style="width:40px;height:40px;border-width:2px;flex-shrink:0"><img src="${p.avatar_url}" alt="${name}"></div>`;
      } else {
        avatarHtml = `<div class="avatar-placeholder" style="width:40px;height:40px;border-width:2px;font-size:16px;flex-shrink:0">${name.charAt(0).toUpperCase()}</div>`;
      }

      const link = p.username ? window.location.origin + '/' + p.username : window.location.origin + '/sobral_perfil.html?id=' + (p.id || like.user_id);
      
      list.innerHTML += `
        <a href="${link}" class="photo-likes-user-item">
          ${avatarHtml}
          <div class="user-info">
            <div class="user-name">${name}</div>
            ${p.username ? `<div class="user-handle">@${p.username}</div>` : ''}
          </div>
        </a>
      `;
    });
  }
  
  content.appendChild(header);
  content.appendChild(list);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  window.lucide?.createIcons();
}

function closePhotoLikesModal() {
  const el = document.getElementById('photoLikesModal');
  if(el) el.remove();
}

async function deleteAlbumPhoto(photoId, spotId, photoPath){
  if(!USER || !isMyProfile) return;
  if(!confirm('Excluir esta foto? Esta ação não pode ser desfeita.')) return;

  const { error: dbError } = await supa
    .from('album_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', USER.id);

  if(dbError){ toast('Erro ao excluir foto: ' + dbError.message, 'err'); return; }

  if(photoPath){
    await supa.storage.from('spots-photos').remove([photoPath]);
  }

  ALBUM_PHOTOS = ALBUM_PHOTOS.filter(p => p.id !== photoId);
  toast('Foto excluída com sucesso!', 'ok');
  if(currentTab === 'photos') renderTab('photos');
}

function choosePhotoForSpot(spotId){
  selectedAlbumSpot = spotId;
  const input = document.getElementById('albumPhotoInput');
  if(!input){ toast('Erro interno: seletor de fotos não encontrado.','err'); return; }
  input.value = '';
  input.click();
}

function handleAlbumPhoto(file){
  if(!file) return;
  if(!selectedAlbumSpot){ toast('Selecione um slot antes de enviar.','err'); return; }
  if(file.type && !file.type.startsWith('image/')){ toast('Escolha uma imagem válida.','err'); return; }
  processAlbumPhoto(file, selectedAlbumSpot);
}

async function processAlbumPhoto(file, spotId){
  const spot = ALBUM_POINTS.find(s => String(s.id) === String(spotId));
  if(!spot){ toast('Ponto turístico não encontrado.','err'); return; }

  toast('Validando localização da foto...');
  let gps = null;
  try { gps = await parseImageGPS(file); } catch (err) { gps = null; }
  if(!gps){
    console.debug('parseImageGPS failed', { name: file.name, type: file.type, size: file.size });
    toast('Foto sem localização registrada ou formato não suportado. Use uma imagem JPEG com localização.', 'err');
    selectedAlbumSpot = null;
    return;
  }

  const distance = getDistanceMeters(gps.lat, gps.lng, spot.lat, spot.lng);
  console.log(`Validação GPS: Foto(${gps.lat}, ${gps.lng}) vs Local(${spot.lat}, ${spot.lng}) - Distância: ${distance.toFixed(2)}m`);
  
  if(distance > 2000){ 
    toast(`Foto fora do local (distância: ${Math.round(distance)}m). O limite é 2km.`, 'err'); 
    selectedAlbumSpot = null; 
    return; 
  }

  let blob;
  try { blob = await compressImageToWebP(file, 720, 0.72); } catch (err) { toast('Falha ao processar a imagem.','err'); selectedAlbumSpot = null; return; }

  const path = `album-photos/${USER.id}/${spot.id}-${Date.now()}.webp`;
  const { data: uploadData, error: uploadError } = await supa.storage.from('spots-photos').upload(path, blob, { contentType: blob.type, upsert:true });
  if(uploadError){ toast('Erro ao enviar a foto: ' + uploadError.message, 'err'); selectedAlbumSpot = null; return; }

  const { data: urlData, error: urlError } = supa.storage.from('spots-photos').getPublicUrl(path);
  if(urlError){ toast('Erro ao obter URL da foto.','err'); selectedAlbumSpot = null; return; }

  const row = {
    user_id: USER.id,
    spot_id: spot.id,
    photo_url: urlData.publicUrl,
    photo_path: path,
    photo_lat: gps.lat,
    photo_lng: gps.lng,
    status: 'verified',
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  let { error: saveError } = await supa.from('album_photos').upsert(row, { onConflict:['user_id','spot_id'] });
  if(saveError){
    const { error: insertError } = await supa.from('album_photos').insert(row);
    if(insertError){ toast('Erro ao salvar a foto: ' + insertError.message, 'err'); selectedAlbumSpot = null; return; }
  }

  toast('Foto enviada com sucesso!','ok');
  selectedAlbumSpot = null;
  try {
    const { data: album } = await supa.from('album_photos').select('*').eq('user_id', USER.id);
    ALBUM_PHOTOS = album || [];
    await normalizeAlbumPhotoUrls();
  } catch (err) { ALBUM_PHOTOS = ALBUM_PHOTOS || []; }
  if(currentTab === 'photos') renderTab('photos');
}

function getDistanceMeters(lat1, lng1, lat2, lng2){
  const toRad = n => n * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return 6371000 * c;
}

function parseImageGPS(file){
  return new Promise((resolve) => {
    if(file.type !== 'image/jpeg' && file.type !== 'image/jpg') return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      const view = new DataView(reader.result);
      if(view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return resolve(null);
      let offset = 2;
      while(offset + 4 <= view.byteLength){
        if(view.getUint8(offset) !== 0xFF) break;
        const marker = view.getUint8(offset + 1);
        const length = view.getUint16(offset + 2);
        if(length < 2 || offset + 2 + length > view.byteLength) break;
        if(marker === 0xE1){
          const exifStart = offset + 4;
          if(exifStart + 4 > view.byteLength || getString(view, exifStart, 4) !== 'Exif') return resolve(null);
          const tiffOffset = exifStart + 6;
          if(tiffOffset + 8 > view.byteLength) return resolve(null);
          const little = view.getUint16(tiffOffset) === 0x4949;
          const firstIFD = tiffOffset + getUint32(view, tiffOffset + 4, little);
          const gpsTagOffset = findTagOffset(view, firstIFD, 0x8825, tiffOffset, little);
          if(!gpsTagOffset) return resolve(null);
          const gpsIFDPointer = tiffOffset + getUint32(view, gpsTagOffset + 8, little);
          const gpsData = readGPSInfo(view, gpsIFDPointer, little, tiffOffset);
          return resolve(gpsData);
        }
        offset += 2 + length;
      }
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

function getString(view, start, length){
  let out = '';
  const max = Math.min(length, view.byteLength - start);
  for(let i = 0; i < max; i++){
    const position = start + i;
    if(position < 0 || position >= view.byteLength) break;
    const char = view.getUint8(position);
    if(char === 0) break;
    out += String.fromCharCode(char);
  }
  return out;
}

function getUint32(view, offset, little){
  if(offset < 0 || offset + 4 > view.byteLength) return 0;
  return little ? view.getUint32(offset, true) : view.getUint32(offset, false);
}

function findTagOffset(view, dirOffset, tag, tiffOffset, little){
  if(dirOffset < 0 || dirOffset + 2 > view.byteLength) return 0;
  const entries = view.getUint16(dirOffset, little);
  let pointer = dirOffset + 2;
  for(let i = 0; i < entries; i++){
    if(pointer + 12 > view.byteLength) break;
    if(view.getUint16(pointer, little) === tag) return pointer;
    pointer += 12;
  }
  return 0;
}

function readGPSInfo(view, offset, little, tiffOffset){
  if(offset < 0 || offset + 2 > view.byteLength) return null;
  const entries = view.getUint16(offset, little);
  let lat = null, lng = null, latRef = '', lngRef = '';
  let pointer = offset + 2;
  for(let i = 0; i < entries; i++){
    if(pointer + 12 > view.byteLength) break;
    const tag = view.getUint16(pointer, little);
    const type = view.getUint16(pointer + 2, little);
    const count = view.getUint32(pointer + 4, little);
    const valueOffset = view.getUint32(pointer + 8, little);
    if(tag === 1) latRef = readAsciiValue(view, pointer + 8, tiffOffset, valueOffset, count, little).trim();
    if(tag === 3) lngRef = readAsciiValue(view, pointer + 8, tiffOffset, valueOffset, count, little).trim();
    if(tag === 2) lat = readRationalArray(view, tiffOffset + valueOffset, count, little);
    if(tag === 4) lng = readRationalArray(view, tiffOffset + valueOffset, count, little);
    pointer += 12;
  }
  if(!lat || !lng || !latRef || !lngRef) return null;
  const latitude = convertDMSToDecimal(lat, latRef);
  const longitude = convertDMSToDecimal(lng, lngRef);
  return { lat: latitude, lng: longitude };
}

function readAsciiValue(view, valuePointer, tiffOffset, valueOffset, count){
  const typeSize = 1; // ASCII
  const inlineBytes = count * typeSize <= 4;
  if(inlineBytes){
    return getString(view, valuePointer, count);
  }
  return getString(view, tiffOffset + valueOffset, count);
}

function readRationalArray(view, offset, count, little){
  const values = [];
  for(let i = 0; i < count; i++){
    const base = offset + i * 8;
    if(base + 8 > view.byteLength) break;
    const num = getUint32(view, base, little);
    const den = getUint32(view, base + 4, little);
    values.push(den ? num / den : 0);
  }
  return values;
}

function convertDMSToDecimal(values, ref){
  const decimal = values[0] + values[1] / 60 + values[2] / 3600;
  return ref === 'S' || ref === 'W' ? -decimal : decimal;
}

function compressImageToWebP(file, maxWidth = 720, quality = 0.72){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if(blob && blob.type === 'image/webp') return resolve(blob);
          canvas.toBlob(fallback => {
            if(!fallback) return reject(new Error('Não foi possível gerar a imagem.'));
            resolve(fallback);
          }, 'image/jpeg', quality);
        }, 'image/webp', quality);
      };
      img.onerror = () => reject(new Error('Erro ao processar a imagem.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

async function saveProfile(){
  const name=document.getElementById('sName').value.trim();
  const bio=document.getElementById('sBio').value.trim();
  const user=document.getElementById('sUser').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  const theme=document.getElementById('sTheme').value;
  
  if(user && user !== PROFILE.username){
    const { data: exist } = await supa.from('profiles').select('id').eq('username', user).single();
    if(exist){ toast('Esse nome de usuário já está em uso.', 'err'); return; }
  }

  const{error}=await supa.from('profiles').upsert({id:USER.id,full_name:name,bio,username:user,theme:theme,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error){toast('Erro: '+error.message,'err');return;}
  PROFILE={...PROFILE,full_name:name,bio,username:user,theme:theme};
  
  document.body.classList.remove('theme-light', 'theme-dark');
  if(theme === 'light') document.body.classList.add('theme-light');
  else if(theme === 'dark') document.body.classList.add('theme-dark');

  toast('Perfil atualizado! ✓','ok');
  renderPage();
}

async function changePassword(){
  const p1=document.getElementById('newPass').value;
  const p2=document.getElementById('newPass2').value;
  if(p1.length<8){toast('Senha muito curta (mín. 8 caracteres).','err');return;}
  if(p1!==p2){toast('As senhas não coincidem.','err');return;}
  const{error}=await supa.auth.updateUser({password:p1});
  if(error){toast('Erro: '+error.message,'err');return;}
  toast('Senha alterada com sucesso! ✓','ok');
}

async function deleteSub(id){
  if(!confirm('Excluir este envio? Ação irreversível.'))return;
  await supa.from('submissions').delete().eq('id',id);
  SUBS=SUBS.filter(s=>s.id!==id);
  toast('Envio excluído.');
  renderTab('submissions');
}

async function confirmDeleteAccount(){
  if(!confirm('Tem certeza? Todos os seus dados serão removidos permanentemente.'))return;
  if(!confirm('Esta ação é IRREVERSÍVEL. Confirmar?'))return;
  await supa.auth.admin?.deleteUser?.(USER.id);
  await doLogout();
}

async function doLogout(){
  await supa.auth.signOut();
  location.href='/';
}

function iniciarConversa(usuarioId, distancia) {
  const MAX_DIST_KM = 14;
  if (distancia > MAX_DIST_KM) {
    alert('Este membro está muito longe para conversar (máximo ' + MAX_DIST_KM + ' km).');
    return;
  }
  window.location.href = `sobral_chat.html?user=${usuarioId}`;
}

window.onload=init;
