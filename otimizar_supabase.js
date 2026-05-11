#!/usr/bin/env node
/**
 * otimizar_supabase.js — Otimizador de Imagens do Supabase Storage
 * ─────────────────────────────────────────────────────────────────
 * O que faz:
 *   1. Lista todas as imagens do bucket "spots-photos"
 *   2. Baixa cada imagem
 *   3. Converte para WebP (max 1000px largura, qualidade 80%)
 *   4. Faz re-upload no mesmo bucket com extensão .webp
 *   5. Atualiza as URLs nas tabelas "spots" e "news" do banco
 *   6. Remove o arquivo original (opcional — pergunta antes)
 *
 * Uso:
 *   1. Copie .env.example para .env e cole sua service_role key
 *   2. node otimizar_supabase.js
 *   3. node otimizar_supabase.js --dry-run   (simula sem alterar nada)
 *   4. node otimizar_supabase.js --no-delete  (mantém arquivos originais)
 */

const fs      = require('fs');
const path    = require('path');
const https   = require('https');
const http    = require('http');

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL    = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const BUCKET          = 'spots-photos';
const MAX_WIDTH       = 1000;   // px
const QUALITY         = 80;     // %
const TMP_DIR         = path.join(__dirname, '.tmp_img_convert');
const DRY_RUN         = process.argv.includes('--dry-run');
const NO_DELETE       = process.argv.includes('--no-delete');
const EXTENSIONS_OK   = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];

// ── Lê .env manual (sem dependência de dotenv) ────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('\n❌ Arquivo .env não encontrado!');
    console.error('   Copie .env.example para .env e cole sua service_role key.\n');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
}

// ── Instala dependências se necessário ───────────────────────────────────────
async function ensureDeps() {
  const deps = ['@supabase/supabase-js', 'sharp'];
  for (const dep of deps) {
    try { require(dep); }
    catch {
      console.log(`📦 Instalando ${dep}...`);
      const { execSync } = require('child_process');
      execSync(`npm install ${dep}`, { stdio: 'inherit', cwd: __dirname });
    }
  }
}

// ── Download de URL para arquivo ──────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} ao baixar ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

