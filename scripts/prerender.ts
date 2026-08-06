import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { modules } from '../src/data/modules';
import { glossary } from '../src/data/glossary';
import { buildUsecaseHtml } from '../src/data/usecaseGuide';
import { EXAM_CONFIG } from '../src/data/examConfig';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/mhm-g3';
const BASE = '/mhm-g3';

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inlineHtml = (s: string) => escHtml(s.replace(/\[\[term:.*?\]\]|\[\[\/term\]\]|\[\[.*?\]\]/g, '')).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// 行頭の絵文字マーカーは装飾でなくテキストラベルへ（2026-08-06・O-2-8：
// 生の絵文字グリフはOS/フォント依存で描画が不安定・アクセシビリティ上も弱い）。
const LINE_MARKERS: Record<string, string> = {
  '💡': 'ヒント',
  '🎯': '試験ポイント',
  '⚠️': '注意',
  '📌': 'まとめ',
  '📖': '発展',
};
// 見出しは見出し文自体が既に意味を伝えるため、絵文字だけ剥がす（ラベル追加はしない）。
function stripLeadingMarker(text: string): string {
  const markerKey = Object.keys(LINE_MARKERS).find((mk) => text.startsWith(mk));
  return markerKey ? text.slice(markerKey.length).trim() : text;
}

// App.tsx内のJSX図（[[key]]でReact専用に描画されるSVG/CSS図）を静的HTMLでも表示する（2026-07-30・O-2-6続報）。
// これまで行ごと除去していたため静的HTMLに図が1つも無かった。App.tsxの構造をそのまま複製し、既存CSSを共有する。
const FIGURES: Record<string, string> = {
  'care-layers': `<figure class="mhm-figure">
  <div class="care-layers" role="img" aria-label="4つのケアの内外関係：セルフケア（本人）を中心に、ラインケア、事業場内産業保健スタッフ、事業場外資源へと層が広がる図">
    <div class="care-layer care-layer-4">
      <span class="care-layer-tag">事業場外</span>
      <span class="care-layer-name">④ 事業場外資源によるケア</span>
      <span class="care-layer-sub">EAP・精神保健福祉センター等（匿名性が高い）</span>
      <div class="care-layer care-layer-3">
        <span class="care-layer-tag">事業場内</span>
        <span class="care-layer-name">③ 事業場内産業保健スタッフ等によるケア</span>
        <span class="care-layer-sub">産業医・保健師・人事労務担当者</span>
        <div class="care-layer care-layer-2">
          <span class="care-layer-tag">職場</span>
          <span class="care-layer-name">② ラインによるケア</span>
          <span class="care-layer-sub">管理監督者（直属の上司）</span>
          <div class="care-layer care-layer-1">
            <span class="care-layer-tag">本人</span>
            <span class="care-layer-name">① セルフケア</span>
            <span class="care-layer-sub">労働者自身</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <figcaption class="mhm-fig-cap">「4つのケア」は並列の4項目ではなく、<strong>労働者本人を中心に、内側から外側へ層をなす</strong>関係にある。①セルフケア（本人）→②ラインによるケア（直属の上司）→③事業場内産業保健スタッフ（産業医・保健師）→④事業場外資源（EAP等）の順で、外側に行くほど専門性・匿名性が高まる。内側の層で対応しきれない場合に、外側の層へつなぐ（早期発見・早期対応の連携）。</figcaption>
</figure>`,
};

