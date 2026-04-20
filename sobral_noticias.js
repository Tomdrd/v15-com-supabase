// ── Credenciais Supabase ──────────────────────────────────────────────────────
const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = supabase.createClient(SU, SK);

// ── Ícones Lucide por categoria ───────────────────────────────────────────────
const CAT_ICON = {
  evento:      'calendar',
  cultura:     'landmark',
  musica:      'music',
  gastronomia: 'utensils',
  turismo:     'compass',
};

// ── Estado ────────────────────────────────────────────────────────────────────
let allNews = [];
let currentCat = 'todos';
let currentSearch = '';
let detailOpen = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toggleDrw() { ['hbg','drw','dov'].forEach(id => document.getElementById(id).classList.toggle('open')); }
function closeDrw()  { ['hbg','drw','dov'].forEach(id => document.getElementById(id).classList.remove('open')); }

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return 'agora';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

function iconForCat(cat) { return CAT_ICON[cat] || 'file-text'; }

function tagClass(cat) {
  const map = { evento:'tag-evento', cultura:'tag-cultura', turismo:'tag-turismo', gastronomia:'tag-gastronomia', musica:'tag-musica' };
  return map[cat] || 'tag-cultura';
}
function icoClass(cat) {
  const map = { evento:'ico-evento', cultura:'ico-cultura', turismo:'ico-turismo', gastronomia:'ico-gastronomia', musica:'ico-musica' };
  return map[cat] || 'ico-cultura';
}

// ── Busca/filtro ──────────────────────────────────────────────────────────────
function filterNews() {
  currentSearch = document.getElementById('searchInput').value.toLowerCase().trim();
  document.getElementById('searchClear').style.display = currentSearch ? 'flex' : 'none';
  renderGrid();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentSearch = '';
  document.getElementById('searchClear').style.display = 'none';
  renderGrid();
}

// ── Filtro por categoria (pills do hero) ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroFilters')?.addEventListener('click', e => {
    const btn = e.target.closest('.hpill');
    if (!btn) return;
    document.querySelectorAll('.hpill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    renderGrid();
  });
});

