const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);
const CAT_LABELS={todos:'Todos',religioso:'Religioso',cultura:'Cultura',historico:'Histórico',natureza:'Natureza',lazer:'Lazer'};
const REACTION_LABELS={like:'Gostei',been:'Eu Fui',going:'Eu Vou'};

let USER=null, PROFILE=null, SUBS=[], REACTIONS=[], SPOTS_MAP={}, currentTab='submissions';

function toggleDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.toggle('open'));}
function closeDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.remove('open'));}
function toast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type==='ok'?'ok':type==='err'?'err':'');setTimeout(()=>t.className='toast',3800);}

async function init(){
  const{data:{session}}=await supa.auth.getSession();
  if(!session){location.href='sobral_login.html?redirect=sobral_perfil.html';return;}
  USER=session.user;

  // load profile
  const[{data:prof},{data:subs},{data:reacts}]=await Promise.all([
    supa.from('profiles').select('*').eq('id',USER.id).single(),
    supa.from('submissions').select('*').eq('user_id',USER.id).order('created_at',{ascending:false}),
    supa.from('reactions').select('*').eq('user_id',USER.id).order('created_at',{ascending:false})
  ]);
  PROFILE=prof||{role:'user',full_name:USER.user_metadata?.full_name||''};
  SUBS=subs||[];
  REACTIONS=reacts||[];

  // busca nomes/emojis dos pontos referenciados pelas reactions
  const ids=[...new Set(REACTIONS.map(r=>r.spot_id).filter(Boolean))];
  if(ids.length){
    const{data:spots}=await supa.from('spots').select('id,name,emoji').in('id',ids);
    if(spots) spots.forEach(s=>{SPOTS_MAP[s.id]=s;});
  }

  renderPage();
}

function renderPage(){
  const avatarSrc=PROFILE.avatar_url||USER.user_metadata?.avatar_url||USER.user_metadata?.picture||'';
  const name=PROFILE.full_name||USER.user_metadata?.full_name||USER.email?.split('@')[0]||'Usuário';
  const isAdmin=PROFILE.role==='admin';
  const likeCount=REACTIONS.filter(r=>r.reaction==='like').length;
  const beenCount=REACTIONS.filter(r=>r.reaction==='been').length;
  const goingCount=REACTIONS.filter(r=>r.reaction==='going').length;

  document.getElementById('root').innerHTML=`
    <div class="profile-hero">
      <div class="profile-inner">
        <div class="avatar-wrap">
          ${avatarSrc
            ? `<div class="avatar"><img src="${avatarSrc}" alt="${name}"></div>`
            : `<div class="avatar-placeholder">${name.charAt(0).toUpperCase()}</div>`}
          <div class="role-badge ${isAdmin?'admin':''}">${isAdmin?'Admin':'Usuário'}</div>
        </div>
        <div class="profile-info">
          <div class="profile-name">${name}</div>
          <div class="profile-email">${USER.email}</div>
          <div class="profile-stats">
            <div class="pstat"><div class="pstat-num">${SUBS.length}</div><div class="pstat-lbl">Submissões</div></div>
            <div class="pstat"><div class="pstat-num">${likeCount}</div><div class="pstat-lbl">Gostei</div></div>
            <div class="pstat"><div class="pstat-num">${beenCount}</div><div class="pstat-lbl">Fui</div></div>
            <div class="pstat"><div class="pstat-num">${goingCount}</div><div class="pstat-lbl">Vou</div></div>
          </div>
        </div>
        <div style="padding-bottom:16px;flex-shrink:0">
          <button class="btn btn-secondary btn-sm" onclick="showTab('settings')" style="font-size:12px"><i data-lucide="settings" style="width:12px;height:12px;pointer-events:none"></i> Editar Perfil</button>
        </div>
      </div>
    </div>

    <div class="profile-tabs">
      <div class="profile-tabs-inner">
        <button class="ptab ${currentTab==='submissions'?'active':''}" onclick="showTab('submissions')"><i data-lucide="map-pin" style="width:14px;height:14px;pointer-events:none"></i> Minhas Submissões</button>
        <button class="ptab ${currentTab==='likes'?'active':''}" onclick="showTab('likes')"><i data-lucide="heart" style="width:14px;height:14px;pointer-events:none"></i> Gostei</button>
        <button class="ptab ${currentTab==='been'?'active':''}" onclick="showTab('been')"><i data-lucide="check-circle" style="width:14px;height:14px;pointer-events:none"></i> Eu Fui</button>
        <button class="ptab ${currentTab==='going'?'active':''}" onclick="showTab('going')"><i data-lucide="calendar" style="width:14px;height:14px;pointer-events:none"></i> Eu Vou</button>
        <button class="ptab ${currentTab==='settings'?'active':''}" onclick="showTab('settings')"><i data-lucide="settings" style="width:14px;height:14px;pointer-events:none"></i> Configurações</button>
      </div>
    </div>

    <div class="profile-content" id="tabContent"></div>`;

  renderTab(currentTab);
  lucide?.createIcons();
}

