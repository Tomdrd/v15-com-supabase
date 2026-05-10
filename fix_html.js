const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');

const fontPreloadStr = `  <!-- Google Fonts — não bloqueante -->
  <link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"></noscript>`;

const localCssStr = `  <!-- CSS local -->
  <link rel="stylesheet" href="topbar.css">
  <link rel="stylesheet" href="icons.css">`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove ANY existing google fonts lines, preloads, noscripts related to fonts, topbar.css, icons.css
  content = content.replace(/<link rel="preload" as="style" onload="this\.onload=null;this\.rel='stylesheet'" href="https:\/\/fonts\.googleapis\.com[^>]+>/g, '');
  content = content.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/g, '');
  content = content.replace(/<noscript>[\s\n]*<\/noscript>/g, '');
  // Specifically remove those badly nested ones
  content = content.replace(/<noscript>.*?<\/noscript>/gs, match => {
    if (match.includes('fonts.googleapis.com') || match.includes('topbar.css') || match.includes('icons.css')) {
      return '';
    }
    return match;
  });
  // Also remove standalone
  content = content.replace(/<link rel="stylesheet" href="topbar\.css">\s*/g, '');
  content = content.replace(/<link rel="stylesheet" href="icons\.css">\s*/g, '');
  // And remove the "CSS global (evita FOUC com head.js defer)" comments
  content = content.replace(/<!-- CSS global.*?-->/g, '');
  content = content.replace(/<!-- Google Fonts.*?-->/g, '');
  content = content.replace(/<noscript>\s*<noscript>/g, '');
  content = content.replace(/<\/noscript>\s*<\/noscript>/g, '');
  content = content.replace(/<noscript>\s*/g, '<noscript>');

  // Clean up multiple blank lines in head
  content = content.replace(/(\n\s*){3,}/g, '\n\n');

  // Insert standard font and local CSS
  // We'll insert it right before the first local CSS or script tag or closing head
  const insertIndex = content.indexOf('</head>');
  if (insertIndex !== -1) {
    const toInsert = `\n${fontPreloadStr}\n\n${localCssStr}\n`;
    content = content.slice(0, insertIndex) + toInsert + content.slice(insertIndex);
  }

  // 2. Fix images width/height
  content = content.replace(/<img src="logo\.png" alt="Sobral Cultural" class="([^"]*)">/g, 
    '<img src="logo.png" alt="Sobral Cultural" width="142" height="40" class="$1">');
  content = content.replace(/<img src="logo\.png" alt="Sobral Cultural" class="tb-logo-img">/g, 
    '<img src="logo.png" alt="Sobral Cultural" width="142" height="40" class="tb-logo-img">');
  // Some files might have different classes like "logo-img tb-logo-img"
  content = content.replace(/<img src="logo\.png" alt="Sobral Cultural" class="logo-img tb-logo-img">/g, 
    '<img src="logo.png" alt="Sobral Cultural" width="142" height="40" class="logo-img tb-logo-img">');
  // Also just match any logo.png missing width
  content = content.replace(/<img src="logo\.png"([^>]*)>/g, (match, p1) => {
    if (!p1.includes('width=')) {
      return `<img src="logo.png" width="142" height="40"${p1}>`;
    }
    return match;
  });

  // 3. Fix button aria-labels
  content = content.replace(/<button class="hbg"([^>]*)>/g, (match, p1) => {
    if (!p1.includes('aria-label=')) {
      return `<button class="hbg" aria-label="Abrir menu de navegação"${p1}>`;
    }
    return match;
  });

  content = content.replace(/<button class="btn-geo"([^>]*)>/g, (match, p1) => {
    if (!p1.includes('aria-label=')) {
      return `<button class="btn-geo" aria-label="Localização"${p1}>`;
    }
    return match;
  });

  // 4. Update head.js directly in JS file? No, we will do head.js separately.
  
  fs.writeFileSync(file, content);
}
console.log('HTML files fixed.');
