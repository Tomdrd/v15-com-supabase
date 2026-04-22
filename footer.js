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
            padding: 40px 20px;
            text-align: center;
            font-size: 11px;
            color: rgba(245, 237, 216, 0.3);
            border-top: 1px solid rgba(200, 135, 26, 0.1);
            margin-top: 50px;
            width: 100%;
            font-family: 'Plus Jakarta Sans', sans-serif;
            letter-spacing: 0.5px;
        }
        @media (max-width: 768px) {
            .site-global-footer { padding-bottom: 100px; } /* Espaço para bnav mobile */
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(footer);
})();