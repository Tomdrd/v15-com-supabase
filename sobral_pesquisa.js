// sobral_pesquisa.js — Pesquisa de Satisfação Sobral Cultural

const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = supabase.createClient(SU, SK);

// ── Ferramentas disponíveis no projeto ──────────────
const FERRAMENTAS = [
  'Mapa interativo de pontos turísticos',
  'Quiz cultural sobre Sobral',
  'Notícias e eventos',
  'Perfil de usuário',
  'Submissão de novos pontos',
  'Posts e informações dos pontos',
  'Reações e favoritos',
  'Busca e filtros por categoria',
];

// ── Perguntas do formulário ──────────────────────────
const PERGUNTAS = [
  {
    id: 'ferramentas_usadas',
    tipo: 'checkbox',
    pergunta: 'Quais ferramentas do site você usou?',
    hint: 'Pode marcar mais de uma.',
    opcoes: FERRAMENTAS,
  },
  {
    id: 'ferramenta_favorita',
    tipo: 'radio',
    pergunta: 'Qual ferramenta você mais gostou?',
    opcoes: FERRAMENTAS,
  },
  {
    id: 'informacoes_uteis',
    tipo: 'radio',
    pergunta: 'Você considera que as informações e ferramentas do site foram úteis para você?',
    opcoes: ['Sim', 'Em partes', 'Não'],
  },
  {
    id: 'facil_navegar',
    tipo: 'radio',
    pergunta: 'O site é fácil de navegar e entender?',
    opcoes: ['Sim', 'Parcialmente', 'Não'],
  },
  {
    id: 'nota_saude',
    tipo: 'escala',
    pergunta: 'Em uma escala de 0 a 10, qual nota você dá para o site como ferramenta de apoio à saúde e bem-estar?',
  },
  {
    id: 'aprendeu_algo',
    tipo: 'radio',
    pergunta: 'Você aprendeu algo novo com o site?',
    opcoes: ['Sim', 'Não', 'Não tenho certeza'],
  },
  {
    id: 'usaria_novamente',
    tipo: 'radio',
    pergunta: 'Você usaria o site novamente ou recomendaria para outras pessoas?',
    opcoes: ['Sim', 'Não', 'Talvez'],
  },
  {
    id: 'sugestoes',
    tipo: 'texto',
    pergunta: 'O que você acha que poderia ser melhorado?',
    hint: 'Campo opcional. Sua opinião é muito importante.',
  },
];

// ── Estado ───────────────────────────────────────────
let etapa = 0; // 0 = hero, 1..N = perguntas, N+1 = resultado
let respostas = {};
const TOTAL = PERGUNTAS.length;

// ── Helpers ──────────────────────────────────────────
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (tipo ? ' ' + tipo : '');
  setTimeout(() => { el.className = 'toast'; }, 3000);
}

function toggleDrw() {
  document.getElementById('hbg').classList.toggle('open');
  document.getElementById('drw').classList.toggle('open');
  document.getElementById('dov').classList.toggle('open');
}
function closeDrw() {
  document.getElementById('hbg').classList.remove('open');
  document.getElementById('drw').classList.remove('open');
  document.getElementById('dov').classList.remove('open');
}

// ── RENDER HUB (tela inicial) ────────────────────────
function renderHub() {
  document.getElementById('root').innerHTML = `
    <div class="pesquisa-wrap">
      <div class="pesq-hero">
        <div class="pesq-hero-ring">
          <i data-lucide="clipboard-list" style="width:40px;height:40px"></i>
        </div>
        <h1 class="pesq-hero-title">Pesquisa de <em>Satisfação</em></h1>
        <p class="pesq-hero-sub">
          Leva menos de 3 minutos. Suas respostas nos ajudam a melhorar o Sobral Cultural para toda a comunidade.
        </p>
        <div style="margin-top:28px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1">
          <button class="btn btn-primary btn-lg" onclick="comecar()">
            <i data-lucide="play" style="width:16px;height:16px"></i>
            Responder agora
          </button>
          <button class="btn btn-secondary btn-lg" onclick="verResultados()">
            <i data-lucide="bar-chart-2" style="width:16px;height:16px"></i>
            Ver resultados
          </button>
        </div>
      </div>
    </div>`;
  lucide?.createIcons();
}

// ── COMEÇA O FORMULÁRIO ──────────────────────────────
function comecar() {
  etapa = 1;
  renderPergunta();
}

