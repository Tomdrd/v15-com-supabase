const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);

function toggleDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.toggle('open'));}
function closeDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.remove('open'));}

async function sendContact(){
  const name=document.getElementById('cName').value.trim();
  const email=document.getElementById('cEmail').value.trim();
  const phone=document.getElementById('cPhone').value.trim();
  const subject=document.getElementById('cSubject').value;
  const message=document.getElementById('cMsg').value.trim();
  const errEl=document.getElementById('formErr');

  // Validações
  errEl.style.display='none';
  if(!name){showErr('Preencha seu nome.');return;}
  if(!email||!/\S+@\S+\.\S+/.test(email)){showErr('Informe um e-mail válido.');return;}
  if(!message||message.length<20){showErr('Mensagem muito curta (mínimo 20 caracteres).');return;}

  const btn=document.getElementById('btnSubmit'),txt=document.getElementById('btnTxt');
  btn.disabled=true;txt.textContent='⏳ Enviando…';

  const{error}=await supa.from('contacts').insert({name,email,phone,subject,message});
  if(error){
    btn.disabled=false;txt.innerHTML='<i data-lucide="send" style="width:14px;height:14px;pointer-events:none"></i> Enviar Mensagem';window.lucide?.createIcons();
    showErr('Erro ao enviar: '+error.message);return;
  }
  document.getElementById('formCard').style.display='none';
  document.getElementById('successCard').classList.add('show');
}
function showErr(msg){const e=document.getElementById('formErr');e.textContent=msg;e.style.display='block';}

// Enter no campo de email/name não submete
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON')e.preventDefault();});