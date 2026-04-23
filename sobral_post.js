const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);
const CL={todos:'Todos',religioso:'Religioso',cultura:'Cultura',historico:'Histórico',natureza:'Natureza',lazer:'Lazer'};
const CC={religioso:'#6440B4',cultura:'#1B6B6B',historico:'#B54A2A',natureza:'#3C7828',lazer:'#C8871A'};
const CAT_ICON = {
  religioso: 'church',
  cultura:   'landmark',
  historico: 'castle',
  natureza:  'trees',
  lazer:     'ferris-wheel',
  eventos:   'calendar-days',
  event:     'calendar-days',
};
const GEO_LAST_KEY='sc_geo_last_position';

window.addEventListener('scroll',()=>{const d=document.documentElement;document.getElementById('pgf').style.width=(d.scrollTop/(d.scrollHeight-d.clientHeight)*100)+'%';});
function toggleDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.toggle('open'));}
function closeDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.remove('open'));}

async function renderPage(){
  const id=new URLSearchParams(location.search).get('id');
  if(!id){renderNF();return;}
  const{data:rows}=await supa.from('spots').select('*').eq('id',id).limit(1);
  if(!rows||!rows.length){renderNF();return;}
  const r=rows[0];
  const s={id:r.id,name:r.name,cat:r.cat,emoji:r.emoji,color:r.color,lat:r.lat,lng:r.lng,desc:r.description,address:r.address,horario:r.horario,entrada:r.entrada,photo:r.photo,blogTitle:r.blog_title,blogContent:r.blog_content,blogAuthor:r.blog_author,blogDate:r.blog_date};
  const{data:rel}=await supa.from('spots').select('id,name,cat,color').eq('cat',s.cat).neq('id',id).limit(3);
  document.title=`${s.name} — Sobral Cultural`;
  const cc=s.color||CC[s.cat]||'#C8871A',cl=CL[s.cat]||s.cat;
  const ds=s.blogDate?new Date(s.blogDate+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):'';
  document.getElementById('root').innerHTML=`
    <div class="hero">
      ${s.photo?`<img src="${s.photo}" alt="${s.name}">`:`<div class="hero-ph">${s.emoji}</div>`}
      <div class="hero-ov"></div>
      <div class="hero-cnt">
        <h1 class="hero-title">${s.blogTitle||s.name}</h1>
        <a class="hero-cat" href="index.html?cat=${encodeURIComponent(s.cat||'todos')}" style="background:${cc}33;color:${cc};border:1px solid ${cc}66;text-decoration:none">${cl}</a>
        <div class="hero-meta">
          <span><i data-lucide="pencil" style="width:13px;height:13px"></i> ${s.blogAuthor||'Equipe Sobral Cultural'}</span>
          ${ds?`<span><i data-lucide="calendar" style="width:13px;height:13px"></i> ${ds}</span>`:''}
          <span><i data-lucide="map-pin" style="width:13px;height:13px"></i> ${s.address||'Sobral, CE'}</span>
        </div>
      </div>
    </div>
    <div class="layout">
      <article class="article">
        <div class="article-body">${s.blogContent||`<p>${s.desc||''}</p>`}</div>

        <!-- REACTIONS -->
        <div style="margin-top:28px;padding:20px;background:var(--panel);border:1px solid var(--border);border-radius:14px">
          <div style="font-size:13.5px;font-weight:600;color:var(--cream);margin-bottom:12px">O que você achou deste lugar?</div>
          <div id="rxnArea" style="display:flex;flex-direction:column;gap:12px">
            <div style="font-size:13px;color:var(--muted)">Carregando…</div>
          </div>
        </div>
      </article>
      <div class="sbc">
        <div class="ic">
          <div class="ic-hd"><span style="font-size:18px">${s.emoji}</span><h3>Informações Práticas</h3></div>
          <div class="ic-body">
            ${s.address?`<div class="ir"><div class="ir-ico"><i data-lucide="map-pin" class="icon-sm"></i></div><div><div class="ir-lbl">Endereço</div><div class="ir-val">${s.address}</div></div></div>`:''}
            ${s.horario?`<div class="ir"><div class="ir-ico"><i data-lucide="clock" class="icon-sm"></i></div><div><div class="ir-lbl">Horário</div><div class="ir-val">${s.horario}</div></div></div>`:''}
            ${s.entrada?`<div class="ir"><div class="ir-ico"><i data-lucide="ticket" class="icon-sm"></i></div><div><div class="ir-lbl">Entrada</div><div class="ir-val">${s.entrada}</div></div></div>`:''}
            <div class="ir"><div class="ir-ico"><i data-lucide="layers" class="icon-sm"></i></div><div><div class="ir-lbl">Categoria</div><div class="ir-val">${cl}</div></div></div>
          </div>
        </div>
        ${s.lat&&s.lng?`<div class="mc"><div class="mc-hd"><h3><i data-lucide="map-pin" class="icon-sm"></i> Localização</h3></div><div id="miniMap"></div><div class="loc-tools"><div class="loc-links"><a id="locGoogleMaps" class="loc-link" target="_blank" rel="noopener noreferrer"><i data-lucide="map" class="icon-sm"></i>Google Maps</a><a id="locUber" class="loc-link" target="_blank" rel="noopener noreferrer"><i data-lucide="car-taxi-front" class="icon-sm"></i>Uber</a><a id="locWaze" class="loc-link" target="_blank" rel="noopener noreferrer"><i data-lucide="navigation" class="icon-sm"></i>Waze</a></div><div id="locRouteInfo" class="loc-route-info"><i data-lucide="route" class="icon-xs"></i> Calculando rota...</div></div></div>`:''}
        ${rel&&rel.length?`<div class="rc"><h3>Veja Também</h3>${rel.map(x=>`<a href="sobral_post.html?id=${x.id}" class="ri"><div class="ri-em" style="background:${x.color||'#1B6B6B'}22;color:${x.color||'#1B6B6B'}"><i data-lucide="${CAT_ICON[x.cat]||'map-pin'}"></i></div><div><div class="ri-name">${x.name}</div><div class="ri-cat">${CL[x.cat]||x.cat}</div></div></a>`).join('')}</div>`:'' }
      </div>
    </div>`;
  if(s.lat&&s.lng){setTimeout(()=>initPostLocation(s,cc),200);}
  lucide?.createIcons();
  // load reactions
  initReactions(s.id);
}
function renderNF(){document.getElementById('root').innerHTML=`<div class="nf"><div style="margin-bottom:16px"><i data-lucide="map" style="width:60px;height:60px;stroke-width:1;opacity:.5"></i></div><h2>Ponto não encontrado</h2><p>Este ponto turístico não existe ou foi removido.</p><a href="index.html" class="btn-nf">← Voltar ao Mapa</a></div>`;lucide?.createIcons();}
function sharePost(){if(navigator.share)navigator.share({title:document.title,url:location.href}).catch(()=>copyLink());else copyLink();}
function copyLink(){navigator.clipboard?.writeText(location.href).then(()=>alert('Link copiado! ✓'));}