// ── Render do grid ────────────────────────────────────────────────────────────
function renderGrid() {
  const grid   = document.getElementById('newsGrid');
  const empty  = document.getElementById('emptyState');
  const meta   = document.getElementById('searchMeta');

  let filtered = allNews;
  if (currentCat !== 'todos') {
    filtered = filtered.filter(n => n.cat === currentCat);
  }
  if (currentSearch) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(currentSearch) ||
      (n.summary || '').toLowerCase().includes(currentSearch)
    );
  }

  meta.textContent = filtered.length > 0 ? `${filtered.length} notícia${filtered.length !== 1 ? 's' : ''}` : '';

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map((n, i) => `
    <div class="news-card" onclick="openDetail(${JSON.stringify(n.id)})"
         style="animation-delay:${i * 0.05}s">

      ${n.image_url ? `
        <div class="card-img-wrap" style="
          height:140px;border-radius:9px;overflow:hidden;
          background:var(--panel);margin:-4px -4px 0">
          <img src="${n.image_url}" alt="${n.title}"
               style="width:100%;height:100%;object-fit:cover;display:block"
               onerror="this.parentElement.style.display='none'">
        </div>` : `
        <div class="card-icon-wrap ${icoClass(n.cat)}">
          <i data-lucide="${iconForCat(n.cat)}"></i>
        </div>`
      }

      <span class="card-tag ${tagClass(n.cat)}">
        <i data-lucide="${iconForCat(n.cat)}" style="width:10px;height:10px"></i>
        ${n.tag}
      </span>

      <div class="card-content">
        <div class="card-title">${n.title}</div>
        <div class="card-summary">${n.summary || ''}</div>
      </div>

      <div class="card-footer">
        <span class="card-source">${n.source || ''}</span>
        <span class="card-time">${n.time || timeAgo(n.published_at)}</span>
      </div>

      <div class="card-read-more">
        <i data-lucide="arrow-right" style="width:12px;height:12px"></i>
        Ler mais
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Detalhe da notícia ────────────────────────────────────────────────────────
function openDetail(id) {
  const n = allNews.find(x => x.id === id);
  if (!n) return;

  const grid      = document.getElementById('newsGrid');
  const detail    = document.getElementById('newsDetail');
  const body      = document.getElementById('detailBody');
  const searchBar = document.querySelector('.search-bar');
  const heroFilters = document.querySelector('.hero-filters');

  const longText = (n.long || n.summary || '')
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  // Monta imagem de cabeçalho se disponível
  const headerImage = n.image_url ? `
    <div style="
      border-radius:14px;overflow:hidden;
      max-height:320px;margin-bottom:24px;
      background:var(--panel)">
      <img src="${n.image_url}" alt="${n.title}"
           style="width:100%;height:100%;object-fit:cover;display:block;max-height:320px"
           onerror="this.parentElement.style.display='none'">
    </div>` : '';

  body.innerHTML = `
    ${headerImage}

    <div class="detail-header">
      <div class="detail-icon-wrap ${icoClass(n.cat)}">
        <i data-lucide="${iconForCat(n.cat)}"></i>
      </div>
      <div class="detail-meta">
        <span class="detail-tag ${tagClass(n.cat)}">${n.tag}</span>
        <h1 class="detail-title">${n.title}</h1>
        <div class="detail-byline">
          <div class="detail-source-info">
            <i data-lucide="newspaper" style="width:13px;height:13px"></i>
            <span>${n.source || ''}</span>
          </div>
          <div class="detail-source-info">
            <i data-lucide="clock" style="width:13px;height:13px"></i>
            <span>${n.time || timeAgo(n.published_at)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-short">
      <div class="detail-short-label">
        <i data-lucide="zap" style="width:12px;height:12px"></i>
        Resumo rápido
      </div>
      <div class="detail-short-text">${n.summary || ''}</div>
    </div>

    <div class="detail-divider"></div>

    <div class="detail-long-label">
      <i data-lucide="align-left" style="width:12px;height:12px"></i>
      Texto completo
    </div>
    <div class="detail-long-text">${longText}</div>

    <div class="detail-credits">
      <i data-lucide="info" class="detail-credits-icon" style="width:15px;height:15px"></i>
      <div class="detail-credits-text">
        <div class="detail-credits-title">Fonte original</div>
        <div class="detail-credits-detail">
          ${n.source_url
            ? `Notícia publicada por <strong style="color:rgba(245,237,216,.6)">${n.source}</strong>.
               <a href="${n.source_url}" target="_blank" rel="noopener noreferrer"
                  style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;
                         color:var(--ochre);font-size:12px;text-decoration:none">
                 <i data-lucide="external-link" style="width:12px;height:12px"></i>
                 Acessar matéria original
               </a>`
            : `Notícia publicada por <strong style="color:rgba(245,237,216,.6)">${n.source || 'fonte desconhecida'}</strong>.`
          }
          <br><span style="color:rgba(245,237,216,.2);font-size:11px">
            Texto expandido gerado por IA com base no conteúdo original.
          </span>
        </div>
      </div>
    </div>
  `;

  grid.style.display    = 'none';
  searchBar.style.display = 'none';
  heroFilters.style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  detail.style.display  = 'block';
  detailOpen = true;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

function closeDetail() {
  document.getElementById('newsDetail').style.display = 'none';
  document.getElementById('newsGrid').style.display = 'grid';
  document.querySelector('.search-bar').style.display = 'flex';
  document.querySelector('.hero-filters').style.display = 'flex';
  detailOpen = false;
  if (window.lucide) lucide.createIcons();
}

// ── Estado vazio (banco sem dados ainda) ──────────────────────────────────────
function showEmptyDb() {
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = `
    <div style="
      grid-column:1/-1;text-align:center;padding:60px 20px;
      color:rgba(245,237,216,.3);display:flex;flex-direction:column;
      align-items:center;gap:12px">
      <i data-lucide="rss" style="width:40px;height:40px;stroke-width:1;opacity:.3"></i>
      <p style="font-size:16px;color:rgba(245,237,216,.4)">Nenhuma notícia ainda</p>
      <span style="font-size:13px">
        Execute a Edge Function <strong>fetch-news</strong> no painel do Supabase
        para carregar as primeiras notícias.
      </span>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  try {
    const { data, error } = await supa
      .from('news_summaries')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (data && data.length > 0) {
      allNews = data.map(n => ({
        ...n,
        time: timeAgo(n.published_at),
      }));
      renderGrid();
    } else {
      showEmptyDb();
    }
  } catch (err) {
    console.error('[news] erro ao carregar:', err);
    showEmptyDb();
  }
});
