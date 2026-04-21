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
  const OG_IMAGE = 'https://raw.githubusercontent.com/Tomdrd/v15-com-supabase/main/tumb.jpg';

  // og:image, og:url e campos estáticos podem ser injetados imediatamente
  meta({ property: 'og:site_name',    content: 'Sobral Cultural' });
  meta({ property: 'og:type',         content: 'website' });
  meta({ property: 'og:image',        content: OG_IMAGE });
  meta({ property: 'og:image:width',  content: '1200' });
  meta({ property: 'og:image:height', content: '630' });
  meta({ property: 'og:url',          content: window.location.href });
  meta({ property: 'og:description',  content: 'Explore os pontos turísticos, culturais e históricos de Sobral, Ceará.' });

  // og:title e twitter:title precisam do <title> da página — lê após DOM pronto
  const ogTitle     = document.createElement('meta');
  const twTitle     = document.createElement('meta');
  const twCard      = document.createElement('meta');
  const twDesc      = document.createElement('meta');
  const twImage     = document.createElement('meta');
  ogTitle.setAttribute('property', 'og:title');
  twTitle.setAttribute('name', 'twitter:title');
  twCard.setAttribute('name',  'twitter:card');        twCard.setAttribute('content',  'summary_large_image');
  twDesc.setAttribute('name',  'twitter:description'); twDesc.setAttribute('content',  'Explore os pontos turísticos, culturais e históricos de Sobral, Ceará.');
  twImage.setAttribute('name', 'twitter:image');       twImage.setAttribute('content', OG_IMAGE);
  head.appendChild(ogTitle);
  head.appendChild(twCard);
  head.appendChild(twTitle);
  head.appendChild(twDesc);
  head.appendChild(twImage);

  function applyOgTitle() {
    const title = document.title || 'Sobral Cultural — Mapa Turístico';
    ogTitle.setAttribute('content', title);
    twTitle.setAttribute('content', title);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOgTitle);
  } else {
    applyOgTitle();
  }

  // ── Meta description ─────────────────────────────────
  if (!document.querySelector('meta[name="description"]')) {
    meta({ name: 'description', content: 'Explore os pontos turísticos, culturais e históricos de Sobral, Ceará.' });
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

  // Preenche todos os .tb-logo-name com a constante
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tb-logo-name').forEach(el => {
      // preserva o <em> de "Cultural" se existir
      if (!el.querySelector('em')) {
        const [first, ...rest] = SITE_NAME.split(' ');
        el.innerHTML = first + (rest.length ? ' <em style="color:#ff6600;font-style:normal">' + rest.join(' ') + '</em>' : '');
      }
    });
  });

})();
