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

        /* WIDGET PESQUISA */
        #pesq-panel {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%) translateX(110%);
            z-index: 900;
            width: 220px;
            background: #1e2a28;
            border: 1px solid rgba(27,107,107,.45);
            border-right: none;
            border-radius: 16px 0 0 16px;
            padding: 22px 18px 18px;
            box-shadow: -6px 0 32px rgba(0,0,0,.45);
            opacity: 0;
            transition: transform .38s cubic-bezier(.4,0,.2,1), opacity .32s;
        }
        #pesq-panel.show {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
        }
        #pesq-tab {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 900;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            background: linear-gradient(180deg, #1B6B6B, #14504f);
            color: #e0f5f5;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 11.5px;
            font-weight: 700;
            letter-spacing: .9px;
            padding: 20px 11px;
            border-radius: 12px 0 0 12px;
            cursor: pointer;
            border: 1px solid rgba(27,107,107,.5);
            border-right: none;
            box-shadow: -4px 0 20px rgba(0,0,0,.35);
            display: flex;
            align-items: center;
            gap: 9px;
            user-select: none;
            opacity: 0;
            pointer-events: none;
            transition: opacity .28s, padding .2s, background .2s;
        }
        #pesq-tab.show { opacity: 1; pointer-events: all; }
        #pesq-tab:hover { background: linear-gradient(180deg,#1f7e7e,#175e5d); padding-left:14px; }
        #pesq-tab i { width:14px; height:14px; flex-shrink:0; }
        .pw-close {
            position:absolute; top:10px; right:12px;
            background:none; border:none;
            color:rgba(224,245,245,.35); cursor:pointer;
            font-size:15px; line-height:1; padding:3px;
            transition:color .15s;
        }
        .pw-close:hover { color:rgba(224,245,245,.85); }
        .pw-icon {
            width:42px; height:42px; border-radius:11px;
            background:rgba(27,107,107,.2); border:1px solid rgba(27,107,107,.35);
            display:flex; align-items:center; justify-content:center;
            color:#5ec8c8; margin-bottom:12px;
        }
        .pw-icon i { width:20px; height:20px; }
        .pw-title {
            font-family:'Plus Jakarta Sans',sans-serif;
            font-size:14px; font-weight:700;
            color:#e0f5f5; margin-bottom:6px; line-height:1.3;
        }
        .pw-desc {
            font-family:'Plus Jakarta Sans',sans-serif;
            font-size:12px; color:rgba(224,245,245,.5);
            line-height:1.65; margin-bottom:16px;
        }
        .pw-btn {
            display:flex; align-items:center; justify-content:center; gap:7px;
            width:100%; padding:10px 14px;
            background:linear-gradient(135deg,#1B6B6B,#14504f);
            border:1px solid rgba(27,107,107,.5); border-radius:10px;
            color:#e0f5f5; font-family:'Plus Jakarta Sans',sans-serif;
            font-size:13px; font-weight:600; text-decoration:none; transition:all .2s;
        }
        .pw-btn:hover {
            background:linear-gradient(135deg,#1f7e7e,#175e5d);
            transform:translateY(-1px); box-shadow:0 6px 20px rgba(27,107,107,.3);
        }
        .pw-btn i { width:14px; height:14px; }
        .pw-dismiss {
            display:block; text-align:center; margin-top:10px;
            font-family:'Plus Jakarta Sans',sans-serif;
            font-size:11px; color:rgba(224,245,245,.28);
            cursor:pointer; background:none; border:none; width:100%; padding:2px;
            transition:color .15s;
        }
        .pw-dismiss:hover { color:rgba(224,245,245,.6); }
        @media (max-width:480px) {
            #pesq-panel { width:192px; padding:18px 14px 14px; }
            .pw-title { font-size:13px; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(footer);

    // Não mostra na própria página de pesquisa
    const pg = window.location.pathname.split('/').pop();
    if (pg === 'sobral_pesquisa.html') return;

    // Não mostra se dispensou nesta sessão
    const KEY = 'pesq_widget_dismissed';
    if (sessionStorage.getItem(KEY)) return;

    // Painel
    const panel = document.createElement('div');
    panel.id = 'pesq-panel';
    panel.innerHTML = `
        <button class="pw-close" onclick="pwClose()" title="Minimizar">✕</button>
        <div class="pw-icon"><i data-lucide="clipboard-list"></i></div>
        <div class="pw-title">Sua opinião importa</div>
        <div class="pw-desc">Leva menos de 3 minutos. Ajude a melhorar o Sobral Cultural.</div>
        <a href="sobral_pesquisa.html" class="pw-btn">
            <i data-lucide="arrow-right"></i>
            Responder
        </a>
        <button class="pw-dismiss" onclick="pwDismiss()">Não mostrar novamente</button>
    `;

    // Aba
    const tab = document.createElement('div');
    tab.id = 'pesq-tab';
    tab.innerHTML = `<i data-lucide="clipboard-list"></i>PESQUISA`;
    tab.onclick = function(){ pwOpen(); };

    document.body.appendChild(panel);
    document.body.appendChild(tab);

    window.pwOpen = function() {
        tab.classList.remove('show');
        panel.classList.add('show');
    };
    window.pwClose = function() {
        panel.classList.remove('show');
        setTimeout(function(){ tab.classList.add('show'); }, 200);
    };
    window.pwDismiss = function() {
        sessionStorage.setItem(KEY, '1');
        panel.classList.remove('show');
        tab.classList.remove('show');
        setTimeout(function(){ panel.remove(); tab.remove(); }, 400);
    };

    // Aparece após 2s
    setTimeout(function() {
        panel.classList.add('show');
        if (window.lucide) lucide.createIcons();
    }, 2000);

    if (window.lucide) lucide.createIcons();

})();
