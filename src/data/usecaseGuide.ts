// 場面別 セルフケア逆引きガイド（早見表）の本文。
// prerender.ts（静的HTML＝クローラー用）と App.tsx（クライアント描画）の両方から
// import する単一ソース。base は '/mhm-g3' または '' を渡す。
export function buildUsecaseHtml(base: string): string {
  const wrapOpen = '<div style="overflow-x:auto;margin:8px 0 20px"><table style="border-collapse:collapse;width:100%;min-width:520px">';
  const wrapClose = '</table></div>';
  const th = (t: string) => `<th style="text-align:left;padding:8px 10px;background:#eff6ff;border:1px solid #bfdbfe;font-size:0.9rem;white-space:nowrap">${t}</th>`;
  const td = (t: string) => `<td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:0.9rem;color:#444">${t}</td>`;
  const lk = (id: string, label: string) => `<a href="${base}/${id}/" style="color:#2563eb;text-decoration:none">${label}</a>`;
  const row = (cells: string[]) => `<tr>${cells.map(td).join('')}</tr>`;
  return `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${base}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:bold;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">場面別 セルフケア逆引きガイド</h1>
  <p style="color:#555;margin-bottom:24px">「いま知りたいこと・やりたいこと」から、メンタルヘルス・マネジメント検定Ⅲ種（セルフケアコース）のどの章で学べるかを逆引きできる早見表です。各行は本サイトの対応モジュールにリンクしています。学習の道しるべとしてお使いください。</p>

  <h2 style="font-size:1.2rem;font-weight:bold;margin:20px 0 8px">1. 基礎を理解する</h2>
  ${wrapOpen}<thead><tr>${th('知りたいこと')}${th('学べる内容')}${th('参照')}</tr></thead><tbody>
  ${row(['メンタルヘルスとは何か・なぜ職場で大切か', 'メンタルヘルスの意義', lk('1.1-meaning','1.1')])}
  ${row(['誰がどう関わるのか（ケアの全体像）', '4つのケアと予防の3段階', lk('1.2-four-care','1.2')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:bold;margin:20px 0 8px">2. ストレスと不調を知る</h2>
  ${wrapOpen}<thead><tr>${th('知りたいこと')}${th('学べる内容')}${th('参照')}</tr></thead><tbody>
  ${row(['ストレスが心身に起こす仕組み', 'ストレスの仕組みとストレス反応', lk('2.1-stress-basics','2.1')])}
  ${row(['代表的な不調・症状の基礎知識', '主なメンタルヘルス不調の知識', lk('2.2-mental-disorders','2.2')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:bold;margin:20px 0 8px">3. 自分の状態に気づく</h2>
  ${wrapOpen}<thead><tr>${th('やりたいこと')}${th('学べる内容')}${th('参照')}</tr></thead><tbody>
  ${row(['自分のストレスのサインに気づく', 'ストレスへの気づき方と自己チェック', lk('4.1-awareness','4.1')])}
  ${row(['制度を使ってチェックする・働き方を見直す', 'ストレスチェック制度と長時間労働対策', lk('4.2-stress-check','4.2')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:bold;margin:20px 0 8px">4. 自分で対処する（セルフケア）</h2>
  ${wrapOpen}<thead><tr>${th('やりたいこと')}${th('学べる内容')}${th('参照')}</tr></thead><tbody>
  ${row(['セルフケアの考え方と実践', 'セルフケアの実践と相談資源', lk('3.1-selfcare','3.1')])}
  ${row(['ストレスへの具体的な対処法を身につける', 'コーピングとリラクセーション技法', lk('5.1-coping','5.1')])}
  ${row(['生活習慣からストレスに強くなる', '生活習慣とストレス耐性', lk('5.2-lifestyle','5.2')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:bold;margin:20px 0 8px">5. 相談する・助けを求める</h2>
  ${wrapOpen}<thead><tr>${th('やりたいこと')}${th('学べる内容')}${th('参照')}</tr></thead><tbody>
  ${row(['どこに・どう相談すればよいか知る', '社内外資源の活用と援助希求', lk('6.1-resources','6.1')])}
  </tbody>${wrapClose}

  <p style="margin-top:8px;font-size:0.85rem;color:#888">※ 本ガイドは検定学習のための道しるべです。心身の不調が続く場合や強いつらさを感じる場合は、医療機関や専門の相談窓口（産業医・保健師、自治体やいのちの電話などの相談先）にご相談ください。</p>
  <p style="margin-top:16px"><a href="${base}/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`;
}