// ── Formata bytes ─────────────────────────────────────────────────────────────
function fmt(b) {
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)}KB`;
  return `${(b/1048576).toFixed(2)}MB`;
}

// ── Lista recursiva de arquivos no bucket ─────────────────────────────────────
async function listAllFiles(storage, prefix = '') {
  const { data, error } = await storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`Erro ao listar bucket: ${error.message}`);
  let files = [];
  for (const item of (data || [])) {
    if (item.metadata) {
      // É um arquivo
      files.push({ name: item.name, path: prefix ? `${prefix}/${item.name}` : item.name });
    } else {
      // É uma pasta — recursão
      const sub = await listAllFiles(storage, prefix ? `${prefix}/${item.name}` : item.name);
      files = files.concat(sub);
    }
  }
  return files;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  await ensureDeps();

  const { createClient } = require('@supabase/supabase-js');
  const sharp = require('sharp');

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SERVICE_KEY || SERVICE_KEY === 'cole_aqui_sua_service_role_key') {
    console.error('\n❌ SUPABASE_SERVICE_KEY não definida no .env!\n');
    process.exit(1);
  }

  // Cliente admin (service_role) para operações de escrita
  const supa  = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });

  console.log('\n🗄️  Sobral Cultural — Otimizador de Imagens Supabase');
  console.log('══════════════════════════════════════════════════════');
  if (DRY_RUN) console.log('⚠️  MODO DRY-RUN — nenhuma alteração será feita\n');
  console.log(`📦 Bucket: ${BUCKET}`);
  console.log(`🎚️  Qualidade: ${QUALITY}%  |  Largura máx: ${MAX_WIDTH}px\n`);

  // Cria pasta temporária
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  // Lista arquivos
  console.log('🔍 Listando arquivos no bucket...');
  const allFiles = await listAllFiles(supa.storage);

  // Filtra apenas imagens que precisam de conversão
  const toConvert = allFiles.filter(f => {
    const ext = path.extname(f.name).toLowerCase();
    return EXTENSIONS_OK.includes(ext);
  });

  if (!toConvert.length) {
    console.log('✅ Nenhuma imagem JPG/PNG encontrada — tudo já está em WebP!');
    return;
  }

  console.log(`📷 ${toConvert.length} imagem(ns) para converter (de ${allFiles.length} arquivos total)\n`);

  let converted = 0, skipped = 0, errors = 0;
  let totalBefore = 0, totalAfter = 0;
  const urlMap = {}; // old_url → new_url

  for (let i = 0; i < toConvert.length; i++) {
    const file    = toConvert[i];
    const ext     = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext);
    const folder   = path.dirname(file.path) === '.' ? '' : path.dirname(file.path);
    const newName  = baseName + '.webp';
    const newPath  = folder ? `${folder}/${newName}` : newName;

    // URL pública original
    const { data: urlData } = supa.storage.from(BUCKET).getPublicUrl(file.path);
    const oldUrl = urlData.publicUrl;

    // URL pública nova (WebP)
    const { data: newUrlData } = supa.storage.from(BUCKET).getPublicUrl(newPath);
    const newUrl = newUrlData.publicUrl;

    const progress = `[${String(i+1).padStart(2)}/${toConvert.length}]`;
    process.stdout.write(`${progress} ${file.path.substring(0, 45).padEnd(45)}`);

    try {
      const tmpInput  = path.join(TMP_DIR, `input_${i}${ext}`);
      const tmpOutput = path.join(TMP_DIR, `output_${i}.webp`);

      // 1. Baixa
      await downloadFile(oldUrl, tmpInput);
      const sizeBefore = fs.statSync(tmpInput).size;

      // 2. Converte
      const meta = await sharp(tmpInput).metadata();
      let pipeline = sharp(tmpInput);
      if (meta.width > MAX_WIDTH) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(tmpOutput);
      const sizeAfter = fs.statSync(tmpOutput).size;

      const saved = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
      totalBefore += sizeBefore;
      totalAfter  += sizeAfter;

      if (!DRY_RUN) {
        // 3. Upload WebP
        const webpBuffer = fs.readFileSync(tmpOutput);
        const { error: upErr } = await supa.storage.from(BUCKET).upload(newPath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
        });
        if (upErr) throw new Error(`Upload falhou: ${upErr.message}`);

        // 4. Remove original (se diferente do novo nome)
        if (!NO_DELETE && file.path !== newPath) {
          await supa.storage.from(BUCKET).remove([file.path]);
        }

        // Registra mapeamento de URL
        urlMap[oldUrl] = newUrl;
      }

      // Limpa tmp
      fs.unlink(tmpInput, () => {});
      fs.unlink(tmpOutput, () => {});

      console.log(` ✅ ${fmt(sizeBefore)} → ${fmt(sizeAfter)} (-${saved}%)`);
      converted++;

    } catch (e) {
      console.log(` ❌ ${e.message}`);
      errors++;
    }
  }

  // ── Atualiza URLs no banco ─────────────────────────────────────────────────
  if (!DRY_RUN && Object.keys(urlMap).length > 0) {
    console.log('\n🗃️  Atualizando URLs no banco de dados...');

    // Tabela spots → coluna photo
    const { data: spots } = await supa.from('spots').select('id, photo');
    let spotsUpdated = 0;
    for (const spot of (spots || [])) {
      if (spot.photo && urlMap[spot.photo]) {
        await supa.from('spots').update({ photo: urlMap[spot.photo] }).eq('id', spot.id);
        spotsUpdated++;
      }
    }
    console.log(`   ✅ spots.photo: ${spotsUpdated} registro(s) atualizado(s)`);

    // Tabela news → coluna cover_image
    const { data: news } = await supa.from('news').select('id, cover_image');
    let newsUpdated = 0;
    for (const n of (news || [])) {
      if (n.cover_image && urlMap[n.cover_image]) {
        await supa.from('news').update({ cover_image: urlMap[n.cover_image] }).eq('id', n.id);
        newsUpdated++;
      }
    }
    console.log(`   ✅ news.cover_image: ${newsUpdated} registro(s) atualizado(s)`);
  }

  // ── Relatório final ────────────────────────────────────────────────────────
  const totalSaved = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : '0';

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`🏆 Resultado: ${converted} convertida(s), ${skipped} ignorada(s), ${errors} erro(s)`);
  if (totalBefore > 0)
    console.log(`💾 Economia: ${fmt(totalBefore)} → ${fmt(totalAfter)} (${totalSaved}% menor)`);
  if (DRY_RUN)
    console.log('\n⚠️  DRY-RUN: nenhuma alteração foi feita. Rode sem --dry-run para aplicar.');
  console.log('');

  // Remove pasta tmp
  try { fs.rmdirSync(TMP_DIR); } catch {}
}

main().catch(e => {
  console.error('\n❌ Erro fatal:', e.message);
  process.exit(1);
});
