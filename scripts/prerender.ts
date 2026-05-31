import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { modules } from '../src/data/modules';
import { glossary } from '../src/data/glossary';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/mhm-g3';
const BASE = '/mhm-g3';

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[.*?\]\]/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^[-|:\s]+$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[💡🎯⚠️✅❌🔴🟡🟢]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  `<li style="margin-bottom:12px"><a href="${BASE}/${m.id}/" style="color:#2563eb;font-weight:600;text-decoration:none">${m.title}</a><br><span style="color:#555;font-size:0.9rem">${m.description}</span></li>`
).join('\n');

const rootStaticContent = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <h1 style="font-size:1.8rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:16px">メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</h1>
  <p style="color:#444;margin-bottom:24px">メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す学習支援サイトです。ストレスの仕組み・セルフケア・対処法をわかりやすく解説しています。</p>
  <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">学習モジュール一覧</h2>
  <ul style="list-style:none;padding:0">
${moduleListHtml}
  </ul>
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:16px">
    <a href="${BASE}/glossary/" style="color:#2563eb">用語集</a>
    <a href="${BASE}/guide/" style="color:#2563eb">試験ガイド</a>
    <a href="${BASE}/about/" style="color:#2563eb">サイトについて</a>
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

  const seoText = stripMarkdown(mod.content).slice(0, 6000);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス`;

  // クイズスニペット（最初の3問）
  const quizSnippet = mod.quiz.slice(0, 3).map((q, qi) => {
    const correctAnswer = q.options[q.correctAnswer];
    return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb">
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
    ${chapterMods.map(m => `<li><a href="${BASE}/${m.id}/" style="color:#2563eb;text-decoration:none;font-size:0.9rem;background:#fff;border:1px solid #dbeafe;border-radius:4px;padding:3px 10px;display:inline-block">${m.title}</a></li>`).join('\n    ')}
  </ul>
</section>` : '';

  // 前後モジュールリンク
  const prevMod = i > 0 ? modules[i - 1] : null;
  const nextMod = i < modules.length - 1 ? modules[i + 1] : null;
  const prevLink = prevMod ? `<a href="${BASE}/${prevMod.id}/" style="color:#2563eb;text-decoration:none">← ${prevMod.title}</a>` : '';
  const nextLink = nextMod ? `<a href="${BASE}/${nextMod.id}/" style="color:#2563eb;text-decoration:none">${nextMod.title} →</a>` : '';

  const seoContentHtml = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#2563eb;text-decoration:none">← 学習リファレンス ホーム</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:12px">${mod.title}</h1>
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
    <span style="display:inline-block;font-size:0.75rem;color:#fff;background:${t.level === '基礎' ? '#16a34a' : t.level === '中級' ? '#2563eb' : '#9333ea'};padding:1px 6px;border-radius:4px;margin-left:8px">${t.level}</span>
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
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">用語集</h1>
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
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">試験ガイド</h1>
  <p style="color:#555;margin-bottom:24px">メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の試験概要を解説します。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">試験概要</h2>
  <p style="color:#444">メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）は、自分自身のメンタルヘルス管理の知識を問う試験です。試験時間は120分、マークシート方式（4択50問）です。合格基準は100点満点中70点以上。合格率は約70〜80%で、社会人の受験者に広く受験されています。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">主な出題範囲</h2>
  <ul style="color:#444;padding-left:20px">
    <li>メンタルヘルスケアの意義と4つのケア</li>
    <li>ストレスの仕組みとストレス反応（GAS理論・認知的評価など）</li>
    <li>主なメンタルヘルス不調（うつ病・適応障害・バーンアウトなど）</li>
    <li>セルフケアの実践と社内外の相談資源</li>
    <li>ストレスへの気づきとストレスチェック制度</li>
    <li>ストレス対処法とリラクセーション技法</li>
    <li>社内外の相談窓口と援助希求行動</li>
  </ul>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">重要数値チートシート</h2>
  <p style="color:#555;font-size:0.9rem;margin-bottom:12px">試験で出題されやすい数字・年号を一覧にまとめました。</p>
  <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
    <thead><tr style="background:#fef3c7"><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">数値</th><th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">意味</th></tr></thead>
    <tbody>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">50人以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェック義務・産業医選任の義務付け基準</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">年1回</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェックの実施頻度</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2015年</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">ストレスチェック制度の施行年</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">月80時間超</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">面接指導義務（申し出あり）の時間外労働基準</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">月100時間超</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">研究開発業務における面接指導（申し出なし）</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">6時間以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">成人に推奨される睡眠時間の目安</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">3ヶ月以内</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">適応障害の発症目安（ストレス因子への曝露から）</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2週間以上</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">不調が続く場合の専門家相談の目安</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">57項目</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">職業性ストレス簡易調査票（標準版）の項目数</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">2006年策定・2015年改正</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">4つのケアに関するメンタルヘルス指針の策定・改正年</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:700;color:#d97706">労働契約法第5条</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#444">使用者の安全配慮義務の根拠条文</td></tr>
    </tbody>
  </table>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">学習の進め方</h2>
  <p style="color:#444">本サイトの${modules.length}つの学習モジュールをChapter 1から順に進めることで、試験範囲を体系的に学べます。各モジュールの確認クイズで理解度を確認し、全範囲クイズで総仕上げをすることをお勧めします。推奨学習時間は30〜50時間です。</p>
  <p style="margin-top:24px;font-size:0.85rem;color:#888">※最新情報は必ず大阪商工会議所の公式サイトでご確認ください。</p>
  <p style="margin-top:16px"><a href="${BASE}/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  about: {
    title: 'サイトについて',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスについて。サイトの目的・コンテンツ構成・利用方法を説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">サイトについて</h1>
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
  <section>
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">免責事項</h2>
    <p style="color:#444">本サイトの解説・問題は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。</p>
  </section>
  <p style="margin-top:32px"><a href="${BASE}/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: 'メンタルヘルスマネジメント検定Ⅲ種 学習リファレンスのプライバシーポリシー。個人情報の取り扱いについて説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${BASE}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:8px">プライバシーポリシー</h1>
  <p style="color:#888;font-size:0.9rem;margin-bottom:24px">最終更新：2026年4月</p>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">1. サイトについて</h2>
    <p style="color:#444">本サイトは、メンタルヘルスマネジメント検定Ⅲ種の学習を支援することを目的とした個人運営のサイトです。</p>
    <p style="color:#888;font-size:0.9rem;margin-top:8px">本サイトは大阪商工会議所の公式サイトではありません。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">2. Google Analytics の利用</h2>
    <p style="color:#444">アクセス分析のためにGoogle Analyticsを使用しています。収集されるデータは匿名であり、個人を特定する情報は含まれません。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">3. Google AdSense の利用</h2>
    <p style="color:#444">広告配信のためにGoogle AdSenseを使用しています。<a href="https://www.google.com/settings/ads" style="color:#2563eb">広告設定ページ</a>でパーソナライズ広告を無効にできます。Cookieの使用については<a href="https://policies.google.com/technologies/ads" style="color:#2563eb">Googleの広告ポリシー</a>をご参照ください。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">4. 学習進捗データ</h2>
    <p style="color:#444">クイズの得点・完了状況はブラウザのローカルストレージにのみ保存されます。外部サーバーへの送信はありません。</p>
  </section>
  <section>
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">5. 免責事項</h2>
    <p style="color:#444">本サイトの解説・問題は学習目的で作成されており、内容の正確性を保証するものではありません。</p>
  </section>
  <p style="margin-top:32px"><a href="${BASE}/" style="color:#2563eb">← ホームへ戻る</a></p>
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

  if (config.jsonLd) {
    pageHtml = pageHtml.replace('</head>', `<script type="application/ld+json">${JSON.stringify(config.jsonLd)}</script>\n  </head>`);
  }

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
  <rect width="1200" height="12" fill="#0075de"/>
  <rect x="0" y="0" width="360" height="630" fill="#0075de" fill-opacity="0.05"/>
  <rect x="80" y="230" width="8" height="160" rx="4" fill="#0075de"/>
  <text x="112" y="290" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="42" font-weight="700" fill="#0f172a">メンタルヘルスマネジメント検定 Ⅲ種</text>
  <text x="112" y="358" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">学習リファレンス</text>
  <text x="112" y="420" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="26" fill="#64748b">ストレスの仕組み・セルフケア・メンタルヘルス対処法</text>
  <text x="1120" y="600" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#94a3b8">study-apps.com</text>
</svg>`;

const ogpBuffer = await sharp(Buffer.from(ogpSvg)).png().toBuffer();
fs.writeFileSync(path.join(DIST_DIR, 'ogp.png'), ogpBuffer);
console.log('✅ Generated ogp.png');
