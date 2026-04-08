// mhm-g3/src/components/ExamGuide.tsx
import React from 'react';
import { Target, BookOpen, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { EXAM_CONFIG } from '../data/examConfig';

export const ExamGuide: React.FC = () => (
  <div className="privacy-page" style={{ maxWidth: '800px', lineHeight: 1.8 }}>
    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', lineHeight: 1.4 }}>
      メンタルヘルスマネジメント検定Ⅲ種 試験ガイドと学習の進め方
    </h2>
    <p style={{ fontSize: '0.875rem', marginBottom: '2rem' }}>
      日本の働く人のメンタルヘルスは深刻な社会課題であり、2015年のストレスチェック制度の義務化に象徴されるように、企業には従業員の心の健康を管理する責任が課されています。しかし組織による管理だけでは限界があり、労働者自身が自らのストレスに気づき適切に対処する「セルフケア」の能力が不可欠です。大阪商工会議所が実施するメンタルヘルスマネジメント検定Ⅲ種は、そのセルフケア能力を客観的に評価する標準的な指標として確立されています。
    </p>

    <section style={{ marginBottom: '2.5rem' }}>
      <h3><Target size={18} style={{ display: 'inline', marginRight: '6px' }} />試験の概要と形式</h3>
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>項目</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>詳細</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>備考</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>受験資格</td>
              <td style={{ padding: '0.75rem' }}>制限なし</td>
              <td style={{ padding: '0.75rem' }}>全ての労働者・学生が対象</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>試験時間</td>
              <td style={{ padding: '0.75rem' }}>{EXAM_CONFIG.duration}分</td>
              <td style={{ padding: '0.75rem' }}>1問あたり約2〜3分の余裕があります</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>出題形式</td>
              <td style={{ padding: '0.75rem' }}>{EXAM_CONFIG.format}</td>
              <td style={{ padding: '0.75rem' }}>持込不可（電卓なし）</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>問題数</td>
              <td style={{ padding: '0.75rem' }}>{EXAM_CONFIG.questionCount}</td>
              <td style={{ padding: '0.75rem' }}>全問必答</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>合格基準</td>
              <td style={{ padding: '0.75rem' }}>{EXAM_CONFIG.passingScoreLabel}</td>
              <td style={{ padding: '0.75rem' }}>絶対評価（他者の成績に依存しない）</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>実施時期</td>
              <td style={{ padding: '0.75rem' }}>{EXAM_CONFIG.schedule}</td>
              <td style={{ padding: '0.75rem' }}>申込は試験の約2ヶ月前から</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>合格率</td>
              <td style={{ padding: '0.75rem' }}>約70〜80%</td>
              <td style={{ padding: '0.75rem' }}>2024年度は約74%（体系的学習で合格可能）</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section style={{ marginBottom: '2.5rem' }}>
      <h3><BookOpen size={18} style={{ display: 'inline', marginRight: '6px' }} />出題範囲と重要なポイント</h3>
      <div style={{ fontSize: '0.875rem' }}>
        <p>試験問題は大阪商工会議所発行の公式テキスト（現行第5版）から高い割合で出題されます。「なぜその選択肢が正しいか説明できる」レベルまで理解を深めることが重要です。</p>

        <h4 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>① メンタルヘルスケアの意義</h4>
        <p style={{ marginBottom: '1rem' }}>
          厚生労働省の指針に定められた「4つのケア」（セルフケア・ラインによるケア・事業場内・事業場外）は全試験級で共通する最重要項目。各ケアの担い手と役割を正確に区別すること。
        </p>

        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>② ストレスとメンタルヘルスの基礎知識</h4>
        <p style={{ marginBottom: '1rem' }}>
          ハンス・セリエの一般適応症候群（警告反応期→抵抗期→疲憊期）、ラザルスの認知的評価モデル、代表的精神疾患（うつ病・適応障害・パニック障害）の症状の区別が頻出。
        </p>

        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>③ セルフケアの重要性</h4>
        <p style={{ marginBottom: '1rem' }}>
          労働契約法における「安全配慮義務」（企業側）と「自己保健義務」（労働者側）。この対となる義務の理解がセルフケアの実践を倫理的に正当化します。
        </p>

        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>④ ストレスへの気づき方</h4>
        <p style={{ marginBottom: '1rem' }}>
          ストレス反応の3側面（心理・身体・行動）、ストレスチェック制度の重要数値（<strong>常時50人以上・年1回義務・2015年施行・本人への直接通知</strong>）。
        </p>

        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>⑤ ストレスへの対処・軽減の方法</h4>
        <p style={{ marginBottom: '1rem' }}>
          問題焦点型・情動焦点型コーピングの使い分け、リラクセーション技法の生理学的メカニズム（副交感神経優位）。睡眠の目安（<strong>成人は6時間以上</strong>）などの具体的数値も出題されます。
        </p>

        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>⑥ 社内外資源の活用</h4>
        <p>
          産業医・保健師の守秘義務、EAP（匿名性・事業場外資源）、精神保健福祉センター・「こころの耳」などの公的窓口の役割。援助希求行動がセルフケアの重要スキルであることを理解する。
        </p>
      </div>
    </section>

    <section style={{ marginBottom: '2.5rem' }}>
      <h3><Clock size={18} style={{ display: 'inline', marginRight: '6px' }} />学習時間の目安と進め方</h3>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>学習者のタイプ</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>総学習時間の目安</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>推奨学習期間</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}>心理学・労務の初学者</td>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>30〜50時間</td>
              <td style={{ padding: '0.75rem' }}>1〜2ヶ月</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}>基礎知識を有する実務家</td>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>15〜30時間</td>
              <td style={{ padding: '0.75rem' }}>2週間〜1ヶ月</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem' }}>短期集中型（再受験等）</td>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>10〜15時間</td>
              <td style={{ padding: '0.75rem' }}>1〜2週間</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem' }}>
        <strong style={{ color: 'var(--primary)' }}>過去問主導型アプローチ（推奨）</strong>
        <ol style={{ fontSize: '0.875rem', margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
          <li><strong>公式テキストを1周通読：</strong>全体像と専門用語を把握する。</li>
          <li><strong>分野別過去問を実施：</strong>頻出項目と自身の弱点を特定する。</li>
          <li><strong>間違えた箇所をテキストで復習：</strong>「なぜその選択肢が正しいか説明できる」レベルへ。</li>
          <li><strong>本番形式の模擬試験：</strong>120分の時間感覚と問題を最後まで解く体験をする。</li>
        </ol>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
          ※ 1日1時間×1ヶ月継続が標準的な成功モデルです。
        </p>
      </div>
    </section>

    <section style={{ marginBottom: '2.5rem' }}>
      <h3><CheckCircle2 size={18} style={{ display: 'inline', marginRight: '6px' }} />試験当日のポイント</h3>
      <ul style={{ fontSize: '0.875rem', paddingLeft: '1.5rem' }}>
        <li><strong>時間は十分ある：</strong>{EXAM_CONFIG.duration}分で{EXAM_CONFIG.questionCount}あるため、1問に2分以上かけられます。落ち着いて読みましょう。</li>
        <li><strong>「最も適切なもの」に注意：</strong>「正しいもの」ではなく「最も適切なもの」を選ぶ問題が多いため、選択肢を全部読んでから比較します。</li>
        <li><strong>感覚で答えない：</strong>「なんとなく」ではなく、定義・法令・数値を根拠に選ぶ習慣をつけましょう。</li>
        <li><strong>数値は正確に：</strong>「50人以上」「年1回」「2015年」「{EXAM_CONFIG.passingScore}点以上」「6時間以上」などの数値は頻出です。</li>
      </ul>
    </section>

    <section style={{ marginBottom: '2.5rem' }}>
      <h3><FileText size={18} style={{ display: 'inline', marginRight: '6px' }} />合格後のステップアップ</h3>
      <p style={{ fontSize: '0.875rem' }}>
        Ⅲ種（セルフケアコース）の合格はメンタルヘルスの第一歩です。Ⅱ種（ラインケアコース）では部下・チームのメンタルヘルスマネジメントを、Ⅰ種（マスターコース）では企業全体の制度設計を学べます。ⅢとⅡは出題範囲が多く重複しているため、同時学習による相乗効果も期待できます。
      </p>
    </section>

    <section>
      <h3><AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />免責事項</h3>
      <p className="privacy-disclaimer">
        ⚠️ 本サイトは大阪商工会議所の公式サイトではありません。
        試験の出題範囲・申込方法・合否については必ず公式サイトをご確認ください。
      </p>
    </section>
  </div>
);
