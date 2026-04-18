const SU='https://nrohpfggqcbscyoigpiz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa=supabase.createClient(SU,SK);
function toggleDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.toggle('open'));}
function closeDrw(){['hbg','drw','dov'].forEach(id=>document.getElementById(id).classList.remove('open'));}
window.onload=async()=>{
  const{data}=await supa.from('pages').select('content').eq('id','sobre').single();
  const el=document.getElementById('pageContent');
  if(data?.content){el.innerHTML=data.content;}
  else{
    el.innerHTML=`
    <h2>O Projeto</h2>
    <p>O <strong>Sobral Cultural</strong> nasceu de um projeto de extensão universitária do curso de Análise e Desenvolvimento de Sistemas, com o propósito de utilizar a tecnologia da informação para promover e difundir a rica cultura da cidade de Sobral, no norte do Ceará.</p>
    <h2>Nossa Missão</h2>
    <p>Democratizar o acesso à informação sobre os pontos turísticos, históricos e culturais de Sobral, conectando moradores e visitantes às experiências mais autênticas que a cidade tem a oferecer. Através de um mapa interativo, posts detalhados e recursos de geolocalização, buscamos tornar Sobral mais conhecida e acessível para todos.</p>
    <h2>Sobral, Ceará</h2>
    <p>Sobral é a segunda maior cidade do Ceará e um dos maiores polos culturais do interior nordestino. Com um centro histórico preservado, igrejas centenárias, teatros, museus e uma gastronomia rica e autêntica, a cidade guarda tesouros que merecem ser descobertos e celebrados.</p>
    <p>De sua famosa Catedral de Nossa Senhora da Conceição ao animado Mercado Municipal, cada esquina de Sobral conta uma história de fé, resistência e criatividade do povo cearense.</p>
    <h2>Tecnologia a Serviço da Cultura</h2>
    <p>Este projeto foi desenvolvido com tecnologias modernas — HTML5, CSS3, JavaScript, Leaflet Maps e Supabase — buscando oferecer uma experiência fluida e acessível em qualquer dispositivo, do smartphone ao desktop.</p>
    <p>Acreditamos que tecnologia e cultura caminham juntas, e que projetos como este podem transformar a maneira como as pessoas se relacionam com o patrimônio histórico e cultural de suas cidades.</p>`;
  }
};