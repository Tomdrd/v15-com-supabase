/**
 * head.js — Módulo global do Sobral Cultural
 * Injeta: favicon, Open Graph, PWA meta, Lucide + icons.css
 * Uso: <script src="head.js"></script> — primeira linha do <head>
 */
(function () {
  const head = document.head;

  // Detecta o caminho base (funciona com file://, localhost e domínio)
  const scripts = document.querySelectorAll('script[src*="head.js"]');
  const base = scripts.length
    ? scripts[0].src.replace('head.js', '')
    : './';

  // ── Helpers ───────────────────────────────────────────
  function meta(attrs) {
    const el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  }
  function link(attrs) {
    const el = document.createElement('link');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  }

  // ── Open Graph ────────────────────────────────────────
  const OG_IMAGE = 'https://sobralcultural.vercel.app/tumb.jpg';

  // og:image, og:url e campos estáticos podem ser injetados imediatamente
  if (!document.querySelector('meta[property="og:type"]')) {
  meta({ property: 'og:site_name',    content: 'Sobral Cultural' });
  meta({ property: 'og:type',         content: 'website' });
  meta({ property: 'og:image',        content: OG_IMAGE });
  meta({ property: 'og:image:width',  content: '1200' });
  meta({ property: 'og:image:height', content: '630' });
  meta({ property: 'og:url',          content: 'https://sobralcultural.vercel.app/' });
  meta({ property: 'og:description',  content: 'Mapeamento cultural e turístico de Sobral, Ceará.' });
  }

  // og:title e twitter:title precisam do <title> da página — lê após DOM pronto
  if (!document.querySelector('meta[property="og:title"]')) {
  const ogTitle     = document.createElement('meta');
  const twTitle     = document.createElement('meta');
  const twCard      = document.createElement('meta');
  const twDesc      = document.createElement('meta');
  const twImage     = document.createElement('meta');
  const twUrl       = document.createElement('meta');
  ogTitle.setAttribute('property', 'og:title');
  twTitle.setAttribute('name', 'twitter:title');
  twCard.setAttribute('name',  'twitter:card');        twCard.setAttribute('content',  'summary_large_image');
  twDesc.setAttribute('name',  'twitter:description'); twDesc.setAttribute('content',  'Mapeamento cultural e turístico de Sobral, Ceará.');
  twImage.setAttribute('name', 'twitter:image');       twImage.setAttribute('content', OG_IMAGE);
  twUrl.setAttribute('name',   'twitter:url');         twUrl.setAttribute('content',   'https://sobralcultural.vercel.app/');
  head.appendChild(ogTitle);
  head.appendChild(twCard);
  head.appendChild(twTitle);
  head.appendChild(twDesc);
  head.appendChild(twImage);
  head.appendChild(twUrl);

  function applyOgTitle() {
    const title = document.title || 'Sobral Cultural';
    ogTitle.setAttribute('content', title);
    twTitle.setAttribute('content', title);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOgTitle);
  } else {
    applyOgTitle();
  }
  }

  // ── Meta description ─────────────────────────────────
  if (!document.querySelector('meta[name="description"]')) {
    meta({ name: 'description', content: 'Mapeamento cultural e turístico de Sobral, Ceará.' });
  }

  // ── Favicon ───────────────────────────────────────────
  link({ rel: 'icon', href: base + 'favicon.ico', type: 'image/x-icon' });
  link({ rel: 'apple-touch-icon', sizes: '180x180', href: base + 'icon-180.png' });
  link({ rel: 'icon', type: 'image/png', sizes: '192x192', href: base + 'icon-192.png' });

  // ── PWA manifest ─────────────────────────────────────
  link({ rel: 'manifest', href: base + 'manifest.json' });

  // ── topbar.css
  if (!document.querySelector('link[href*="topbar.css"]')) {
    link({ rel: 'stylesheet', href: base + 'topbar.css' });
  }

  // ── icons.css ─────────────────────────────────────────
  if (!document.querySelector('link[href*="icons.css"]')) {
    link({ rel: 'stylesheet', href: base + 'icons.css' });
  }

  // ── Lucide ────────────────────────────────────────────
  function initIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  if (!window.lucide) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = initIcons;
    head.appendChild(script);
  } else {
    // já carregado — aguarda DOM completo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initIcons);
    } else {
      initIcons();
    }
  }

  // ── Constante do site ────────────────────────
  const SITE_NAME = 'Sobral Cultural';

  // ── Configuração do Menu Global ──────────────
  const MENU_ITEMS = [
    { label: 'Mapa', href: 'index.html', icon: 'map' },
    { label: 'Sobre', href: 'sobral_sobre.html', icon: 'info' },
    { label: 'Contato', href: 'sobral_contato.html', icon: 'mail' },
    { label: 'Notícias', href: 'sobral_noticias.html', icon: 'newspaper' },
    { label: 'Quiz', href: 'sobral_game.html', icon: 'gamepad-2' },
  ];

  // Função para injetar os menus
  document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const currentFile = path.split('/').pop() || 'index.html';
    const normalizedPath = currentFile === '' ? 'index.html' : currentFile;

    // 2. Reinicializa ícones Lucide (nav já estático no HTML)
    if (window.lucide) {
      lucide.createIcons();
    }
  });

})();