function fd(m){return m<1000?`${Math.round(m)}m`:`${(m/1e3).toFixed(1)}km`;}
function fmtDuration(seconds){const min=Math.round(seconds/60);if(min<60)return`${min} min`;const h=Math.floor(min/60),mm=min%60;return mm?`${h}h ${mm}min`:`${h}h`;}

async function fetchOsrmRoute(origin,destination,profile){
  const src=`${origin.lng},${origin.lat}`,dst=`${destination.lng},${destination.lat}`;
  const q=new URLSearchParams({overview:'full',geometries:'geojson',alternatives:'false',steps:'false'});
  const res=await fetch(`https://router.project-osrm.org/route/v1/${profile}/${src};${dst}?${q.toString()}`);
  if(!res.ok) throw new Error(`OSRM ${profile} ${res.status}`);
  const json=await res.json();
  if(!json?.routes?.length) return null;
  const r=json.routes[0];
  return{distance:r.distance,duration:r.duration,geometry:r.geometry};
}

function getSavedOrLivePosition(){
  const saved=localStorage.getItem(GEO_LAST_KEY);
  if(saved){
    try{const p=JSON.parse(saved);if(Number.isFinite(p.lat)&&Number.isFinite(p.lng))return Promise.resolve({lat:p.lat,lng:p.lng});}catch(_){}
  }
  if(!navigator.geolocation) return Promise.resolve(null);
  return new Promise(resolve=>{
    navigator.geolocation.getCurrentPosition(
      p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),
      ()=>resolve(null),
      {enableHighAccuracy:true,timeout:8000,maximumAge:15000}
    );
  });
}

