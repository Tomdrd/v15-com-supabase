const { createClient } = require('@supabase/supabase-js');
const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = createClient(SU, SK);

async function test() {
  const { data, error } = await supa.from('pesquisa_respostas').select('*');
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : 'null');
  if (data) {
    console.log("Sample:", data.slice(0, 2));
  }
}
test();