// 表・見出し・リストを静的HTMLへ変換（旧stripMarkdownは表を丸ごと削除していたため新設。
// 本サイトはApp.tsx側にコールアウト専用スタイルが無いため💡⚠️等は地の文としてそのまま出す）
function mdToHtml(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    const figKey = t.match(/^\[\[([a-z0-9-]+)\]\]$/);
    if (figKey && FIGURES[figKey[1]]) { out.push(FIGURES[figKey[1]]); i++; continue; }
    if (t === '' || /^\[\[.*?\]\]$/.test(t)) { i++; continue; }
    if (/^---+$/.test(t)) { out.push('<hr style="border:0;border-top:1px solid #ddd;margin:18px 0">'); i++; continue; }
    if (t.startsWith('#### ')) { out.push(`<h4 style="font-size:1rem;margin:16px 0 6px">${inlineHtml(stripLeadingMarker(t.slice(5)))}</h4>`); i++; continue; }
    if (t.startsWith('### ')) { out.push(`<h3 style="font-size:1.05rem;margin:18px 0 6px">${inlineHtml(stripLeadingMarker(t.slice(4)))}</h3>`); i++; continue; }
    if (t.startsWith('## ')) { out.push(`<h2 style="font-size:1.2rem;margin:22px 0 8px;border-left:4px solid #3a8073;padding-left:10px">${inlineHtml(stripLeadingMarker(t.slice(3)))}</h2>`); i++; continue; }
    if (t.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      const parsed = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
        .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c) || c === ''));
      if (parsed.length) {
        const [head, ...body] = parsed;
        const th = head.map((c) => `<th style="text-align:left;padding:6px 10px;background:#e7f3f0;border-bottom:2px solid #bfe3d7">${inlineHtml(c)}</th>`).join('');
        const trs = body.map((cells) => '<tr>' + cells.map((c) => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top">${inlineHtml(c)}</td>`).join('') + '</tr>').join('');
        out.push(`<div style="overflow-x:auto;margin:14px 0"><table style="border-collapse:collapse;width:100%;font-size:0.92rem"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`);
      }
      continue;
    }
    if (/^\d+\.\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, '')); i++; }
      out.push('<ol style="padding-left:20px">' + items.map((it) => `<li>${inlineHtml(it)}</li>`).join('') + '</ol>');
      continue;
    }
    if (/^[-*]\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s/, '')); i++; }
      out.push('<ul style="padding-left:20px">' + items.map((it) => `<li>${inlineHtml(it)}</li>`).join('') + '</ul>');
      continue;
    }
    const markerKey = Object.keys(LINE_MARKERS).find((mk) => t.startsWith(mk));
    if (markerKey) {
      const rest = t.slice(markerKey.length).trim();
      out.push(`<p style="margin:0 0 12px"><strong style="color:#2563eb">${LINE_MARKERS[markerKey]}：</strong>${inlineHtml(rest)}</p>`); i++; continue;
    }
    out.push(`<p style="margin:0 0 12px">${inlineHtml(t)}</p>`); i++;
  }
  return out.join('\n');
}

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
const robotsMeta = '<meta name="robots" content="index, follow" />';

// ── ルート index.html ────────────────────────────────
const moduleListHtml = modules.map(m =>
  `<li style="margin-bottom:12px"><a href="${BASE}/${m.id}/" style="color:#3a8073;font-weight:600;text-decoration:none">${m.title}</a><br><span style="color:#555;font-size:0.9rem">${m.description}</span></li>`
).join('\n');

const rootStaticContent = `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <h1 style="font-size:1.8rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:16px">メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</h1>
  <p style="color:#444;margin-bottom:24px">メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習支援サイトです。ストレスの仕組み・セルフケア・対処法をわかりやすく解説しています。</p>
  <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">学習モジュール一覧</h2>
  <ul style="list-style:none;padding:0">
${moduleListHtml}
  </ul>
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:16px">
    <a href="${BASE}/glossary/" style="color:#3a8073">用語集</a>
    <a href="${BASE}/guide/" style="color:#3a8073">試験ガイド</a>
    <a href="${BASE}/usecase/" style="color:#3a8073">セルフケア逆引きガイド</a>
    <a href="${BASE}/about/" style="color:#3a8073">サイトについて</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、大阪商工会議所の公式サイトではありません。</p>
</article>`;

let rootIndexHtml = templateHtml.replace('<div id="root"></div>', `<div id="root">${rootStaticContent}</div>`);
rootIndexHtml = rootIndexHtml.replace('</head>', `${robotsMeta}\n  </head>`);
const homeJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス',
  'url': `${BASE_URL}/`,
  'description': 'メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。',
  'inLanguage': 'ja'
});
rootIndexHtml = rootIndexHtml.replace('</head>', `<script type="application/ld+json">${homeJsonLd}</script>\n  </head>`);
fs.writeFileSync(INDEX_HTML_PATH, rootIndexHtml);

