/**
 * splash.js — Splash Screen Global e Automática
 * Exibe uma animação inicial apenas na primeira vez que o usuário abre o app na sessão.
 */
(function () {
  // 1. Configurações e Verificações
  const SPLASH_KEY = 'sc_splash_shown';
  const IS_PWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  // Se já foi exibido nesta sessão OU não for PWA (opcional), encerra aqui
  // Remova "!IS_PWA" se quiser que apareça também no navegador comum
  if (sessionStorage.getItem(SPLASH_KEY) || !IS_PWA) return;

  // 2. Injeção de Estilos CSS
  const style = document.createElement('style');
  style.textContent = `
    #sc-splash {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background-color: #1a1410; /* Cor de fundo do manifest.json */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: opacity 0.6s ease, visibility 0.6s;
    }
    .splash-content {
      text-align: center;
      animation: splash-zoom 1.2s ease-out forwards;
    }
    .splash-logo {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 32px;
      font-weight: 800;
      color: #F5EDD8;
      letter-spacing: -1px;
    }
    .splash-logo em {
      color: #ff6600;
      font-style: normal;
    }
    .splash-loader {
      width: 40px;
      height: 4px;
      background: rgba(255,102,0,0.2);
      border-radius: 4px;
      margin: 20px auto 0;
      position: relative;
      overflow: hidden;
    }
    .splash-loader::after {
      content: "";
      position: absolute;
      left: -50%;
      height: 100%;
      width: 50%;
      background: #ff6600;
      border-radius: 4px;
      animation: splash-load 1.5s infinite ease-in-out;
    }
    @keyframes splash-zoom {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes splash-load {
      0% { left: -50%; }
      100% { left: 100%; }
    }
    body.splash-active { overflow: hidden; }
  `;
  document.head.appendChild(style);

  // 3. Criação do Elemento HTML
  const splash = document.createElement('div');
  splash.id = 'sc-splash';
  splash.innerHTML = `
    <div class="splash-content">
      <div class="splash-logo">Sobral <em>Cultural</em></div>
      <div class="splash-loader"></div>
    </div>
  `;

  // 4. Lógica de Exibição e Remoção
  function hideSplash() {
    splash.style.opacity = '0';
    splash.style.visibility = 'hidden';
    document.body.classList.remove('splash-active');
    sessionStorage.setItem(SPLASH_KEY, 'true');
    setTimeout(() => splash.remove(), 600);
  }

  // Injeta no body assim que estiver disponível
  const inject = () => {
    document.body.appendChild(splash);
    document.body.classList.add('splash-active');
    setTimeout(hideSplash, 2500); // Exibe por 2.5 segundos
  };

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);
})();