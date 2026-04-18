const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);

// redirect destination from URL param
const redirect = new URLSearchParams(location.search).get('redirect') || '/';

// Check if already logged in
supa.auth.getSession().then(({data})=>{
  if(data?.session) location.href=redirect;
});

function showTab(tab){
  document.getElementById('tabLogin').classList.toggle('active',tab==='login');
  document.getElementById('tabRegister').classList.toggle('active',tab==='register');
  document.getElementById('formLogin').style.display=tab==='login'?'block':'none';
  document.getElementById('formRegister').style.display=tab==='register'?'block':'none';
  document.getElementById('formForgot').style.display='none';
  clearMsg();
}
function showForgot(){
  document.getElementById('formLogin').style.display='none';
  document.getElementById('formForgot').style.display='block';
  ['tabLogin','tabRegister'].forEach(t=>document.getElementById(t).classList.remove('active'));
  clearMsg();
}
function showMsg(txt,type='error'){const m=document.getElementById('msgBox');m.textContent=txt;m.className='msg '+type;}
function clearMsg(){const m=document.getElementById('msgBox');m.className='msg';m.textContent='';}
function setLoading(btnId,loading){const b=document.getElementById(btnId);if(loading){b.disabled=true;b.innerHTML='<span class="loader"></span>Aguarde…';}else{b.disabled=false;b.textContent=b.id==='btnLogin'?'Entrar':'Criar Conta Gratuita';}}

function togglePwd(id,btn){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';btn.textContent=i.type==='password'?'👁️':'🙈';}

function checkStrength(pwd){
  const bar=document.getElementById('strengthBar');
  let score=0;
  if(pwd.length>=8)score++;if(pwd.length>=12)score++;
  if(/[A-Z]/.test(pwd))score++;if(/[0-9]/.test(pwd))score++;if(/[^A-Za-z0-9]/.test(pwd))score++;
  const pct=[0,20,40,65,85,100][score];
  const col=['#666','#e53','#f90','#fa0','#4a4','#2d2'][score];
  bar.style.width=pct+'%';bar.style.background=col;
}

async function doLogin(){
  const email=document.getElementById('lEmail').value.trim();
  const pass=document.getElementById('lPass').value;
  if(!email||!pass){showMsg('Preencha e-mail e senha.');return;}
  setLoading('btnLogin',true);
  const{error}=await supa.auth.signInWithPassword({email,password:pass});
  setLoading('btnLogin',false);
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Login realizado! Redirecionando…','success');
  setTimeout(()=>location.href=redirect,800);
}

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
  setLoading('btnRegister',true);
  const{error}=await supa.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
  setLoading('btnRegister',false);
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro. ✉️','success');
}

async function doGoogle(){
  const redirectUrl = redirect === 'index.html' ? location.origin + '/' : location.origin + '/' + redirect;
  const{error}=await supa.auth.signInWithOAuth({provider:'google',options:{redirectTo: redirectUrl}});
  if(error)showMsg('Erro Google: '+error.message);
}

async function doFacebook(){
  const{error}=await supa.auth.signInWithOAuth({provider:'facebook',options:{redirectTo: redirectUrl}});
  if(error)showMsg('Erro Facebook: '+error.message);
}

async function doForgot(){
  const email=document.getElementById('fEmail').value.trim();
  if(!email){showMsg('Informe seu e-mail.');return;}
  const{error}=await supa.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/sobral_reset_senha.html'});
  if(error){showMsg('Erro: '+error.message);return;}
  showMsg('Link enviado! Verifique sua caixa de entrada. ✉️','success');
}

function showPrivacy(){alert('Política de Privacidade\n\nSeus dados (nome e e-mail) são utilizados exclusivamente para identificação na plataforma. Não compartilhamos dados com terceiros.');}

// Enter key
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const active=document.querySelector('.tab.active');if(active?.id==='tabLogin')doLogin();else if(active?.id==='tabRegister')doRegister();}});