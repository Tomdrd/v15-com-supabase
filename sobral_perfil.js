const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);
const CAT_LABELS={todos:'Todos',religioso:'Religioso',cultura:'Cultura',historico:'Histórico',natureza:'Natureza',lazer:'Lazer'};
const REACTION_LABELS={like:'Gostei',been:'Eu Fui',going:'Eu Vou'};
const CAT_COLORS={religioso:'#9B8EC4',cultura:'#C8871A',historico:'#7B9E6B',natureza:'#4CAF82',lazer:'#E07B54'};

let USER=null,PROFILE=null,SUBS=[],REACTIONS=[],SPOTS_MAP={};
let currentTab='mymap';
let currentFavFilter='all';
let isMyProfile = false;
let profileMap=null;

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
    body.theme-dark .profile-hero { background: var(--mid); border-bottom: 1px solid var(--border); }
    body.theme-dark .sub-card, body.theme-dark .reaction-card, body.theme-dark .empty, body.theme-dark .edit-form { background: var(--mid); border: 1px solid var(--border); border-radius: 12px; }
    body.theme-dark input, body.theme-dark textarea, body.theme-dark select { background: var(--input-bg); border: 1px solid var(--border); color: var(--cream); }
    body.theme-dark input:focus, body.theme-dark textarea:focus, body.theme-dark select:focus { border-color: var(--ochre); }
    body.theme-dark .fav-pill { border-color: var(--border); color: var(--muted); }
    body.theme-dark .fav-pill:hover { border-color: var(--muted); color: var(--cream); }
    body.theme-dark .fav-pill.active { border-color: var(--ochre); color: var(--ochre); background: rgba(200,135,26,.12); }
    body.theme-dark .route-item { border-bottom: 1px solid var(--border); }
    body.theme-dark .route-num { background: var(--deep); border-color: var(--border); color: var(--cream); }
    body.theme-dark hr { border-top-color: var(--border) !important; }

    /* MODO CLARO (Light Mode Elegante) */
    body.theme-light {
      --deep: #f4f4f5;
      --mid: #ffffff;
      --cream: #18181b;
      --muted: #71717a;
      --border: #e4e4e7;
      --input-bg: #f4f4f5;
      background-color: var(--deep);
      color: var(--cream);
    }
    body.theme-light .profile-hero { background: var(--mid); border-bottom: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    body.theme-light .ptab { color: var(--muted); }
    body.theme-light .ptab.active { color: var(--ochre); font-weight: 600; }
    body.theme-light .ptab:hover { background: rgba(0,0,0,0.03); }
    body.theme-light .pstat-btn:hover { background: rgba(0,0,0,0.04); }
    body.theme-light .sub-card, body.theme-light .reaction-card, body.theme-light .empty, body.theme-light .edit-form { background: var(--mid); border: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-radius: 12px; }
    body.theme-light input, body.theme-light textarea, body.theme-light select { background: var(--input-bg); border: 1px solid var(--border); color: var(--cream); }
    body.theme-light input:focus, body.theme-light textarea:focus, body.theme-light select:focus { background: var(--mid); border-color: var(--ochre); box-shadow: 0 0 0 3px rgba(200,135,26,0.1); }
    body.theme-light .fav-pill { border-color: var(--border); color: var(--muted); background: var(--mid); }
    body.theme-light .fav-pill:hover { border-color: #a1a1aa; color: var(--cream); }
    body.theme-light .fav-pill.active { border-color: var(--ochre); color: var(--ochre); background: rgba(200,135,26,0.08); }
    body.theme-light .route-item { border-bottom: 1px solid var(--border); }
    body.theme-light .route-item:hover { background: rgba(0,0,0,0.02); }
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
  const profileUser = urlParams.get('username');

  let targetUserId = null;
  if (profileUser) {
    const { data: u } = await supa.from('profiles').select('id').eq('username', profileUser).single();
    if (u) targetUserId = u.id;
    else { document.getElementById('root').innerHTML=`<div class="empty" style="margin-top:100px;text-align:center"><h3>Perfil não encontrado</h3><a href="index.html" class="btn btn-primary" style="margin-top:14px">Voltar ao mapa</a></div>`; return; }
  } else if (profileId) {
    targetUserId = profileId;
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
  renderPage();
}

function renderPage(){
  const avatarSrc=PROFILE.avatar_url||USER?.user_metadata?.avatar_url||USER?.user_metadata?.picture||'';
  const name=PROFILE.full_name||'Usuário';
  const isAdmin=PROFILE.role==='admin';
  const likeCount=REACTIONS.filter(r=>r.reaction==='like').length;
  const beenCount=REACTIONS.filter(r=>r.reaction==='been').length;
  const goingCount=REACTIONS.filter(r=>r.reaction==='going').length;

  document.getElementById('root').innerHTML=`
    <div class="profile-hero">
      <div class="profile-inner">
        <div class="avatar-wrap">
          ${avatarSrc?`<div class="avatar"><img src="${avatarSrc}" alt="${name}"></div>`:`<div class="avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`}
          <div class="role-badge ${isAdmin?'admin':''}">${isAdmin?'Admin':(PROFILE.role || 'Usuário')}</div>
        </div>
        <div class="profile-info">
          <div class="profile-name">${name}</div>
          ${PROFILE.bio ? `<div class="profile-bio">${PROFILE.bio}</div>` : ''}
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
        ` : ''}
      </div>
    </div>

    <div class="profile-tabs">
      <div class="profile-tabs-inner">
        <button class="ptab" data-tab="mymap"       onclick="showTab('mymap')"><i data-lucide="map"      style="width:14px;height:14px;pointer-events:none"></i> Meu Mapa</button>
        <button class="ptab" data-tab="favorites"   onclick="showTab('favorites')"><i data-lucide="heart"    style="width:14px;height:14px;pointer-events:none"></i> Reações</button>
        <button class="ptab" data-tab="submissions" onclick="showTab('submissions')"><i data-lucide="map-pin" style="width:14px;height:14px;pointer-events:none"></i> Envios</button>
        ${isMyProfile ? `<button class="ptab" data-tab="settings"    onclick="showTab('settings')"><i data-lucide="settings" style="width:14px;height:14px;pointer-events:none"></i> Configurações</button>` : ''}
      </div>
    </div>

    <div class="profile-content" id="tabContent"></div>`;

  setActiveTab(currentTab);
  renderTab(currentTab);
  window.lucide?.createIcons();
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
  else if(tab==='submissions') html=renderSubmissions();
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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CARTO',maxZoom:19,subdomains:'abcd'}).addTo(profileMap);
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

window.onload=init;
