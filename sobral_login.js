const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);

// redirect destination from URL param
const redirect = new URLSearchParams(location.search).get('redirect') || '/';

// Detecta fluxo de recuperação de senha via onAuthStateChange
// (Supabase v2 processa o hash automaticamente e dispara PASSWORD_RECOVERY)
supa.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    showReset();
  } else if (event === 'SIGNED_IN' && !document.getElementById('formReset').style.display !== 'none') {
    // login normal já autenticado — redireciona
  }
});

// Só redireciona automaticamente se NÃO for um link de recovery
supa.auth.getSession().then(({data}) => {
  if (data?.session && !location.hash.includes('type=recovery')) {
    location.href = redirect;
  }
});

/* ── TABS ── */
function showTab(tab){
  document.getElementById('tabLogin').classList.toggle('active',tab==='login');
  document.getElementById('tabRegister').classList.toggle('active',tab==='register');
  document.getElementById('formLogin').style.display=tab==='login'?'block':'none';
  document.getElementById('formRegister').style.display=tab==='register'?'block':'none';
  document.getElementById('formForgot').style.display='none';
  document.getElementById('formReset').style.display='none';
  clearMsg();
}
function showForgot(){
  document.getElementById('formLogin').style.display='none';
  document.getElementById('formForgot').style.display='block';
  ['tabLogin','tabRegister'].forEach(t=>document.getElementById(t).classList.remove('active'));
  clearMsg();
}
function showReset(){
  ['formLogin','formRegister','formForgot'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('formReset').style.display='block';
  ['tabLogin','tabRegister'].forEach(t=>document.getElementById(t).classList.remove('active'));
  document.querySelector('.logo-sub').textContent='Redefina sua senha';
  clearMsg();
}

/* ── MENSAGENS / LOADING ── */
function showMsg(txt,type='error'){const m=document.getElementById('msgBox');m.textContent=txt;m.className='msg '+type;}
function clearMsg(){const m=document.getElementById('msgBox');m.className='msg';m.textContent='';}
function setLoading(btnId,label,loading){
  const b=document.getElementById(btnId);
  if(loading){b.disabled=true;b.innerHTML='<span class="loader"></span>Aguarde…';}
  else{b.disabled=false;b.textContent=label;}
}

/* ── UTILITÁRIOS ── */
function togglePwd(id,btn){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';btn.innerHTML=i.type==='text'?'<i data-lucide="eye" style="width:16px;height:16px;pointer-events:none"></i>':'<i data-lucide="eye-off" style="width:16px;height:16px;pointer-events:none"></i>';window.lucide?.createIcons();}

function checkStrength(pwd){
  const bar=document.getElementById('strengthBar');
  if(!bar)return;
  let score=0;
  if(pwd.length>=8)score++;if(pwd.length>=12)score++;
  if(/[A-Z]/.test(pwd))score++;if(/[0-9]/.test(pwd))score++;if(/[^A-Za-z0-9]/.test(pwd))score++;
  const pct=[0,20,40,65,85,100][score];
  const col=['#666','#e53','#f90','#fa0','#4a4','#2d2'][score];
  bar.style.width=pct+'%';bar.style.background=col;
}

/* ── LOGIN ── */
async function doLogin(){
  const email=document.getElementById('lEmail').value.trim();
  const pass=document.getElementById('lPass').value;
  if(!email||!pass){showMsg('Preencha e-mail e senha.');return;}
  setLoading('btnLogin','Entrar',true);
  const{error}=await supa.auth.signInWithPassword({email,password:pass});
  setLoading('btnLogin','Entrar',false);
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Login realizado! Redirecionando…','success');
  setTimeout(()=>location.href=redirect,800);
}

/* ── CADASTRO ── */
async function doRegister(){
  const name=document.getElementById('rName').value.trim();
  const email=document.getElementById('rEmail').value.trim();
  const pass=document.getElementById('rPass').value;
  const pass2=document.getElementById('rPass2').value;
  const terms=document.getElementById('termsCk').checked;
  if(!name){showMsg('Informe seu nome.');return;}
  if(!email||!/\S+@\S+\.\S+/.test(email)){showMsg('E-mail inválido.');return;}
  if(pass.length<8){showMsg('Senha deve ter ao menos 8 caracteres.');return;}
  if(pass!==pass2){showMsg('As senhas não coincidem.');return;}
  if(!terms){showMsg('Você precisa aceitar os Termos de Uso.');return;}
  setLoading('btnRegister','Criar Conta Gratuita',true);
  const{error}=await supa.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
  setLoading('btnRegister','Criar Conta Gratuita',false);
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro.','success');
}

/* ── GOOGLE ── */
async function doGoogle(){
  const redirectUrl = redirect === 'index.html' ? location.origin + '/' : location.origin + '/' + redirect;
  const{error}=await supa.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl}});
  if(error)showMsg('Erro Google: '+error.message);
}

/* ── ESQUECI A SENHA ── */
async function doForgot(){
  const email=document.getElementById('fEmail').value.trim();
  if(!email){showMsg('Informe seu e-mail.');return;}
  const{error}=await supa.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/sobral_login.html'});
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Link enviado! Verifique sua caixa de entrada.','success');
}

/* ── REDEFINIR SENHA ── */
async function doReset(){
  const pass=document.getElementById('nPass').value;
  const pass2=document.getElementById('nPass2').value;
  if(pass.length<8){showMsg('A senha deve ter ao menos 8 caracteres.');return;}
  if(pass!==pass2){showMsg('As senhas não coincidem.');return;}
  setLoading('btnReset','Salvar Nova Senha',true);
  const{error}=await supa.auth.updateUser({password:pass});
  setLoading('btnReset','Salvar Nova Senha',false);
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Senha redefinida com sucesso! Redirecionando…','success');
  setTimeout(()=>location.href='/',2000);
}

/* ── PRIVACIDADE ── */
function showPrivacy(){alert('Política de Privacidade\n\nSeus dados (nome e e-mail) são utilizados exclusivamente para identificação na plataforma. Não compartilhamos dados com terceiros.');}

/* ── ENTER KEY ── */
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const active=document.querySelector('.tab.active');
    if(active?.id==='tabLogin')doLogin();
    else if(active?.id==='tabRegister')doRegister();
  }
});