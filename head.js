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

  // ── Cache Script ─────────────────────────────────────
  if (!document.querySelector('script[src*="cache.js"]')) {
    const cacheScript = document.createElement('script');
    cacheScript.src = base + 'cache.js';
    cacheScript.async = false;
    head.insertBefore(cacheScript, head.firstChild);
  }

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
  const OG_IMAGE = 'https://sobralcultural.vercel.app/tumb.webp';

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



  // ── Lucide ────────────────────────────────────────────
  function initIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  if (!window.lucide) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js';
    script.async = true;
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

  // ── Instalação PWA ───────────────────────────
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.installPWA = async (e) => {
    if (e) e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') deferredPrompt = null;
    } else {
      alert('O aplicativo já está instalado ou seu navegador não suporta a instalação direta.');
    }
  };

  // ── Configuração do Menu Global ──────────────
  const MENU_ITEMS = [
    { label: 'Sobre', href: 'sobral_sobre.html', icon: 'info' },
    { label: 'Contato', href: 'sobral_contato.html', icon: 'mail' },
    { label: 'Notícias', href: 'sobral_noticias.html', icon: 'newspaper' },
    { label: 'Quiz', href: 'sobral_game.html', icon: 'gamepad-2' },
    { label: 'App', href: '#', icon: 'download', onclick: 'installPWA(event)' },
  ];

  // Função para injetar os menus
  document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const currentFile = path.split('/').pop() || 'index.html';
    const normalizedPath = currentFile === '' ? 'index.html' : currentFile;

    // 2. Injeta o Menu Desktop (.tb-nav ou .hn)
    const desktopNav = document.querySelector('.tb-nav') || document.querySelector('.hn');
    if (desktopNav) {
      // Salva o HTML dos botões especiais que devem ser preservados.
      const specialButtonsHTML = Array.from(desktopNav.querySelectorAll('.btn-geo, #adminLink, #authChip'))
        .map(el => el.outerHTML)
        .join('');
      
      let menuHtml = MENU_ITEMS.map(item => {
        const isActive = normalizedPath === item.href ? 'active' : '';
        const clickAttr = item.onclick ? ` onclick="${item.onclick}"` : '';
        return `<a href="${item.href}" class="nl ${isActive}"${clickAttr}><i data-lucide="${item.icon}"></i> ${item.label}</a>`;
      }).join('');

      // Injeta botão Sair se estiver no Perfil (Desktop)
      if (normalizedPath === 'sobral_perfil.html') {
        menuHtml += `<a href="#" onclick="event.preventDefault();if(window.doLogout)doLogout();else location.reload()" class="nl"><i data-lucide="log-out"></i> Sair</a>`;
      }

      // Remonta a barra de navegação para garantir a ordem e consistência.
      desktopNav.innerHTML = menuHtml + specialButtonsHTML;
    }

    // 3. Injeta o Menu Mobile (Drawer)
    const drawerInner = document.querySelector('.drw-inner') || document.querySelector('.drw');
    if (drawerInner) {
      const isIndex = normalizedPath === 'index.html';

      // Salva o HTML dos elementos especiais que devem ser preservados (apenas na index.html).
      const specialElementsHTML = Array.from(drawerInner.querySelectorAll('.drw-sec, #drawerAdminSec, #drawerAdminLink, #drawerAuthSection, button'))
        .filter(el => {
          // Não preserva o título "Navegação" (será re-injetado abaixo)
          if (el.classList.contains('drw-sec') && el.textContent.trim() === 'Navegação') return false;
          
          // Em páginas internas, não preserva os botões/seções especiais da index.
          if (!isIndex && (el.tagName === 'BUTTON' || el.id.startsWith('drawer') || el.id === 'drwLogout')) return false;
          
          return true;
        })
        .map(el => el.outerHTML)
        .join('');

      let navHtml = `<div class="drw-sec">Navegação</div>`;
      navHtml += MENU_ITEMS.map(item => {
        const isActive = normalizedPath === item.href ? 'active' : '';
        const clickAttr = item.onclick ? ` onclick="${item.onclick}"` : '';
        return `<a href="${item.href}" class="drw-lnk ${isActive}"${clickAttr}><div class="drw-ic"><i data-lucide="${item.icon}"></i></div> ${item.label}</a>`;
      }).join('');

      if (normalizedPath === 'sobral_perfil.html') {
        navHtml += `<a href="#" onclick="event.preventDefault();if(window.doLogout)doLogout()" class="drw-lnk"><div class="drw-ic"><i data-lucide="log-out"></i></div> Sair da Conta</a>`;
      }

      // Remonta o drawer para garantir a ordem e consistência.
      drawerInner.innerHTML = navHtml + specialElementsHTML;
    }

    // 4. Reinicializa ícones após injeção
    if (window.lucide) {
      lucide.createIcons();
    }
  });

})();
