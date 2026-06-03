/**
 * notifications.js — Sistema Global de Notificações de Chat
 * Carregado em todas as páginas via head.js
 */
(function() {
  const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
  const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
  
  let supa = null;
  let USER = null;
  let unreadCount = 0;

  // ── Som de Notificação (Web Audio API) ────────────────────────
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume suave
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
      console.warn('Audio Context blockeado pelo navegador', e);
    }
  }

  // ── Toast Visual Global ───────────────────────────────────────
  function showGlobalToast(msgText, title = "Nova Mensagem") {
    // Toca o som
    playNotificationSound();

    let toastCont = document.getElementById('global-toast-container');
    if (!toastCont) {
      toastCont = document.createElement('div');
      toastCont.id = 'global-toast-container';
      Object.assign(toastCont.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      });
      document.body.appendChild(toastCont);
    }

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      background: 'rgba(26,20,16,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(200,135,26,0.4)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#F5EDD8',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '13px',
      cursor: 'pointer',
      transform: 'translateX(120%)',
      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s',
      opacity: '0',
      maxWidth: '300px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    });

    toast.innerHTML = `
      <div style="background:var(--ochre, #C8871A); color:var(--deep, #1A1410); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>
      <div style="flex:1; min-width:0">
        <div style="font-weight:700; margin-bottom:2px">${title}</div>
        <div style="opacity:0.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${msgText}</div>
      </div>
    `;

    toast.onclick = () => {
      window.location.href = 'sobral_chat.html';
    };

    toastCont.appendChild(toast);

    // Anima entrada
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Remove após 5 segundos
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // ── Badge Visual ──────────────────────────────────────────────
  function updateBadge() {
    // Atualiza todos os links do menu que apontam para o chat
    const chatLinks = document.querySelectorAll('a[href="sobral_chat.html"]');
    
    chatLinks.forEach(link => {
      let badge = link.querySelector('.unread-badge-global');
      
      if (unreadCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'unread-badge-global';
          
          // Estilo inline para garantir funcionamento imediato
          Object.assign(badge.style, {
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#b54a2a', // vermelho alerta
            color: '#fff',
            fontSize: '9px',
            fontWeight: 'bold',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            transform: 'scale(0)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          });
          
          link.style.position = 'relative'; // garante posicionamento correto
          link.appendChild(badge);
          
          requestAnimationFrame(() => badge.style.transform = 'scale(1)');
        }
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      } else {
        if (badge) {
          badge.style.transform = 'scale(0)';
          setTimeout(() => badge.remove(), 200);
        }
      }
    });
  }

  // Permite que outras páginas chamem essa função para zerar o badge
  window.resetGlobalUnreadBadge = function() {
    unreadCount = 0;
    updateBadge();
  };

  // ── Lógica Principal ──────────────────────────────────────────
  async function initNotifications() {
    supa = window.supa || (window.supabase ? window.supabase.createClient(SU, SK) : null);
    if (!supa && window.supabase) {
      supa = window.supabase.createClient(SU, SK);
      window.supa = supa;
    }
    if (!supa) {
      console.error('Supabase client não disponível para notifications.js');
      return;
    }
    const { data: { session } } = await supa.auth.getSession();
    USER = session?.user || null;

    if (!USER) return;

    // 1. Busca contagem inicial de mensagens não lidas
    const { count } = await supa
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', USER.id)
      .is('read_at', null);

    if (count > 0) {
      unreadCount = count;
      // Pequeno delay para garantir que os menus já foram renderizados pelo head.js
      setTimeout(updateBadge, 500); 
    }

    // 2. Inscreve no Realtime para novas mensagens
    // RLS garante que só vamos receber INSERTS de conversas em que participamos
    supa.channel('global_chat_notif')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const msg = payload.new;
        // Ignora mensagens enviadas pelo próprio usuário
        if (msg.sender_id === USER.id) return;
        
        // Se estivermos na página do chat e com a conversa aberta, NÃO incrementar
        // (A página do chat cuidará de marcar como lida e não notificar)
        if (window.location.pathname.includes('sobral_chat.html') && window.ACTIVE_CONV && window.ACTIVE_CONV.id === msg.conversation_id) {
          return;
        }

        unreadCount++;
        updateBadge();
        showGlobalToast("Você recebeu uma nova mensagem.", "Nova mensagem do Chat");
      })
      .subscribe();
  }

  // ── Carregamento do Supabase ──────────────────────────────────
  function checkDependencies() {
    if (window.supabase) {
      initNotifications();
    } else {
      // Injeta Supabase SDK se não existir na página
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = initNotifications;
      document.head.appendChild(script);
    }
  }

  // Inicia após DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDependencies);
  } else {
    checkDependencies();
  }
})();