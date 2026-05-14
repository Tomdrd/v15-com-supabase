/**
 * Injeção automática do Rodapé Padrão - Sobral Cultural
 */
(function() {
    const year = new Date().getFullYear();
    const footer = document.createElement('footer');
    footer.className = 'site-global-footer';
    footer.innerHTML = `&copy; ${year} Sobral Cultural &middot; Projeto de Extensão ADS`;

    const style = document.createElement('style');
    style.textContent = `
        .site-global-footer {
            padding: 50px 24px;
            box-sizing: border-box;
            text-align: center;
            font-size: 12px;
            color: rgba(245, 237, 216, 0.45);
            border-top: 1px solid rgba(200, 135, 26, 0.1);
            margin-top: 40px;
            width: 100%;
            font-family: 'Plus Jakarta Sans', sans-serif;
            letter-spacing: 0.4px;
            line-height: 1.5;
        }
        @media (max-width: 768px) {
            .site-global-footer {
                padding-bottom: calc(85px + env(safe-area-inset-bottom, 20px));
            }
        }

    `;

    document.head.appendChild(style);
    document.body.appendChild(footer);

    const pg = window.location.pathname.split('/').pop();

    // Oculta o rodapé visual na página inicial
    if (pg === '' || pg === 'index.html') {
        footer.style.display = 'none';
    }

})();
