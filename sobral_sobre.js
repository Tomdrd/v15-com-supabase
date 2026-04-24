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

    <h2>🗺️ Mapa Interativo</h2>
    <p>O coração do Sobral Cultural. Um mapa completo de Sobral construído para ser a forma mais intuitiva de descobrir e explorar a cidade — seja pelo computador ou pelo celular.</p>

    <h3>📍 Marcadores personalizados por categoria</h3>
    <p>Cada ponto turístico aparece no mapa com cor e ícone exclusivos de acordo com a categoria — Religioso, Cultura, Histórico, Natureza, Lazer e Eventos. Você identifica o que é cada ponto antes mesmo de clicar.</p>

    <h3>🔍 Filtros por categoria</h3>
    <p>Filtre os pontos diretamente no mapa para ver apenas o que interessa. Quer visitar igrejas? Selecione Religioso. Prefere natureza? Um clique e só os parques aparecem.</p>

    <h3>📋 Lista inteligente com carregamento fluido</h3>
    <p>Ao lado do mapa, os pontos turísticos são listados em ordem de relevância. Quando a geolocalização está ativa, os pontos mais próximos de você aparecem primeiro. A lista carrega de forma progressiva — como o feed de uma rede social — exibindo os primeiros resultados imediatamente e carregando mais conforme você rola, de forma infinita e sem travar.</p>

    <h3>📡 Geolocalização em tempo real</h3>
    <p>Ative "Minha Localização" e o mapa mostra exatamente onde você está, reordena os pontos pelo mais próximo e facilita planejar o próximo destino a pé ou de carro.</p>

    <h3>📖 Posts detalhados</h3>
    <p>Ao clicar em qualquer marcador ou item da lista, abre uma página completa com nome, foto, descrição histórica, horário de funcionamento, tipo de entrada e informações de como chegar. No final do post, um mapa mostra a rota até o local com opção de abrir diretamente no <strong>Google Maps</strong>, <strong>Waze</strong> ou chamar um <strong>Uber</strong> — tudo sem sair do site.</p>

    <h3>❤️ Gostei · ✅ Eu Fui · 📅 Eu Vou</h3>
    <p>Estando logado, você registra sua relação com cada ponto — marcar que gostou, que já visitou ou que pretende visitar. Tudo fica salvo no seu perfil e pode ser consultado a qualquer momento na aba Favoritos.</p>

    <h3>📤 Sugerir um novo ponto</h3>
    <p>Qualquer usuário pode sugerir um local que ainda não está no mapa. A sugestão passa por revisão e, se aprovada, aparece para toda a comunidade.</p>

    <h3>☁️ Dados sempre atualizados</h3>
    <p>Todos os pontos são carregados em tempo real direto do banco de dados em nuvem, garantindo informações sempre atualizadas em qualquer dispositivo.</p>

    <h2>Sobral, Ceará</h2>
    <p>Sobral é a segunda maior cidade do Ceará e um dos maiores polos culturais do interior nordestino. Com um centro histórico preservado, igrejas centenárias, teatros, museus e uma gastronomia rica e autêntica, a cidade guarda tesouros que merecem ser descobertos e celebrados.</p>
    <p>De sua famosa Catedral de Nossa Senhora da Conceição ao animado Mercado Municipal, cada esquina de Sobral conta uma história de fé, resistência e criatividade do povo cearense.</p>

    <h2>Tecnologia a Serviço da Cultura</h2>
    <p>Este projeto foi desenvolvido com tecnologias modernas — HTML5, CSS3, JavaScript, Leaflet Maps e Supabase — buscando oferecer uma experiência fluida e acessível em qualquer dispositivo, do smartphone ao desktop.</p>

    <h3>Paleta de Cores</h3>
    <p>O projeto utiliza variáveis CSS globais definidas em <code>vars.css</code>, importado como base em todas as páginas. Isso garante consistência de cores em toda a interface — ao alterar uma variável, a mudança se propaga para qualquer componente que a utilize. Cada página também possui seu próprio arquivo CSS com estilos específicos, complementando a base global sem quebrá-la.</p>

    <h3>Tipografia</h3>
    <p>A fonte principal de toda a interface é a <strong>Plus Jakarta Sans</strong>, carregada via Google Fonts. Trata-se de uma sans-serif geométrica moderna com excelente legibilidade em tamanhos pequenos — essencial para cards, labels e metadados — e personalidade suficiente para títulos e destaques. Ela é aplicada em todos os elementos: botões, campos de formulário, parágrafos, abas e títulos de seção.</p>
    <p>Os títulos principais das seções hero usam <strong>Times New Roman</strong> em peso normal — uma decisão intencional de contraste: a serifa clássica em meio ao sans-serif moderno remete à tradição histórica de Sobral, enquanto o peso leve evita qualquer aspecto pesado ou antiquado.</p>

    <p>Acreditamos que tecnologia e cultura caminham juntas, e que projetos como este podem transformar a maneira como as pessoas se relacionam com o patrimônio histórico e cultural de suas cidades.</p>`;
  }
};