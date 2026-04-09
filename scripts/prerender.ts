import * as fs from 'fs';
import * as path from 'path';
import { modules } from '../src/data/modules';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/mhm-g3';

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[.*?\]\]/g, '')          // [[term:id]] / [[/term]] markers
    .replace(/^#{1,6}\s+/gm, '')          // ## headings
    .replace(/\*\*(.*?)\*\*/g, '$1')      // **bold**
    .replace(/\*(.*?)\*/g, '$1')          // *italic*
    .replace(/^[-*+]\s+/gm, '')           // - list items
    .replace(/^\d+\.\s+/gm, '')           // 1. ordered lists
    .replace(/^\|.*\|$/gm, '')            // | table rows |
    .replace(/^[-|:\s]+$/gm, '')          // table separators
    .replace(/^---+$/gm, '')              // --- hr
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '') // emoji (surrogate range)
    .replace(/[💡🎯⚠️✅❌🔴🟡🟢]/g, '')   // common emoji
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

let generatedCount = 0;

for (const mod of modules) {
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const seoText = stripMarkdown(mod.content).slice(0, 400) + '...';
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス`;

  let modHtml = templateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="メンタルヘルスマネジメント検定Ⅲ種対策サイト。ストレス・セルフケア・メンタルヘルス不調をわかりやすく解説。" />', `<meta property="og:description" content="${mod.description}" />`)
    .replace(`<meta property="og:url" content="${BASE_URL}/" />`, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(`<link rel="canonical" href="${BASE_URL}/" />`, `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="twitter:description" content="${mod.description}" />`);

  const seoDataHtml = `<noscript id="seo-data">
    <h1>${mod.title}</h1>
    <p>${seoText}</p>
  </noscript>`;

  modHtml = modHtml.replace('<body>', `<body>\n    ${seoDataHtml}`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

const staticPageConfigs: Record<string, { title: string; description: string }> = {
  glossary: {
    title: '用語集',
    description: 'メンタルヘルスマネジメント検定Ⅲ種の頻出用語を一覧で解説。ストレス・セルフケア・4つのケア・ストレスチェック制度など試験に出る専門用語を網羅。'
  },
  guide: {
    title: '試験ガイド',
    description: 'メンタルヘルスマネジメント検定Ⅲ種の試験概要・出題範囲・学習の進め方を解説。合格基準・試験時間・推奨学習時間など受験に必要な情報をまとめました。'
  },
  about: {
    title: 'サイトについて',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスについて。サイトの目的・コンテンツ構成・利用方法を説明します。'
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスのプライバシーポリシー。個人情報の取り扱いについて説明します。'
  }
};

for (const [page, config] of Object.entries(staticPageConfigs)) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pageUrl = `${BASE_URL}/${page}/`;
  const pageTitle = `${config.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス`;

  const pageHtml = templateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="description" content="${config.description}" />`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="メンタルヘルスマネジメント検定Ⅲ種対策サイト。ストレス・セルフケア・メンタルヘルス不調をわかりやすく解説。" />', `<meta property="og:description" content="${config.description}" />`)
    .replace(`<meta property="og:url" content="${BASE_URL}/" />`, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(`<link rel="canonical" href="${BASE_URL}/" />`, `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="twitter:description" content="${config.description}" />`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  generatedCount++;
}

// ── sitemap.xml の生成 ──────────────────────────────
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
