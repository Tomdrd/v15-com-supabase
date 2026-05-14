const { createClient } = require('@supabase/supabase-js');
const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = createClient(SU, SK);

async function testInsert() {
  const payload = {
    ferramentas_usadas: ['Mapa interativo de pontos turísticos'],
    ferramenta_favorita: 'Mapa interativo de pontos turísticos',
    informacoes_uteis: 'Sim',
    facil_navegar: 'Sim',
    nota_saude: 10,
    aprendeu_algo: 'Sim',
    usaria_novamente: 'Sim',
    sugestoes: 'Tudo ótimo'
  };

  const { data, error } = await supa.from('pesquisa_respostas').insert([payload]).select();
  console.log("Insert Error:", error);
  console.log("Inserted Data:", data);
}
testInsert();
