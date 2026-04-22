const supa=supabase.createClient('https://nrohpfggqcbscyoigpiz.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA');
(async()=>{
  const{data}=await supa.from('pages').select('content,updated_at').eq('id','termos').single();
  const el=document.getElementById('termsContent');
  if(data?.content){
    el.innerHTML=data.content+`<div class="accept-box"><p>Ao criar uma conta, enviar eventos ou pontos turísticos, você concorda integralmente com estes termos.</p><button class="btn-accept" onclick="window.close();history.back()"><i data-lucide="check-circle" style="width:14px;height:14px;pointer-events:none"></i> Li e Aceito os Termos</button></div><div class="last-update">Última atualização: ${new Date(data.updated_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</div>`;
  }
})();