// ── RENDER PERGUNTA ──────────────────────────────────
function renderPergunta() {
  const idx = etapa - 1;
  const p = PERGUNTAS[idx];
  const pct = Math.round((etapa / TOTAL) * 100);
  const val = respostas[p.id];

  let corpo = '';

  if (p.tipo === 'checkbox') {
    const selecionados = Array.isArray(val) ? val : [];
    corpo = `<div class="pesq-options">
      ${p.opcoes.map(op => `
        <button class="pesq-opt checkbox ${selecionados.includes(op) ? 'selected' : ''}"
          onclick="toggleCheck('${p.id}','${op.replace(/'/g,"\\'")}',this)">
          <span class="pesq-opt-dot"></span>
          <span>${op}</span>
        </button>`).join('')}
    </div>`;

  } else if (p.tipo === 'radio') {
    corpo = `<div class="pesq-options">
      ${p.opcoes.map(op => `
        <button class="pesq-opt ${val === op ? 'selected' : ''}"
          onclick="escolher('${p.id}','${op.replace(/'/g,"\\'")}')">
          <span class="pesq-opt-dot"></span>
          <span>${op}</span>
        </button>`).join('')}
    </div>`;

  } else if (p.tipo === 'escala') {
    corpo = `
      <div class="pesq-scale">
        ${Array.from({length:11},(_,i) => `
          <button class="pesq-scale-btn ${val === i ? 'selected' : ''}"
            onclick="escolherNota(${i})">${i}</button>`).join('')}
      </div>
      <div class="pesq-scale-labels">
        <span>Nenhum apoio</span>
        <span>Apoio total</span>
      </div>`;

  } else if (p.tipo === 'texto') {
    corpo = `<textarea class="pesq-textarea" id="txt_${p.id}"
      placeholder="Digite sua sugestão aqui…"
      oninput="respostas['${p.id}']=this.value"
    >${val || ''}</textarea>`;
  }

  document.getElementById('root').innerHTML = `
    <div class="pesquisa-wrap">
      <div class="pesq-progress">
        <div class="pesq-prog-label">
          <span>Pergunta <strong>${etapa}</strong> de ${TOTAL}</span>
          <span><strong>${pct}%</strong> concluído</span>
        </div>
        <div class="pesq-prog-bar">
          <div class="pesq-prog-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="pesq-card">
        <div class="pesq-step">
          <i data-lucide="help-circle" style="width:12px;height:12px"></i>
          Pergunta ${etapa} de ${TOTAL}
        </div>
        <p class="pesq-question">${p.pergunta}</p>
        ${p.hint ? `<p class="pesq-hint">${p.hint}</p>` : ''}
        ${corpo}

        <div class="pesq-nav">
          ${etapa > 1
            ? `<button class="btn btn-secondary" onclick="voltar()">
                <i data-lucide="arrow-left" style="width:15px;height:15px"></i> Voltar
               </button>`
            : '<div></div>'}
          <div class="pesq-nav-right">
            ${p.tipo === 'texto' || p.tipo === 'escala'
              ? `<button class="btn btn-secondary" onclick="pularPergunta()">Pular</button>`
              : ''}
            <button class="btn btn-primary" onclick="avancar()" id="btnAvancar">
              ${etapa === TOTAL ? 'Enviar pesquisa' : 'Próxima'}
              <i data-lucide="${etapa === TOTAL ? 'send' : 'arrow-right'}" style="width:15px;height:15px"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  lucide?.createIcons();
}

// ── INTERAÇÕES ───────────────────────────────────────
function escolher(id, valor) {
  respostas[id] = valor;
  renderPergunta();
}

function escolherNota(n) {
  respostas['nota_saude'] = n;
  renderPergunta();
}

function toggleCheck(id, valor, btn) {
  if (!Array.isArray(respostas[id])) respostas[id] = [];
  const idx = respostas[id].indexOf(valor);
  if (idx === -1) {
    respostas[id].push(valor);
    btn.classList.add('selected');
  } else {
    respostas[id].splice(idx, 1);
    btn.classList.remove('selected');
  }
}

function pularPergunta() {
  etapa++;
  if (etapa > TOTAL) enviar();
  else renderPergunta();
}

function voltar() {
  etapa--;
  if (etapa < 1) etapa = 1;
  renderPergunta();
}

function avancar() {
  const p = PERGUNTAS[etapa - 1];

  // Validações obrigatórias (exceto texto e escala)
  if (p.tipo === 'radio' && !respostas[p.id]) {
    toast('Selecione uma opção para continuar.', 'err'); return;
  }
  if (p.tipo === 'checkbox' && (!respostas[p.id] || respostas[p.id].length === 0)) {
    toast('Selecione pelo menos uma opção.', 'err'); return;
  }

  if (etapa === TOTAL) {
    enviar();
  } else {
    etapa++;
    renderPergunta();
  }
}

// ── ENVIO ────────────────────────────────────────────
async function enviar() {
  const btn = document.getElementById('btnAvancar');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" style="width:15px;height:15px;animation:spin .7s linear infinite"></i> Enviando…'; }

  const payload = {
    ferramentas_usadas: respostas.ferramentas_usadas || [],
    ferramenta_favorita: respostas.ferramenta_favorita || null,
    informacoes_uteis: respostas.informacoes_uteis || null,
    facil_navegar: respostas.facil_navegar || null,
    nota_saude: respostas.nota_saude != null ? respostas.nota_saude : null,
    aprendeu_algo: respostas.aprendeu_algo || null,
    usaria_novamente: respostas.usaria_novamente || null,
    sugestoes: respostas.sugestoes || null,
  };

  const { error } = await supa.from('pesquisa_respostas').insert([payload]);

  if (error) {
    toast('Erro ao enviar. Tente novamente.', 'err');
    if (btn) { btn.disabled = false; btn.innerHTML = 'Enviar pesquisa <i data-lucide="send"></i>'; }
    return;
  }

  renderAgradecimento();
}

// ── AGRADECIMENTO + CARREGA GRÁFICOS ────────────────
function renderAgradecimento() {
  document.getElementById('root').innerHTML = `
    <div class="pesquisa-wrap pesq-result">
      <div class="pesq-result-hero">
        <div class="pesq-result-ring">
          <i data-lucide="check-circle" style="width:44px;height:44px"></i>
        </div>
        <h2 class="pesq-result-title">Obrigado pela sua resposta!</h2>
        <p class="pesq-result-sub">
          Sua opinião é fundamental para continuar melhorando o Sobral Cultural.
          Veja abaixo como os outros usuários responderam.
        </p>
      </div>

      <div id="graficos">
        <div class="pesq-chart-loading">
          <div class="lsp" style="margin:0 auto 12px"></div>
          Carregando resultados…
        </div>
      </div>

      <div style="text-align:center;margin-top:28px">
        <a href="index.html" class="btn btn-primary">
          <i data-lucide="map" style="width:15px;height:15px"></i>
          Explorar o mapa
        </a>
      </div>
    </div>`;

  lucide?.createIcons();
  carregarGraficos();
}

// ── VER RESULTADOS (sem responder) ───────────────────
async function verResultados() {
  document.getElementById('root').innerHTML = `
    <div class="pesquisa-wrap pesq-result">
      <div class="pesq-result-hero">
        <div class="pesq-result-ring" style="background:rgba(200,135,26,.12);border-color:rgba(200,135,26,.35);color:var(--gold)">
          <i data-lucide="bar-chart-2" style="width:44px;height:44px"></i>
        </div>
        <h2 class="pesq-result-title">Resultados da Pesquisa</h2>
        <p class="pesq-result-sub">Veja como os usuários do Sobral Cultural responderam até agora.</p>
      </div>
      <div id="graficos">
        <div class="pesq-chart-loading">
          <div class="lsp" style="margin:0 auto 12px"></div>
          Carregando resultados…
        </div>
      </div>
      <div style="text-align:center;margin-top:28px">
        <button class="btn btn-secondary" onclick="renderHub()">
          <i data-lucide="arrow-left" style="width:15px;height:15px"></i>
          Voltar
        </button>
        <button class="btn btn-primary" onclick="comecar()" style="margin-left:10px">
          <i data-lucide="clipboard-list" style="width:15px;height:15px"></i>
          Responder pesquisa
        </button>
      </div>
    </div>`;

  lucide?.createIcons();
  carregarGraficos();
}

// ── CARREGA E RENDERIZA GRÁFICOS ─────────────────────
async function carregarGraficos() {
  const { data, error } = await supa.from('pesquisa_respostas').select('*');

  if (error || !data || data.length === 0) {
    document.getElementById('graficos').innerHTML =
      `<p style="text-align:center;color:var(--muted);padding:24px;font-size:13px">Ainda não há respostas suficientes para exibir os gráficos.</p>`;
    return;
  }

  const total = data.length;

  // ── Funções auxiliares ──
  function contarOpcoes(campo, opcoes) {
    const mapa = {};
    opcoes.forEach(o => mapa[o] = 0);
    data.forEach(r => {
      const v = r[campo];
      if (Array.isArray(v)) v.forEach(x => { if (mapa[x] != null) mapa[x]++; });
      else if (v && mapa[v] != null) mapa[v]++;
    });
    return mapa;
  }

  function barras(mapa, colorClass = '') {
    const totalResps = Object.values(mapa).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => {
        const pct = Math.round((count / totalResps) * 100);
        return `
          <div class="pesq-bar-row">
            <span class="pesq-bar-label" title="${label}">${label}</span>
            <div class="pesq-bar-track">
              <div class="pesq-bar-fill ${colorClass}" style="width:${pct}%"></div>
            </div>
            <span class="pesq-bar-pct">${pct}%</span>
          </div>`;
      }).join('');
  }

  // ── Nota média ──
  const notas = data.map(r => r.nota_saude).filter(n => n != null);
  const notaMedia = notas.length ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1) : '—';

  // ── Ferramentas mais usadas ──
  const ferrUsadas = contarOpcoes('ferramentas_usadas', FERRAMENTAS);
  const ferrFav    = contarOpcoes('ferramenta_favorita', FERRAMENTAS);
  const infoUteis  = contarOpcoes('informacoes_uteis', ['Sim','Em partes','Não']);
  const facilNav   = contarOpcoes('facil_navegar', ['Sim','Parcialmente','Não']);
  const aprendeu   = contarOpcoes('aprendeu_algo', ['Sim','Não','Não tenho certeza']);
  const usaria     = contarOpcoes('usaria_novamente', ['Sim','Não','Talvez']);

  // ── Sugestões recentes ──
  const sugestoes = data
    .filter(r => r.sugestoes && r.sugestoes.trim().length > 5)
    .slice(-6)
    .reverse();

  document.getElementById('graficos').innerHTML = `
    <div class="pesq-charts">

      <div style="text-align:center;margin-bottom:8px">
        <div class="pesq-total-badge">
          <i data-lucide="users" style="width:14px;height:14px"></i>
          ${total} resposta${total !== 1 ? 's' : ''} recebida${total !== 1 ? 's' : ''}
        </div>
      </div>

      <!-- Nota média -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="star"></i>
          Nota média como ferramenta de saúde e bem-estar
        </div>
        <div class="pesq-nota-destaque">
          <div class="pesq-nota-num">${notaMedia}</div>
          <div class="pesq-nota-label">média em uma escala de 0 a 10 · ${notas.length} resposta${notas.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Ferramentas usadas -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="wrench"></i>
          Ferramentas mais utilizadas
        </div>
        ${barras(ferrUsadas, '')}
      </div>

      <!-- Ferramenta favorita -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="heart"></i>
          Ferramenta preferida
        </div>
        ${barras(ferrFav, 'gold')}
      </div>

      <!-- Informações úteis -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="check-circle"></i>
          As informações foram úteis?
        </div>
        ${barras(infoUteis, 'green')}
      </div>

      <!-- Fácil de navegar -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="navigation"></i>
          O site é fácil de navegar?
        </div>
        ${barras(facilNav, 'green')}
      </div>

      <!-- Aprendeu algo -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="book-open"></i>
          Aprendeu algo novo com o site?
        </div>
        ${barras(aprendeu, '')}
      </div>

      <!-- Usaria novamente -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="refresh-cw"></i>
          Usaria novamente ou recomendaria?
        </div>
        ${barras(usaria, 'gold')}
      </div>

      ${sugestoes.length ? `
      <!-- Sugestões -->
      <div class="pesq-chart-card">
        <div class="pesq-chart-title">
          <i data-lucide="message-square"></i>
          Sugestões recentes de melhoria
        </div>
        <div class="pesq-sugestoes">
          ${sugestoes.map(r => `
            <div class="pesq-sugestao-item">"${r.sugestoes}"</div>
          `).join('')}
        </div>
      </div>` : ''}

    </div>`;

  lucide?.createIcons();
}

// ── INIT ─────────────────────────────────────────────
renderHub();