const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"')
  .replace(/href="\.\/icons.svg"/g, 'href="../icons.svg"');

let generatedCount = 0;

// ── モジュールページ ──────────────────────────────────
for (let i = 0; i < modules.length; i++) {
  const mod = modules[i];
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const seoText = mdToHtml(mod.content);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス`;

  // クイズスニペット（最初の3問）
  const quizSnippet = mod.quiz.slice(0, 3).map((q, qi) => {
    const correctAnswer = q.options[q.correctAnswer];
    return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #3a8073">
  <p style="margin:0 0 6px;font-weight:600;color:#1e3a5f">Q${qi + 1}. ${q.question.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
  <p style="margin:0;color:#444;font-size:0.92rem">A. ${correctAnswer.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
</div>`;
  }).join('\n');

  const quizSnippetHtml = `<section style="margin-top:28px">
  <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#1e3a5f">確認クイズ（抜粋）</h2>
  ${quizSnippet}
  <p style="margin-top:12px;font-size:0.9rem;color:#555">全10問のクイズはサイトのインタラクティブ版でお試しください。</p>
</section>`;

  // 同章の他モジュールリンク
  const chapterMods = modules.filter(m => m.chapter === mod.chapter && m.id !== mod.id);
  const relatedHtml = chapterMods.length > 0 ? `<section style="margin-top:28px;padding:16px;background:#f8fafc;border-radius:8px">
  <h2 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:#1e3a5f">同じChapterの他のモジュール</h2>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px">
    ${chapterMods.map(m => `<li><a href="${BASE}/${m.id}/" style="color:#3a8073;text-decoration:none;font-size:0.9rem;background:#fff;border:1px solid #bfe3d7;border-radius:4px;padding:3px 10px;display:inline-block">${m.title}</a></li>`).join('\n    ')}
  </ul>
</section>` : '';

  // 前後モジュールリンク
  const prevMod = i > 0 ? modules[i - 1] : null;
  const nextMod = i < modules.length - 1 ? modules[i + 1] : null;
  const prevLink = prevMod ? `<a href="${BASE}/${prevMod.id}/" style="color:#3a8073;text-decoration:none">← ${prevMod.title}</a>` : '';
  const nextLink = nextMod ? `<a href="${BASE}/${nextMod.id}/" style="color:#3a8073;text-decoration:none">${nextMod.title} →</a>` : '';

  const seoContentHtml = `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#3a8073;text-decoration:none">← 学習リファレンス ホーム</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:12px">${mod.title}</h1>
  <p style="color:#555;margin-bottom:20px;font-size:1.05rem">${mod.description}</p>
  <div style="color:#333">${seoText}</div>
  ${quizSnippetHtml}
  ${relatedHtml}
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
    ${prevLink}
    ${nextLink}
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、大阪商工会議所の公式サイトではありません。</p>
</article>`;

  let modHtml = subDirTemplateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="メンタルヘルスマネジメント検定Ⅲ種対策サイト。ストレス・セルフケア・メンタルヘルス不調をわかりやすく解説。" />', `<meta property="og:description" content="${mod.description}" />`)
    .replace(`<meta property="og:url" content="${BASE_URL}/" />`, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(`<link rel="canonical" href="${BASE_URL}/" />`, `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="twitter:description" content="${mod.description}" />`);

  modHtml = modHtml.replace('</head>', `${robotsMeta}\n  </head>`);
  modHtml = modHtml.replace('<div id="root"></div>', `<div id="root">${seoContentHtml}</div>`);

  // JSON-LD: BreadcrumbList + Article + FAQPage
  const faqItems = mod.quiz.slice(0, 3).map(q => ({
    '@type': 'Question',
    'name': q.question.replace(/\*\*(.*?)\*\*/g, '$1').trim(),
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': q.options[q.correctAnswer].replace(/\*\*(.*?)\*\*/g, '$1').trim()
    }
  }));

  const modJsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': `Chapter ${mod.chapter}`, 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 3, 'name': mod.title, 'item': pageUrl }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': mod.title,
      'description': mod.description,
      'url': pageUrl,
      'inLanguage': 'ja',
      'author': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' },
      'publisher': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqItems
    }
  ]);
  modHtml = modHtml.replace('</head>', `<script type="application/ld+json">${modJsonLd}</script>\n  </head>`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

// ── 用語集ページ ─────────────────────────────────────
const glossaryTerms = Object.values(glossary);
const glossaryTermsHtml = glossaryTerms.map(t =>
  `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee">
    <strong style="font-size:1rem;color:#1e3a5f">${t.term}</strong>
    <span style="display:inline-block;font-size:0.75rem;color:#fff;background:${t.level === '基礎' ? '#16a34a' : t.level === '中級' ? '#3a8073' : '#9333ea'};padding:1px 6px;border-radius:4px;margin-left:8px">${t.level}</span>
    <p style="margin:6px 0 0;color:#444;line-height:1.6">${t.explanation.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
  </div>`
).join('\n');

const glossaryFaqItems = glossaryTerms.slice(0, 20).map(t => ({
  '@type': 'Question',
  'name': `${t.term}とは何ですか？`,
  'acceptedAnswer': { '@type': 'Answer', 'text': t.explanation.replace(/\*\*(.*?)\*\*/g, '$1') }
}));

// ── 静的ページ ────────────────────────────────────────
const staticPageContents: Record<string, { title: string; description: string; bodyHtml: string; jsonLd?: object }> = {
  glossary: {
    title: '用語集',
    description: 'メンタルヘルスマネジメント検定Ⅲ種の頻出用語を一覧で解説。ストレス・セルフケア・4つのケア・ストレスチェック制度など試験に出る専門用語を網羅。',
    bodyHtml: `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#3a8073;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:20px">用語集</h1>
  <p style="color:#555;margin-bottom:24px">メンタルヘルスマネジメント検定Ⅲ種の頻出用語を解説します。全${glossaryTerms.length}用語を難易度別に表示しています。</p>
${glossaryTermsHtml}
</article>`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': glossaryFaqItems }
  },
  guide: {
    title: '試験ガイド',
    description: 'メンタルヘルスマネジメント検定Ⅲ種の試験概要・出題範囲・重要数値チートシートを解説。50人・年1回・月80時間・57項目など合格に必要な数字を一覧で確認できます。',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        { '@type': 'Question', 'name': 'メンタルヘルスマネジメント検定Ⅲ種の試験時間は何分ですか？', 'acceptedAnswer': { '@type': 'Answer', 'text': '試験時間は120分です。マークシート方式で4択50問が出題されます。' } },
        { '@type': 'Question', 'name': 'メンタルヘルスマネジメント検定Ⅲ種の合格基準は何点ですか？', 'acceptedAnswer': { '@type': 'Answer', 'text': '100点満点中70点以上が合格基準です。合格率は約70〜80%と比較的高い水準です。' } },
        { '@type': 'Question', 'name': 'ストレスチェック制度が義務となる事業場の規模は？', 'acceptedAnswer': { '@type': 'Answer', 'text': '常時50人以上の労働者を使用する事業場では、年1回のストレスチェックが義務付けられています（2015年施行）。50人未満は努力義務です。' } },
        { '@type': 'Question', 'name': '職業性ストレス簡易調査票の標準版は何項目ですか？', 'acceptedAnswer': { '@type': 'Answer', 'text': '標準版は57項目です。短縮版は23項目で、ストレスチェック制度で広く使用されています。' } },
        { '@type': 'Question', 'name': '長時間労働者への医師面接指導が義務となる時間外労働の基準は？', 'acceptedAnswer': { '@type': 'Answer', 'text': '月80時間超の時間外労働（本人の申し出あり）で面接指導が義務となります。研究開発業務等では月100時間超で申し出なしに義務となります。' } },
        { '@type': 'Question', 'name': '4つのケアの根拠となる指針はいつ策定されましたか？', 'acceptedAnswer': { '@type': 'Answer', 'text': '「労働者の心の健康の保持増進のための指針」は2006年に策定され、2015年に改正されました。セルフケア・ラインによるケア・事業場内産業保健スタッフによるケア・事業場外資源によるケアの4つが定められています。' } },
        { '@type': 'Question', 'name': '安全配慮義務の根拠条文は何ですか？', 'acceptedAnswer': { '@type': 'Answer', 'text': '労働契約法第5条が根拠条文です。使用者（企業）は労働者の生命・身体等の安全を確保しつつ労働させる義務があります。' } },
      ]
    },
    bodyHtml: `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#3a8073;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:20px">メンタルヘルスマネジメント検定Ⅲ種 試験ガイドと学習の進め方</h1>
  <p style="color:#555;margin-bottom:24px">日本の働く人のメンタルヘルスは深刻な社会課題であり、2015年のストレスチェック制度の義務化に象徴されるように、企業には従業員の心の健康を管理する責任が課されています。しかし組織による管理だけでは限界があり、労働者自身が自らのストレスに気づき適切に対処する「セルフケア」の能力が不可欠です。大阪商工会議所が実施するメンタルヘルスマネジメント検定Ⅲ種は、そのセルフケア能力を客観的に評価する標準的な指標として確立されています。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">試験の概要と形式</h2>
  <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:16px">
    <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0"><th style="padding:8px 12px;text-align:left">項目</th><th style="padding:8px 12px;text-align:left">詳細</th><th style="padding:8px 12px;text-align:left">備考</th></tr></thead>
    <tbody>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">受験資格</td><td style="padding:8px 12px">制限なし</td><td style="padding:8px 12px;color:#444">全ての労働者・学生が対象</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">試験時間</td><td style="padding:8px 12px">${EXAM_CONFIG.duration}分</td><td style="padding:8px 12px;color:#444">1問あたり約2〜3分の余裕があります</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">出題形式</td><td style="padding:8px 12px">${EXAM_CONFIG.format}</td><td style="padding:8px 12px;color:#444">持込不可（電卓なし）</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">問題数</td><td style="padding:8px 12px">${EXAM_CONFIG.questionCount}</td><td style="padding:8px 12px;color:#444">全問必答</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">合格基準</td><td style="padding:8px 12px">${EXAM_CONFIG.passingScoreLabel}</td><td style="padding:8px 12px;color:#444">絶対評価（他者の成績に依存しない）</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px;font-weight:700">実施時期</td><td style="padding:8px 12px">${EXAM_CONFIG.schedule}</td><td style="padding:8px 12px;color:#444">申込は試験の約2ヶ月前から</td></tr>
      <tr><td style="padding:8px 12px;font-weight:700">合格率</td><td style="padding:8px 12px">約65〜78%（回により変動）</td><td style="padding:8px 12px;color:#444">直近5回（2024年3月〜2026年3月）の実測：69.7%、65.1%、77.8%、74.3%、72.1%</td></tr>
    </tbody>
  </table>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">出題範囲と重要なポイント</h2>
  <p style="color:#444">試験問題は大阪商工会議所発行の公式テキスト（現行第6版・2026年6月発行）から高い割合で出題されます。「なぜその選択肢が正しいか説明できる」レベルまで理解を深めることが重要です。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">① メンタルヘルスケアの意義</h3>
  <p style="color:#444">厚生労働省の指針に定められた「4つのケア」（セルフケア・ラインによるケア・事業場内・事業場外）は全試験級で共通する最重要項目。各ケアの担い手と役割を正確に区別すること。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">② ストレスとメンタルヘルスの基礎知識</h3>
  <p style="color:#444">ハンス・セリエの一般適応症候群（警告反応期→抵抗期→疲憊期）、ラザルスの認知的評価モデル、代表的精神疾患（うつ病・適応障害・パニック障害）の症状の区別が頻出。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">③ セルフケアの重要性</h3>
  <p style="color:#444">労働契約法における「安全配慮義務」（企業側）と「自己保健義務」（労働者側）。この対となる義務の理解がセルフケアの実践を倫理的に正当化します。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">④ ストレスへの気づき方</h3>
  <p style="color:#444">ストレス反応の3側面（心理・身体・行動）、ストレスチェック制度の重要数値（<strong>常時50人以上・年1回義務・2015年施行・本人への直接通知</strong>）。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">⑤ ストレスへの対処・軽減の方法</h3>
  <p style="color:#444">問題焦点型・情動焦点型コーピングの使い分け、リラクセーション技法の生理学的メカニズム（副交感神経優位）。睡眠の目安（<strong>成人は6時間以上</strong>）などの具体的数値も出題されます。</p>
  <h3 style="font-size:1.05rem;font-weight:700;color:#3a8073;margin:16px 0 6px">⑥ 社内外資源の活用</h3>
  <p style="color:#444">産業医・保健師の守秘義務、EAP（匿名性・事業場外資源）、精神保健福祉センター・「こころの耳」などの公的窓口の役割。援助希求行動がセルフケアの重要スキルであることを理解する。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">学習時間の目安と進め方</h2>
  <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:16px">
    <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0"><th style="padding:8px 12px;text-align:left">学習者のタイプ</th><th style="padding:8px 12px;text-align:left">総学習時間の目安</th><th style="padding:8px 12px;text-align:left">推奨学習期間</th></tr></thead>
    <tbody>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px">心理学・労務の初学者</td><td style="padding:8px 12px;font-weight:700">30〜50時間</td><td style="padding:8px 12px">1〜2ヶ月</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 12px">基礎知識を有する実務家</td><td style="padding:8px 12px;font-weight:700">15〜30時間</td><td style="padding:8px 12px">2週間〜1ヶ月</td></tr>
      <tr><td style="padding:8px 12px">短期集中型（再受験等）</td><td style="padding:8px 12px;font-weight:700">10〜15時間</td><td style="padding:8px 12px">1〜2週間</td></tr>
    </tbody>
  </table>
  <p style="color:#444"><strong style="color:#3a8073">過去問主導型アプローチ（推奨）</strong></p>
  <ol style="color:#444;padding-left:20px">
    <li><strong>公式テキストを1周通読：</strong>全体像と専門用語を把握する。</li>
    <li><strong>分野別過去問を実施：</strong>頻出項目と自身の弱点を特定する。</li>
    <li><strong>間違えた箇所をテキストで復習：</strong>「なぜその選択肢が正しいか説明できる」レベルへ。</li>
    <li><strong>本番形式の模擬試験：</strong>120分の時間感覚と問題を最後まで解く体験をする。</li>
  </ol>
  <p style="color:#888;font-size:0.85rem">※ 1日1時間×1ヶ月継続が標準的な成功モデルです。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">試験当日のポイント</h2>
  <ul style="color:#444;padding-left:20px">
    <li><strong>時間は十分ある：</strong>${EXAM_CONFIG.duration}分で${EXAM_CONFIG.questionCount}あるため、1問に2分以上かけられます。落ち着いて読みましょう。</li>
    <li><strong>「最も適切なもの」に注意：</strong>「正しいもの」ではなく「最も適切なもの」を選ぶ問題が多いため、選択肢を全部読んでから比較します。</li>
    <li><strong>感覚で答えない：</strong>「なんとなく」ではなく、定義・法令・数値を根拠に選ぶ習慣をつけましょう。</li>
    <li><strong>数値は正確に：</strong>「50人以上」「年1回」「2015年」「${EXAM_CONFIG.passingScore}点以上」「6時間以上」などの数値は頻出です。</li>
  </ul>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">重要数値チートシート</h2>
  <p style="color:#555;font-size:0.9rem;margin-bottom:12px">試験では「数値の正確な暗記」が合否を分けます。以下の数値は確実に覚えてください。</p>
  <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
    <thead><tr style="background:#fef3c7"><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">数値</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">内容</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">根拠・補足</th></tr></thead>
    <tbody>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">50人以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェック義務・産業医選任義務の規模基準</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">労働安全衛生法。50人未満は努力義務</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">年1回</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェックの実施頻度</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">50人以上の事業場に義務</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2015年</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェック制度の施行年（平成27年12月）</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">労働安全衛生法改正</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">月80時間超</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">長時間労働者への医師面接指導が義務となる基準（本人申し出あり）</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">労安法第66条の8。ストレスチェック面接とは別制度</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">月100時間超</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">研究開発業務等で申し出なしに面接指導が義務となる基準</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">月80時間（申し出あり）との違いに注意</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">6時間以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">成人の睡眠時間の目安</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">厚生労働省の睡眠指針</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">3ヶ月以内</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">適応障害の発症目安（ストレッサー発生から）</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">ストレッサーの特定・除去で改善する傾向</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2週間以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">専門家への相談を検討するストレスサインの持続期間目安</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">うつ病診断の参考期間でもある</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">57項目</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">職業性ストレス簡易調査票の標準版の項目数</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">短縮版は23項目。ストレスチェックで標準使用</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2006年策定・2015年改正</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">「労働者の心の健康の保持増進のための指針」（4つのケアの根拠）</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">厚生労働省</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">労働契約法第5条</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">安全配慮義務の根拠条文</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#6b7280">使用者（企業）の義務。違反で民事上の損害賠償責任</td></tr>
    </tbody>
  </table>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">合格後のステップアップ</h2>
  <p style="color:#444">Ⅲ種（セルフケアコース）の合格はメンタルヘルスの第一歩です。Ⅱ種（ラインケアコース）では部下・チームのメンタルヘルスマネジメントを、Ⅰ種（マスターコース）では企業全体の制度設計を学べます。ⅢとⅡは出題範囲が多く重複しているため、同時学習による相乗効果も期待できます。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">免責事項</h2>
  <p style="color:#888;font-size:0.9rem;border-left:3px solid #fbbf24;padding-left:12px">⚠️ 本サイトは大阪商工会議所の公式サイトではありません。試験の出題範囲・申込方法・合否については必ず公式サイトをご確認ください。</p>
  <p style="margin-top:16px"><a href="${BASE}/" style="color:#3a8073">← ホームへ戻る</a></p>
</article>`
  },
  usecase: {
    title: '場面別 セルフケア逆引きガイド',
    description: '「いま知りたいこと」からメンタルヘルス・マネジメント検定Ⅲ種（セルフケアコース）のどの章で学べるかを逆引きできる早見表。ストレスの仕組み・気づき方・コーピング・相談資源などへすばやくたどれます。',
    bodyHtml: buildUsecaseHtml(BASE)
  },
  about: {
    title: 'サイトについて',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスについて。サイトの目的・コンテンツ構成・利用方法を説明します。',
    bodyHtml: `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#3a8073;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:20px">サイトについて</h1>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">このサイトについて</h2>
    <p style="color:#444">「メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス」は、メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す方のための個人運営の学習支援サイトです。</p>
    <p style="color:#888;font-size:0.9rem;border-left:3px solid #fbbf24;padding-left:12px;margin-top:12px">本サイトは個人による学習支援サイトであり、大阪商工会議所の公式サイトではありません。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">コンテンツ構成</h2>
    <ul style="color:#444;padding-left:20px">
      <li><strong>学習モジュール（全${modules.length}モジュール）</strong>：${modules.map(m => m.title).join('・')}</li>
      <li><strong>用語集</strong>：頻出用語の解説</li>
      <li><strong>確認クイズ</strong>：各モジュールの理解度確認（全${modules.reduce((s: number, m: { quiz: unknown[] }) => s + m.quiz.length, 0)}問）</li>
      <li><strong>全範囲クイズ</strong>：全モジュールからランダム出題</li>
    </ul>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">編集・制作方針</h2>
    <p style="color:#444">本サイトのコンテンツは、メンタルヘルス・マネジメント検定（Ⅲ種）の公式の出題範囲や一般に流通している関連書籍を参照しつつ、運営者が内容を一から再構成し、初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。用語集・確認問題はすべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">お問い合わせ</h2>
    <p style="color:#444">内容の誤り・ご意見・ご要望は<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer" style="color:#3a8073">こちらのGoogleフォーム</a>からお願いします。</p>
  </section>
  <section>
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">免責事項</h2>
    <p style="color:#444">本サイトの解説・問題は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。</p>
  </section>
  <p style="margin-top:32px"><a href="${BASE}/" style="color:#3a8073">← ホームへ戻る</a></p>
</article>`
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスのプライバシーポリシー。個人情報の取り扱いについて説明します。',
    bodyHtml: `<div style="background:#e7f3f0;border-bottom:1px solid #bfe3d7;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#235c50;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#3a8073;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #3a8073;padding-bottom:8px;margin-bottom:8px">プライバシーポリシー</h1>
  <p style="color:#888;font-size:0.9rem;margin-bottom:24px">最終更新：2026年4月</p>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">1. サイトについて</h2>
    <p style="color:#444">本サイト「メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス」は、メンタルヘルスマネジメント検定Ⅲ種の学習を支援することを目的とした個人運営のサイトです。</p>
    <p style="color:#888;font-size:0.9rem;margin-top:8px">⚠️ 本サイトは大阪商工会議所の公式サイトではありません。試験の出題範囲・申込方法・合否については、必ず公式サイトをご確認ください。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">2. 学習進捗データについて</h2>
    <p style="color:#444">クイズの得点・完了状況は、お使いのブラウザのローカルストレージにのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。ブラウザのデータ削除により消去されます。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">3. コンテンツの免責事項</h2>
    <p style="color:#444">本サイトの解説・問題は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。</p>
  </section>
  <section>
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">4. 本ポリシーの変更</h2>
    <p style="color:#444">本ポリシーは予告なく変更される場合があります。変更後のポリシーはこのページへの掲載をもって効力を生じます。</p>
  </section>
  <p style="margin-top:32px"><a href="${BASE}/" style="color:#3a8073">← ホームへ戻る</a></p>
</article>`
  }
};

