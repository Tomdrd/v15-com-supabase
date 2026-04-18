const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);
const EMOJIS=['📍','🏛️','⛪','🎭','🎨','🌿','⛰️','🏞️','🛒','🏰','🎓','⚽','🎪','🎡','🌊','🎶','🍽️','🏖️','🌺','💒','📅','🎠'];

let USER=null, selectedType='spot', coordMap=null, coordMarker=null, pendingPhoto=null;

async function init(){
  const{data:{session}}=await supa.auth.getSession();
  if(!session){location.href='sobral_login.html?redirect=sobral_submeter.html';return;}
  USER=session.user;
  const av=USER.user_metadata?.avatar_url||USER.user_metadata?.picture;
  const avEl=document.getElementById('userAvatar');
  if(av)avEl.innerHTML=`<img src="${av}" alt="">`;
  else avEl.textContent=(USER.user_metadata?.full_name||USER.email||'?').charAt(0).toUpperCase();
  initMap();
  loadTerms();
}

async function loadTerms(){
  const{data}=await supa.from('pages').select('content').eq('id','termos').single();
  const el=document.getElementById('termsScroll');
  if(data?.content){
    const tmp=document.createElement('div');tmp.innerHTML=data.content;
    el.innerHTML=tmp.innerText.substring(0,800)+'… <a href="sobral_termos.html" target="_blank" style="color:var(--ochre)">Ler completo</a>';
  }
}

function initMap(){
  setTimeout(()=>{
    coordMap=L.map('coordMap',{center:[-3.688,-40.3497],zoom:14});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CARTO',subdomains:'abcd',maxZoom:19}).addTo(coordMap);
    coordMap.on('click',e=>{
      document.getElementById('fLat').value=e.latlng.lat.toFixed(6);
      document.getElementById('fLng').value=e.latlng.lng.toFixed(6);
      if(coordMarker)coordMarker.setLatLng(e.latlng);
      else{coordMarker=L.marker(e.latlng,{draggable:true}).addTo(coordMap);coordMarker.on('dragend',()=>{const p=coordMarker.getLatLng();document.getElementById('fLat').value=p.lat.toFixed(6);document.getElementById('fLng').value=p.lng.toFixed(6);});}
    });
  },100);
}

function selectType(type){
  selectedType=type;
  document.getElementById('typeSpot').classList.toggle('selected',type==='spot');
  document.getElementById('typeEvent').classList.toggle('selected',type==='event');
  document.getElementById('eventDates').style.display=type==='event'?'block':'none';
}

function toggleSec(name){
  document.getElementById('sec-'+name).classList.toggle('collapsed');
}

function pickEmoji(e){
  document.getElementById('fEmoji').value=e;
  document.querySelectorAll('.emoji-opt').forEach(el=>el.classList.remove('sel'));
  event.target.classList.add('sel');
}

function updDesc(){
  const v=document.getElementById('fDesc').value;
  document.getElementById('descCnt').textContent=`${v.length}/400`;
}

// PHOTO
async function handlePhoto(file){
  if(!file||!file.type.startsWith('image/')){showErr('Escolha uma imagem válida.');return;}
  if(file.size>5*1024*1024){showErr('Imagem muito grande (máx. 5MB).');return;}
  const compressed=await compressImage(file);
  pendingPhoto=compressed;
  document.getElementById('photoArea').innerHTML=`<div class="photo-preview"><img src="${compressed}" alt="Preview"><div class="photo-preview-actions"><button class="btn-secondary" style="background:rgba(0,0,0,.5);color:#fff;border:none;padding:6px 12px;border-radius:7px;cursor:pointer;font-size:12px" onclick="removePhoto()">🗑️ Remover</button></div></div>`;
}
async function compressImage(file,maxW=900,q=0.78){return new Promise(r=>{const rd=new FileReader();rd.onload=e=>{const img=new Image();img.onload=()=>{const ratio=Math.min(maxW/img.width,1);const c=document.createElement('canvas');c.width=img.width*ratio;c.height=img.height*ratio;c.getContext('2d').drawImage(img,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',q));};img.src=e.target.result;};rd.readAsDataURL(file);});}
function removePhoto(){pendingPhoto=null;document.getElementById('photoArea').innerHTML=`<div class="drop-zone" id="dropZone"><input type="file" accept="image/*" onchange="handlePhoto(this.files[0])"><div class="drop-zone-icon">📤</div><p>Arraste ou clique para enviar uma foto</p><small>JPG, PNG, WEBP — máximo 5 MB</small></div>`;}

// SUBMIT
async function submitForm(){
  const name=document.getElementById('fName').value.trim();
  const lat=parseFloat(document.getElementById('fLat').value);
  const lng=parseFloat(document.getElementById('fLng').value);
  const desc=document.getElementById('fDesc').value.trim();
  const terms=document.getElementById('termsCk').checked;

  if(!name){showErr('Informe o nome do local ou evento.');return;}
  if(!desc||desc.length<20){showErr('Descrição muito curta (mínimo 20 caracteres).');return;}
  if(!lat||!lng){showErr('Marque a localização no mapa clicando sobre ele.');return;}
  if(!terms){showErr('Você precisa aceitar os Termos de Uso para enviar.');return;}

  const btn=document.getElementById('btnSubmit'),txt=document.getElementById('btnTxt');
  btn.disabled=true;txt.innerHTML='<span class="loader"></span>Enviando…';

  // upload photo if any
  let photoUrl=null;
  if(pendingPhoto){
    const path=`submissions/${USER.id}/${Date.now()}.jpg`;
    const res=await fetch(pendingPhoto);const blob=await res.blob();
    const{data,error:upErr}=await supa.storage.from('spots-photos').upload(path,blob,{contentType:'image/jpeg',upsert:true});
    if(!upErr){const{data:ud}=supa.storage.from('spots-photos').getPublicUrl(path);photoUrl=ud.publicUrl;}
  }

  const row={
    user_id:USER.id,type:selectedType,status:'pending',
    name,cat:document.getElementById('fCat').value,
    emoji:document.getElementById('fEmoji').value,
    color:'#C8871A',
    lat,lng,description:desc,
    address:document.getElementById('fAddress').value.trim(),
    horario:document.getElementById('fHorario').value.trim(),
    entrada:document.getElementById('fEntrada').value.trim(),
    photo:photoUrl,
    event_date:selectedType==='event'?document.getElementById('fDateStart').value||null:null,
    event_end:selectedType==='event'?document.getElementById('fDateEnd').value||null:null,
    terms_agreed:true
  };

  const{error}=await supa.from('submissions').insert(row);
  if(error){btn.disabled=false;txt.innerHTML='📤 Enviar para Aprovação';showErr('Erro ao enviar: '+error.message);return;}

  document.getElementById('formWrap').style.display='none';
  document.getElementById('successScreen').style.display='block';
}

function showErr(msg){const e=document.getElementById('errMsg');e.textContent=msg;e.classList.add('show');e.scrollIntoView({behavior:'smooth',block:'nearest'});setTimeout(()=>e.classList.remove('show'),5000);}

// drag-drop
document.addEventListener('DOMContentLoaded',()=>{
  const dz=document.getElementById('dropZone');
  if(!dz)return;
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
  dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)handlePhoto(f);});
});

window.onload=init;