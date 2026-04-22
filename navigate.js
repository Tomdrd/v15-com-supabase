/**
 * navigate.js — Transição suave entre páginas
 * Sobral Cultural · Inclua após head.js em todos os HTMLs
 */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    body { opacity: 1; transition: opacity 0.18s ease; }
    body.page-leaving { opacity: 0; pointer-events: none; }
  `;
  document.head.appendChild(style);

  function fadeIn() {
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.22s ease';
        document.body.style.opacity = '1';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fadeIn);
  } else {
    fadeIn();
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('//') ||
        href.startsWith('#') || href.startsWith('javascript') ||
        href.startsWith('mailto') || a.target === '_blank') return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { location.href = href; }, 185);
  });

  window.navigateTo = function (href) {
    document.body.classList.add('page-leaving');
    setTimeout(() => { location.href = href; }, 185);
  };
})();
