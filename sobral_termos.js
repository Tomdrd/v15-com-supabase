function toggleDrw(){

  const{data}=await supa.from('pages').select('content,updated_at').eq('id','termos').single();
  const el=document.getElementById('termsContent');
  if(data?.content){
    el.innerHTML=data.content+`<div class="accept-box"><p>Ao criar uma conta, enviar eventos ou pontos turísticos, você concorda integralmente com estes termos.</p><button class="btn-accept" onclick="window.close();history.back()"><i data-lucide="check-circle" style="width:14px;height:14px;pointer-events:none"></i> Li e Aceito os Termos</button></div><div class="last-update">Última atualização: ${new Date(data.updated_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</div>`;
  }
})();