function buildGoogleMapsUrl(dest,origin){
  const p=new URLSearchParams({api:'1',destination:`${dest.lat},${dest.lng}`,travelmode:'driving'});
  if(origin) p.set('origin',`${origin.lat},${origin.lng}`);
  return`https://www.google.com/maps/dir/?${p.toString()}`;
}
function buildUberUrl(dest,name,origin){
  const p=new URLSearchParams({action:'setPickup','dropoff[latitude]':String(dest.lat),'dropoff[longitude]':String(dest.lng),'dropoff[nickname]':name||'Destino'});
  if(origin){p.set('pickup[latitude]',String(origin.lat));p.set('pickup[longitude]',String(origin.lng));p.set('pickup[my_location]','false');}
  else p.set('pickup','my_location');
  return`https://m.uber.com/ul/?${p.toString()}`;
}
function buildWazeUrl(dest){return`https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;}

async function initPostLocation(s,cc){
  const mm=L.map('miniMap',{center:[s.lat,s.lng],zoom:15,zoomControl:false,dragging:false,scrollWheelZoom:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CARTO',subdomains:'abcd',maxZoom:19}).addTo(mm);
  const ico=L.divIcon({html:`<div style="width:34px;height:34px;background:${cc};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.4);box-shadow:0 4px 12px rgba(0,0,0,.4)"><span style="transform:rotate(45deg);font-size:15px">${s.emoji}</span></div>`,className:'',iconSize:[34,34],iconAnchor:[17,34]});
  L.marker([s.lat,s.lng],{icon:ico}).addTo(mm);

  const origin=await getSavedOrLivePosition();
  document.getElementById('locGoogleMaps').href=buildGoogleMapsUrl({lat:s.lat,lng:s.lng},origin);
  document.getElementById('locUber').href=buildUberUrl({lat:s.lat,lng:s.lng},s.name,origin);
  document.getElementById('locWaze').href=buildWazeUrl({lat:s.lat,lng:s.lng});

  const infoEl=document.getElementById('locRouteInfo');
  if(!origin||!infoEl){
    if(infoEl) infoEl.innerHTML='<i data-lucide="navigation" class="icon-xs"></i> Ative sua localização para ver tempo de rota';
    lucide?.createIcons();
    return;
  }
  const userMk=L.marker([origin.lat,origin.lng],{icon:L.divIcon({html:'<div class="post-user-dot"></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(mm);
  userMk.bindPopup('<div class="pp-title">Você está aqui</div>');

  const [walkRes,driveRes]=await Promise.allSettled([
    fetchOsrmRoute(origin,{lat:s.lat,lng:s.lng},'foot'),
    fetchOsrmRoute(origin,{lat:s.lat,lng:s.lng},'driving')
  ]);
  const walk=walkRes.status==='fulfilled'?walkRes.value:null;
  const drive=driveRes.status==='fulfilled'?driveRes.value:null;
  if(!walk&&!drive){
    infoEl.innerHTML='<i data-lucide="route-off" class="icon-xs"></i> Rota indisponível no momento';
    lucide?.createIcons();
    return;
  }
  const pick=drive||walk;
  const latlngs=pick.geometry.coordinates.map(([lng,lat])=>[lat,lng]);
  L.polyline(latlngs,{color:'#C8871A',weight:4,opacity:.9,dashArray:drive?null:'6 6'}).addTo(mm);
  mm.fitBounds(L.latLngBounds([[origin.lat,origin.lng],[s.lat,s.lng]]).pad(.2));
  const walkTxt=walk?`a pé ${fmtDuration(walk.duration)}`:null;
  const driveTxt=drive?`carro ${fmtDuration(drive.duration)}`:null;
  infoEl.innerHTML=`<i data-lucide="route" class="icon-xs"></i> <strong>${[walkTxt,driveTxt].filter(Boolean).join(' · ')}</strong> <em>(${fd((drive||walk).distance)})</em>`;
  lucide?.createIcons();
}

// ── AUTH + REACTIONS ──────────────────────
let CUR_USER = null, CUR_REACTIONS = [], CURRENT_SPOT_ID = null;

async function initReactions(spotId) {
  CURRENT_SPOT_ID = spotId;
  const { data: { session } } = await supa.auth.getSession();
  CUR_USER = session?.user || null;
  if (CUR_USER) {
    const { data } = await supa.from('reactions').select('*').eq('user_id', CUR_USER.id).eq('spot_id', String(spotId));
    CUR_REACTIONS = data || [];
  }
  await renderReactions(spotId);
}

async function renderReactions(spotId) {
  const el = document.getElementById('rxnArea');
  if (!el) return;
  const { data: counts } = await supa.from('reactions').select('reaction').eq('spot_id', String(spotId));
  const likeCount  = (counts||[]).filter(r=>r.reaction==='like').length;
  const beenCount  = (counts||[]).filter(r=>r.reaction==='been').length;
  const goingCount = (counts||[]).filter(r=>r.reaction==='going').length;

  const myLike  = CUR_USER && CUR_REACTIONS.find(r=>r.reaction==='like');
  const myBeen  = CUR_USER && CUR_REACTIONS.find(r=>r.reaction==='been');
  const myGoing = CUR_USER && CUR_REACTIONS.find(r=>r.reaction==='going');

  const btnStyle = (active, color) => `display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;font-size:13.5px;font-weight:500;cursor:pointer;border:1.5px solid;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif;${active ? `background:${color}22;border-color:${color}88;color:${color}` : 'background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:var(--cream)'}`;

  if (!CUR_USER) {
    el.innerHTML = `<div style="text-align:center;padding:8px 0">
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px">Entre para curtir e marcar que você foi ou quer visitar!</div>
      <a href="sobral_login.html?redirect=${encodeURIComponent(location.href)}" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13.5px;font-weight:600"><i data-lucide="user" style="width:14px;height:14px;pointer-events:none"></i> Entrar ou Criar Conta</a>
    </div>`;
    lucide?.createIcons();
    return;
  }

  el.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap">
    <button style="${btnStyle(myLike,'#e05050')}" onclick="toggleR('like')"><i data-lucide="heart" style="width:15px;height:15px;pointer-events:none"></i> Gostei${likeCount>0?` <span style="opacity:.6;font-size:11px">${likeCount}</span>`:''}</button>
    <button style="${btnStyle(myBeen,'#4a9a3a')}" onclick="toggleR('been')"><i data-lucide="check-circle" style="width:15px;height:15px;pointer-events:none"></i> Eu Fui${beenCount>0?` <span style="opacity:.6;font-size:11px">${beenCount}</span>`:''}</button>
    <button style="${btnStyle(myGoing,'#C8871A')}" onclick="toggleR('going')"><i data-lucide="calendar" style="width:15px;height:15px;pointer-events:none"></i> Eu Vou${goingCount>0?` <span style="opacity:.6;font-size:11px">${goingCount}</span>`:''}</button>
  </div>
  <div style="font-size:11.5px;color:var(--muted)">
    ${likeCount} curtiu · ${beenCount} já foi · ${goingCount} quer ir
  </div>`;
  lucide?.createIcons();
}

async function toggleR(reaction) {
  if (!CUR_USER || !CURRENT_SPOT_ID) return;
  const existing = CUR_REACTIONS.find(r=>r.reaction===reaction);
  if (existing) {
    await supa.from('reactions').delete().eq('id', existing.id);
    CUR_REACTIONS = CUR_REACTIONS.filter(r=>r.id!==existing.id);
  } else {
    const { data } = await supa.from('reactions').insert({ user_id:CUR_USER.id, spot_id:String(CURRENT_SPOT_ID), reaction, spot_type:'spot' }).select().single();
    if (data) CUR_REACTIONS.push(data);
  }
  renderReactions(CURRENT_SPOT_ID);
}

window.onload = renderPage;