function showTab(tab){currentTab=tab;document.querySelectorAll('.ptab').forEach(b=>b.classList.toggle('active',b.textContent.includes(tab==='submissions'?'Submissões':tab==='likes'?'Gostei':tab==='been'?'Fui':tab==='going'?'Vou':'Configurações')));renderTab(tab);}

function renderTab(tab){
  const c=document.getElementById('tabContent');
  if(tab==='submissions') c.innerHTML=renderSubmissions();
  else if(tab==='likes') c.innerHTML=renderReactions('like');
  else if(tab==='been') c.innerHTML=renderReactions('been');
  else if(tab==='going') c.innerHTML=renderReactions('going');
  else if(tab==='settings') c.innerHTML=renderSettings();
  lucide?.createIcons();
}

function renderSubmissions(){
  if(!SUBS.length) return `<div class="empty"><div class="empty-icon"><i data-lucide="map-pin" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i></div><h3>Nenhuma submissão ainda</h3><p>Envie um ponto turístico ou evento para que ele apareça no mapa!</p><a href="sobral_submeter.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600"><i data-lucide="plus" style="width:14px;height:14px;pointer-events:none"></i> Submeter Ponto ou Evento</a></div>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><div style="font-size:14px;color:var(--muted)">${SUBS.length} submissão${SUBS.length!==1?'s':''}</div><a href="sobral_submeter.html" class="btn btn-primary btn-sm"><i data-lucide="plus" style="width:12px;height:12px;pointer-events:none"></i> Nova Submissão</a></div>
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
        ${s.status==='approved'?`<br><a href="sobral_post.html?id=${s.id}" style="color:var(--ochre);font-size:11px" target="_blank">Ver publicado →</a>`:''}
        </div>
        <div class="sub-actions">
          ${s.status!=='approved'?`<a href="sobral_submeter.html?edit=${s.id}" class="btn btn-sm btn-secondary"><i data-lucide="pencil" style="width:13px;height:13px;pointer-events:none"></i></a>`:''}
          <button class="btn btn-sm btn-danger" onclick="deleteSub('${s.id}')"><i data-lucide="trash-2" style="width:13px;height:13px;pointer-events:none"></i></button>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

function renderReactions(type){
  const items=REACTIONS.filter(r=>r.reaction===type);
  const label=REACTION_LABELS[type];
  if(!items.length) return `<div class="empty"><div class="empty-icon">${type==='like'?'<i data-lucide="heart" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i>':type==='been'?'<i data-lucide="check-circle" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i>':'<i data-lucide="calendar" style="width:40px;height:40px;stroke-width:1;opacity:.4"></i>'}</div><h3>Nenhum local aqui ainda</h3><p>Explore o mapa e marque lugares que você ${type==='like'?'gostou':type==='been'?'visitou':'quer visitar'}!</p><a href="index.html" style="display:inline-flex;align-items:center;gap:6px;background:var(--ochre);color:var(--deep);padding:10px 20px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600"><i data-lucide="map" style="width:14px;height:14px;pointer-events:none"></i> Explorar o Mapa</a></div>`;
  return `<div style="font-size:14px;color:var(--muted);margin-bottom:18px">${items.length} lugar${items.length!==1?'es':''} marcado${items.length!==1?'s':''} como "${label}"</div>
  <div style="display:flex;flex-direction:column;gap:10px">${items.map(r=>`
    <a href="sobral_post.html?id=${r.spot_id}" class="reaction-card">
      <div class="rc-emoji" style="background:rgba(200,135,26,.1)"><i data-lucide="${type==='like'?'heart':type==='been'?'check-circle':'calendar'}" style="width:22px;height:22px;stroke-width:1.5;opacity:.7"></i></div>
      <div class="rc-info"><div class="rc-name">${SPOTS_MAP[r.spot_id]?.name||'Ponto Turístico'}</div><div class="rc-meta">${new Date(r.created_at).toLocaleDateString('pt-BR')}</div></div>
      <div class="rc-type">${label}</div>
    </a>`).join('')}</div>`;
}

function renderSettings(){
  const name=PROFILE.full_name||USER.user_metadata?.full_name||'';
  const bio=PROFILE.bio||'';
  return `<div class="edit-form">
    <h3 style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border)"><i data-lucide="settings" style="width:16px;height:16px"></i> Editar Perfil</h3>
    <div class="fg"><label>Nome Completo</label><input id="sName" value="${name}" placeholder="Seu nome"></div>
    <div class="fg"><label>Bio / Descrição</label><textarea id="sBio" rows="3" placeholder="Conte um pouco sobre você…">${bio}</textarea></div>
    <div class="fg"><label>E-mail (não editável)</label><input value="${USER.email}" disabled style="opacity:.5"></div>
    <div style="display:flex;gap:10px;margin-top:4px">
      <button class="btn btn-primary" onclick="saveProfile()"><i data-lucide="save" style="width:14px;height:14px;pointer-events:none"></i> Salvar Alterações</button>
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:24px 0">
    <h3 style="font-family:'Playfair Display',serif;font-size:16px;margin-bottom:14px"><i data-lucide="lock" style="width:15px;height:15px"></i> Alterar Senha</h3>
    <div class="fg"><label>Nova Senha</label><input id="newPass" type="password" placeholder="Mínimo 8 caracteres"></div>
    <div class="fg"><label>Confirmar Nova Senha</label><input id="newPass2" type="password" placeholder="Repita a senha"></div>
    <button class="btn btn-secondary" onclick="changePassword()"><i data-lucide="key" style="width:14px;height:14px;pointer-events:none"></i> Alterar Senha</button>
    <hr style="border:none;border-top:1px solid var(--border);margin:24px 0">
    <h3 style="font-family:'Playfair Display',serif;font-size:15px;color:#e89e7e;margin-bottom:12px"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Zona de Perigo</h3>
    <button class="btn btn-danger" onclick="confirmDeleteAccount()"><i data-lucide="trash-2" style="width:14px;height:14px;pointer-events:none"></i> Excluir minha conta</button>
  </div>`;
}

async function saveProfile(){
  const name=document.getElementById('sName').value.trim();
  const bio=document.getElementById('sBio').value.trim();
  const{error}=await supa.from('profiles').upsert({id:USER.id,full_name:name,bio,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error){toast('Erro: '+error.message,'err');return;}
  PROFILE={...PROFILE,full_name:name,bio};
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
  if(!confirm('Excluir esta submissão? Ação irreversível.'))return;
  await supa.from('submissions').delete().eq('id',id);
  SUBS=SUBS.filter(s=>s.id!==id);
  toast('Submissão excluída.','');
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