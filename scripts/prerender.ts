import * as fs from 'fs';
import * as path from 'path';
import { modules } from '../src/data/modules';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"');

let generatedCount = 0;

for (const mod of modules) {
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const seoText = mod.content.replace(/\[\[.*?\]\]/g, '').slice(0, 500) + '...';

  let modHtml = subDirTemplateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${mod.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>`)
    .replace('<meta name="description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${mod.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />`)
    .replace('<meta property="og:description" content="メンタルヘルスマネジメント検定Ⅲ種対策サイト。ストレス・セルフケア・メンタルヘルス不調をわかりやすく解説。" />', `<meta property="og:description" content="${mod.description}" />`);

  const seoDataHtml = `<noscript id="seo-data">
    <h1>${mod.title}</h1>
    <p>${seoText}</p>
  </noscript>`;

  modHtml = modHtml.replace('<body>', `<body>\n    ${seoDataHtml}`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

const staticPages = ['glossary', 'privacy', 'about', 'guide'];
for (const page of staticPages) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  let title = '';
  switch (page) {
    case 'glossary': title = '用語集'; break;
    case 'privacy': title = 'プライバシーポリシー'; break;
    case 'about': title = 'サイトについて'; break;
    case 'guide': title = '試験ガイド'; break;
  }

  const modHtml = subDirTemplateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), modHtml);
  generatedCount++;
}

// ── sitemap.xml の生成 ──────────────────────────────
const BASE_URL = 'https://wamu1225.github.io/mhm-g3';
const today = new Date().toISOString().split('T')[0];

const moduleUrls = modules.map(m =>
  `  <url>\n    <loc>${BASE_URL}/${m.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const staticUrls = ['glossary', 'guide'].map(p =>
  `  <url>\n    <loc>${BASE_URL}/${p}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
).join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${moduleUrls}
${staticUrls}
</urlset>`;

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

console.log(`✅ Generated ${generatedCount} static HTML files successfully!`);
console.log(`✅ Generated sitemap.xml with ${modules.length + 3} URLs.`);
