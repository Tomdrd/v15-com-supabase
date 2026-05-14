// Funções do menu/drawer (padrão em outras páginas)
function toggleDrw() {
  ['hbg', 'drw', 'dov'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  });
}

function closeDrw() {
  ['hbg', 'drw', 'dov'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
}

// Função para voltar na história do navegador
function goBack() {
  // Se não houver histórico para voltar, vai para a página inicial.
  history.length > 1 ? history.back() : window.location.href = 'index.html';
}

// Inicializa os ícones Lucide
document.addEventListener('DOMContentLoaded', () => {
  window.lucide?.createIcons();
});