const staticPageNames = Object.keys(staticPageContents);

for (const [page, config] of Object.entries(staticPageContents)) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pageUrl = `${BASE_URL}/${page}/`;
  const pageTitle = `${config.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス`;

  let pageHtml = subDirTemplateHtml
    .replace('<title>メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="description" content="${config.description}" />`)
    .replace('<meta property="og:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="メンタルヘルスマネジメント検定Ⅲ種対策サイト。ストレス・セルフケア・メンタルヘルス不調をわかりやすく解説。" />', `<meta property="og:description" content="${config.description}" />`)
    .replace(`<meta property="og:url" content="${BASE_URL}/" />`, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(`<link rel="canonical" href="${BASE_URL}/" />`, `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習リファレンス。ストレスの仕組み・セルフケア・対処法をわかりやすく解説。" />', `<meta name="twitter:description" content="${config.description}" />`);

  pageHtml = pageHtml.replace('</head>', `${robotsMeta}\n  </head>`);
  pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${config.bodyHtml}</div>`);

  const pageJsonLd = config.jsonLd ?? {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.title,
    description: config.description,
    url: pageUrl,
    inLanguage: 'ja',
    isPartOf: { '@type': 'WebSite', name: 'メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス', url: `${BASE_URL}/` },
  };
  pageHtml = pageHtml.replace('</head>', `<script type="application/ld+json">${JSON.stringify(pageJsonLd)}</script>\n  </head>`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  generatedCount++;
}

// ── sitemap.xml ──────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

const moduleUrls = modules.map(m =>
  `  <url>\n    <loc>${BASE_URL}/${m.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const staticUrls = staticPageNames.map(p =>
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
console.log(`✅ Generated sitemap.xml with ${modules.length + staticPageNames.length + 1} URLs.`);

// ── OGP Image ────────────────────────────────────────
const ogpSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f8fafc"/>
  <rect width="1200" height="12" fill="#3a8073"/>
  <rect x="0" y="0" width="360" height="630" fill="#3a8073" fill-opacity="0.05"/>
  <rect x="80" y="230" width="8" height="160" rx="4" fill="#3a8073"/>
  <text x="112" y="290" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="42" font-weight="700" fill="#0f172a">メンタルヘルスマネジメント検定 Ⅲ種</text>
  <text x="112" y="358" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">学習リファレンス</text>
  <text x="112" y="420" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="26" fill="#64748b">ストレスの仕組み・セルフケア・メンタルヘルス対処法</text>
  <text x="1120" y="600" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#94a3b8">study-apps.com</text>
</svg>`;

const ogpBuffer = await sharp(Buffer.from(ogpSvg)).png().toBuffer();
fs.writeFileSync(path.join(DIST_DIR, 'ogp.png'), ogpBuffer);
console.log('✅ Generated ogp.png');
