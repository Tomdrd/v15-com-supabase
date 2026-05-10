#!/usr/bin/env node
/**
 * converter_webp.js — Conversor em lote para WebP
 * Uso: node converter_webp.js [pasta] [qualidade]
 *
 * Exemplo:
 *   node converter_webp.js .            → converte imagens na pasta atual
 *   node converter_webp.js ./fotos 80   → converte com qualidade 80
 *
 * - Converte JPG, JPEG e PNG para WebP
 * - Redimensiona para máx. 1200px de largura (mantém proporção)
 * - Salva na subpasta "webp_output/" sem sobrescrever originais
 * - Exibe tamanho antes/depois e economia em %
 */

const fs   = require('fs');
const path = require('path');

// ── Configurações ─────────────────────────────────────────────────────────────
const TARGET_DIR  = process.argv[2] || '.';
const QUALITY     = parseInt(process.argv[3] || '80', 10);
const MAX_WIDTH   = 1200;   // px — redimensiona se a imagem for maior
const OUTPUT_DIR  = path.join(TARGET_DIR, 'webp_output');
const EXTENSIONS  = ['.jpg', '.jpeg', '.png'];

// ── Instala sharp se necessário ───────────────────────────────────────────────
async function ensureSharp() {
  try {
    require('sharp');
    return true;
  } catch {
    console.log('\n📦 Instalando dependência "sharp"...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: __dirname });
      return true;
    } catch (e) {
      console.error('❌ Falha ao instalar sharp. Tente manualmente: npm install sharp');
      process.exit(1);
    }
  }
}

// ── Formata bytes legível ─────────────────────────────────────────────────────
function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

// ── Barra de progresso simples ────────────────────────────────────────────────
function bar(pct) {
  const filled = Math.round(pct / 5);
  return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + ']';
}

// ── Conversão de uma imagem ───────────────────────────────────────────────────
async function convertImage(sharp, inputPath, outputPath) {
  const img = sharp(inputPath);
  const meta = await img.metadata();

  let pipeline = img;

  // Redimensiona apenas se for maior que MAX_WIDTH
  if (meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outputPath);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await ensureSharp();
  const sharp = require('sharp');

  // Valida pasta de entrada
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`❌ Pasta não encontrada: ${TARGET_DIR}`);
    process.exit(1);
  }

  // Cria pasta de saída
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Coleta arquivos (apenas nível raiz — sem recursão)
  const files = fs.readdirSync(TARGET_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return EXTENSIONS.includes(ext) && fs.statSync(path.join(TARGET_DIR, f)).isFile();
  });

  if (!files.length) {
    console.log(`\n⚠️  Nenhuma imagem JPG/PNG encontrada em: ${path.resolve(TARGET_DIR)}\n`);
    process.exit(0);
  }

  console.log(`\n🖼️  Sobral Cultural — Conversor WebP`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📁 Pasta:    ${path.resolve(TARGET_DIR)}`);
  console.log(`📤 Saída:    ${path.resolve(OUTPUT_DIR)}`);
  console.log(`🎚️  Qualidade: ${QUALITY}%  |  Largura máx: ${MAX_WIDTH}px`);
  console.log(`📷 Imagens:  ${files.length} arquivo(s)\n`);

  let totalOriginal = 0, totalConverted = 0, errors = 0;
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file      = files[i];
    const inputPath  = path.join(TARGET_DIR, file);
    const baseName   = path.basename(file, path.extname(file));
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.webp`);

    const pct = Math.round(((i) / files.length) * 100);
    process.stdout.write(`\r${bar(pct)} ${pct}% — ${file.padEnd(30)}`);

    try {
      const sizeBefore = fs.statSync(inputPath).size;
      await convertImage(sharp, inputPath, outputPath);
      const sizeAfter  = fs.statSync(outputPath).size;
      const saved      = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);

      totalOriginal  += sizeBefore;
      totalConverted += sizeAfter;

      results.push({ file, sizeBefore, sizeAfter, saved: parseInt(saved), ok: true });
    } catch (e) {
      errors++;
      results.push({ file, ok: false, error: e.message });
    }
  }

  // Limpa linha de progresso
  process.stdout.write(`\r${bar(100)} 100% — Concluído!                          \n\n`);

  // ── Relatório ──────────────────────────────────────────────────────────────
  console.log('Resultado por arquivo:');
  console.log('─'.repeat(65));

  for (const r of results) {
    if (!r.ok) {
      console.log(`  ❌  ${r.file.padEnd(30)} ERRO: ${r.error}`);
      continue;
    }
    const status = r.saved > 0 ? '✅' : '⚠️ ';
    const arrow  = r.saved > 0 ? `${fmt(r.sizeBefore)} → ${fmt(r.sizeAfter)}` : `${fmt(r.sizeBefore)} → ${fmt(r.sizeAfter)} (sem ganho)`;
    console.log(`  ${status}  ${r.file.padEnd(32)} ${arrow.padEnd(25)} ${r.saved > 0 ? `-${r.saved}%` : '  0%'}`);
  }

  const totalSaved = ((1 - totalConverted / totalOriginal) * 100).toFixed(1);
  const economiaBytes = totalOriginal - totalConverted;

  console.log('─'.repeat(65));
  console.log(`\n🏆 Economia total: ${fmt(totalOriginal)} → ${fmt(totalConverted)} (${totalSaved}% menor, economizou ${fmt(economiaBytes)})`);
  if (errors) console.log(`⚠️  ${errors} arquivo(s) com erro.`);
  console.log(`\n📂 Arquivos WebP salvos em: ${path.resolve(OUTPUT_DIR)}/`);
  console.log('\n💡 Próximo passo:');
  console.log('   Substitua as imagens originais do Supabase pelas versões WebP desta pasta.');
  console.log('   Você pode fazer o upload direto pelo Painel Admin do Supabase Storage.\n');
}

main().catch(e => {
  console.error('\n❌ Erro inesperado:', e.message);
  process.exit(1);
});
