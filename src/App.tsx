// mhm-g3/src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { modules } from './data/modules';
import { comprehensiveQuizQuestions } from './data/comprehensiveQuiz';
import { glossary } from './data/glossary';
import { Quiz } from './components/Quiz';
import { TermText } from './components/TermGlossary';
import { ExamGuide } from './components/ExamGuide';
import { buildUsecaseHtml } from './data/usecaseGuide';
import { chapterNames } from './data/chapters';
import { ChevronLeft, Book, LayoutDashboard, ArrowRight, Search as SearchIcon, X, Target, Trash2, FileText, Shuffle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRESS_KEY = 'mhm-g3-progress';

// 行頭の絵文字マーカーは装飾でなくテキストラベルへ（2026-08-06・O-2-8）。prerender.ts と同じ変換。
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

interface ProgressEntry { score: number; total: number; completedAt: string; }
type Progress = Record<string, ProgressEntry>;

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

type View = 'dashboard' | 'glossary' | 'randomquiz' | 'privacy' | 'about' | 'guide' | 'usecase' | 'not-found';

function App() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // Random quiz state
  const [rqQuestions, setRqQuestions] = useState<{ q: typeof modules[0]['quiz'][0]; moduleTitle: string; moduleId: string }[]>([]);
  const [rqIdx, setRqIdx] = useState(0);
  const [rqSelected, setRqSelected] = useState<number | null>(null);
  const [rqIsCorrect, setRqIsCorrect] = useState<boolean | null>(null);
  const [rqResults, setRqResults] = useState<{ moduleId: string; moduleTitle: string; correct: boolean }[]>([]);
  const [rqDone, setRqDone] = useState(false);

  const startRandomQuiz = useCallback(() => {
    const qs = [...comprehensiveQuizQuestions]
      .sort(() => Math.random() - 0.5)
      .map(({ moduleId, moduleTitle, ...q }) => ({ q, moduleTitle, moduleId }));
    setRqQuestions(qs);
    setRqIdx(0);
    setRqSelected(null);
    setRqIsCorrect(null);
    setRqResults([]);
    setRqDone(false);
    setView('randomquiz');
    window.scrollTo(0, 0);
  }, []);

  const rqHandleSelect = (idx: number) => {
    if (rqSelected !== null) return;
    setRqSelected(idx);
    const correct = idx === rqQuestions[rqIdx].q.correctAnswer;
    setRqIsCorrect(correct);
  };

  const rqNext = () => {
    const cur = rqQuestions[rqIdx];
    const correct = rqSelected === cur.q.correctAnswer;
    const newResults = [...rqResults, { moduleId: cur.moduleId, moduleTitle: cur.moduleTitle, correct }];
    if (rqIdx + 1 < rqQuestions.length) {
      setRqResults(newResults);
      setRqIdx(rqIdx + 1);
      setRqSelected(null);
      setRqIsCorrect(null);
      window.scrollTo(0, 0);
    } else {
      setRqResults(newResults);
      setRqDone(true);
      const correctCount = newResults.filter(r => r.correct).length;
      const entry: ProgressEntry = { score: correctCount, total: newResults.length, completedAt: new Date().toLocaleDateString('ja-JP') };
      const next = { ...loadProgress(), 'random-quiz': entry };
      saveProgress(next);
      setProgress(next);
      window.scrollTo(0, 0);
    }
  };

  const updateModuleId = useCallback((id: string | null) => {
    const basePath = window.location.pathname.startsWith('/mhm-g3/') ? '/mhm-g3' : '';
    const newPath = id ? `${basePath}/${id}/` : `${basePath}/`;
    window.history.pushState(null, '', newPath);

    if (!id) {
      setActiveModuleId(null);
      setView('dashboard');
    } else {
      setActiveModuleId(id);
      setView('dashboard');
    }
    setQuizCompleted(false);
    window.scrollTo(0, 0);
  }, []);

  const switchView = useCallback((newView: View) => {
    setActiveModuleId(null);
    setView(newView);
    const basePath = window.location.pathname.startsWith('/mhm-g3/') ? '/mhm-g3' : '';
    const newPath = newView === 'dashboard' ? `${basePath}/` : `${basePath}/${newView}/`;
    window.history.pushState(null, '', newPath);
    window.scrollTo(0, 0);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (window.confirm('学習進捗をすべてリセットしますか？\nこの操作は元に戻せません。')) {
      saveProgress({});
      setProgress({});
    }
  }, []);

  const handleQuizComplete = useCallback((moduleId: string, score: number, total: number) => {
    setQuizCompleted(true);
    const entry: ProgressEntry = { score, total, completedAt: new Date().toLocaleDateString('ja-JP') };
    const next = { ...loadProgress(), [moduleId]: entry };
    saveProgress(next);
    setProgress(next);
  }, []);

  useEffect(() => {
    const handlePath = () => {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];

      const isCustomView = ['glossary', 'privacy', 'about', 'guide', 'randomquiz', 'usecase'].includes(lastSegment || '');

      if (isCustomView) {
        setView(lastSegment as View);
        setActiveModuleId(null);
        if (lastSegment === 'privacy') document.title = 'プライバシーポリシー | メンタルヘルスマネジメント検定 Ⅲ種';
        else if (lastSegment === 'about') document.title = 'サイトについて | メンタルヘルスマネジメント検定 Ⅲ種';
        else if (lastSegment === 'guide') document.title = '試験ガイド | メンタルヘルスマネジメント検定 Ⅲ種';
        else if (lastSegment === 'usecase') document.title = '場面別 セルフケア逆引きガイド | メンタルヘルスマネジメント検定 Ⅲ種';
      } else if (lastSegment && lastSegment !== 'mhm-g3') {
        const found = modules.find(m => m.id === lastSegment);
        if (found) {
          setActiveModuleId(found.id);
          setView('dashboard');
          document.title = `${found.title} | メンタルヘルスマネジメント検定 Ⅲ種`;
        } else {
          setActiveModuleId(null);
          setView('not-found');
          document.title = 'ページが見つかりません | メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス';
        }
      } else {
        setActiveModuleId(null);
        setView('dashboard');
        document.title = 'メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス';
      }
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  const parseInlineContent = useCallback((text: string): React.ReactNode => {
    function parseInline(t: string): React.ReactNode {
      const regex = /(\*\*[\s\S]*?\*\*|\[\[term:.*?\]\][\s\S]*?\[\[\/term\]\]|\[\[care-layers\]\]|\[\[reintegration-flow\]\]|\[\[stress-cognitive-flow\]\]|\[\[stress-check-flow\]\]|\[\[line-care-flow\]\]|\[\[stress-response-types\]\])/g;
      const parts = t.split(regex);
      return (
        <>
          {parts.map((part, i) => {
            if (!part) return null;
            const key = `inline-${i}`;
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{parseInline(part.slice(2, -2))}</strong>;
            if (part.startsWith('[[term:')) {
              const idMatch = part.match(/\[\[term:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/term\]\]/);
              if (idMatch && contentMatch) return <TermText key={key} termId={idMatch[1]} onNavigate={updateModuleId} renderText={parseInline}>{contentMatch[1]}</TermText>;
            }
            if (part === '[[care-layers]]') return (
              <figure key={key} className="mhm-figure">
                <div className="care-layers" role="img" aria-label="4つのケアの内外関係：セルフケア（本人）を中心に、ラインケア、事業場内産業保健スタッフ、事業場外資源へと層が広がる図">
                  <div className="care-layer care-layer-4">
                    <span className="care-layer-tag">事業場外</span>
                    <span className="care-layer-name">④ 事業場外資源によるケア</span>
                    <span className="care-layer-sub">EAP・精神保健福祉センター等（匿名性が高い）</span>
                    <div className="care-layer care-layer-3">
                      <span className="care-layer-tag">事業場内</span>
                      <span className="care-layer-name">③ 事業場内産業保健スタッフ等によるケア</span>
                      <span className="care-layer-sub">産業医・保健師・人事労務担当者</span>
                      <div className="care-layer care-layer-2">
                        <span className="care-layer-tag">職場</span>
                        <span className="care-layer-name">② ラインによるケア</span>
                        <span className="care-layer-sub">管理監督者（直属の上司）</span>
                        <div className="care-layer care-layer-1">
                          <span className="care-layer-tag">本人</span>
                          <span className="care-layer-name">① セルフケア</span>
                          <span className="care-layer-sub">労働者自身</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <figcaption className="mhm-fig-cap">
                  「4つのケア」は並列の4項目ではなく、<strong>労働者本人を中心に、内側から外側へ層をなす</strong>関係にある。①セルフケア（本人）→②ラインによるケア（直属の上司）→③事業場内産業保健スタッフ（産業医・保健師）→④事業場外資源（EAP等）の順で、外側に行くほど専門性・匿名性が高まる。内側の層で対応しきれない場合に、外側の層へつなぐ（早期発見・早期対応の連携）。
                </figcaption>
              </figure>
            );
            if (part === '[[reintegration-flow]]') return (
              <figure key={key} className="mhm-figure">
                <svg viewBox="0 0 340 432" role="img" aria-label="職場復帰支援の5ステップの流れ：第1ステップ病気休業開始から第5ステップ職場復帰後のフォローアップまで" className="mhm-fig-svg">
                  <rect x="20" y="10" width="300" height="62" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="32" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--primary-text)">第1ステップ</text>
                  <text x="170" y="53" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">病気休業開始及び休業中のケア</text>

                  <line x1={170} y1={72} x2={170} y2={90} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,94 165,86 175,86" fill="#94a3b8" />

                  <rect x="20" y="94" width="300" height="62" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="116" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text-muted)">第2ステップ</text>
                  <text x="170" y="137" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">主治医による職場復帰可能の判断</text>

                  <line x1={170} y1={156} x2={170} y2={174} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,178 165,170 175,170" fill="#94a3b8" />

                  <rect x="20" y="178" width="300" height="76" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="199" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text-muted)">第3ステップ</text>
                  <text x="170" y="221" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">職場復帰の可否の判断及び</text>
                  <text x="170" y="239" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">職場復帰支援プランの作成</text>

                  <line x1={170} y1={254} x2={170} y2={272} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,276 165,268 175,268" fill="#94a3b8" />

                  <rect x="20" y="276" width="300" height="62" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="298" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text-muted)">第4ステップ</text>
                  <text x="170" y="319" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">最終的な職場復帰の決定</text>

                  <line x1={170} y1={338} x2={170} y2={356} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,360 165,352 175,352" fill="#94a3b8" />

                  <rect x="20" y="360" width="300" height="62" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="382" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--primary-text)">第5ステップ</text>
                  <text x="170" y="403" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">職場復帰後のフォローアップ</text>
                </svg>
                <figcaption className="mhm-fig-cap">
                  職場復帰支援は、厚生労働省の手引きが定める<strong>第1〜第5ステップ</strong>を段階的にたどる。第1ステップ（休業開始・休業中のケア）と第2ステップ（主治医の職場復帰可能の判断）を経て、第3ステップで産業医・事業者・人事が連携して<strong>職場復帰の可否の判断と支援プランの作成</strong>を行う。第4ステップで事業者が最終決定し、復帰後も第5ステップとしてフォローアップが続く。「主治医の判断＝即復帰」ではなく、第3・第4ステップの手続きを経ることが試験の要点。
                </figcaption>
              </figure>
            );
            if (part === '[[stress-cognitive-flow]]') return (
              <figure key={key} className="mhm-figure">
                <svg viewBox="0 0 340 264" role="img" aria-label="ストレス発生のプロセス：ストレッサーが認知的評価を経てストレス反応につながり、評価の違いが個人差を生む" className="mhm-fig-svg">
                  <rect x="95" y="10" width="150" height="40" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="35" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">ストレッサー</text>

                  <line x1={170} y1={50} x2={170} y2={64} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,68 165,60 175,60" fill="#94a3b8" />

                  <rect x="60" y="68" width="220" height="76" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="90" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--primary-text)">認知的評価</text>
                  <text x="170" y="112" textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">「これは脅威になるか？」</text>
                  <text x="170" y="134" textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">「対処できる資源があるか？」</text>

                  <line x1={170} y1={144} x2={170} y2={160} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={90} y1={160} x2={250} y2={160} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={90} y1={160} x2={90} y2={176} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={250} y1={160} x2={250} y2={176} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="90,180 85,172 95,172" fill="#94a3b8" />
                  <polygon points="250,180 245,172 255,172" fill="#94a3b8" />

                  <rect x="15" y="180" width="150" height="70" rx="8" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeWidth={1.4} />
                  <text x="90" y="205" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">脅威と評価</text>
                  <text x="90" y="233" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--accent)">ストレス反応：強い</text>

                  <rect x="175" y="180" width="150" height="70" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="250" y="205" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">対処可能と評価</text>
                  <text x="250" y="233" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text)">ストレス反応：弱い</text>
                </svg>
                <figcaption className="mhm-fig-cap">
                  同じ<strong>ストレッサー</strong>（原因）を受けても、ストレス反応の強さは人によって異なる。この差を生むのが<strong>認知的評価</strong>：「これは自分にとって脅威か」「対処できる資源があるか」という受け取り方である。強い脅威と評価すればストレス反応は強くなり（本文のBさん）、対処可能と捉えれば反応は弱く済む（Aさん）。ストレッサーの強さそのものより、認知的評価の違いが個人差の正体。
                </figcaption>
              </figure>
            );
            if (part === '[[stress-check-flow]]') return (
              <figure key={key} className="mhm-figure">
                <svg viewBox="0 0 340 262" role="img" aria-label="ストレスチェック実施の流れ：実施から結果通知、本人の同意を経て初めて事業者に結果が伝わる分岐" className="mhm-fig-svg">
                  <rect x="95" y="10" width="150" height="40" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="35" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">ストレスチェック実施</text>

                  <line x1={170} y1={50} x2={170} y2={66} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,70 165,62 175,62" fill="#94a3b8" />

                  <rect x="60" y="70" width="220" height="40" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="95" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--primary-text)">結果を本人に直接通知</text>

                  <line x1={170} y1={110} x2={170} y2={124} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={90} y1={124} x2={250} y2={124} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={90} y1={124} x2={90} y2={138} stroke="#94a3b8" strokeWidth={1.6} />
                  <line x1={250} y1={124} x2={250} y2={138} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="90,142 85,134 95,134" fill="#94a3b8" />
                  <polygon points="250,142 245,134 255,134" fill="#94a3b8" />

                  <rect x="15" y="142" width="150" height="108" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="90" y="181" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">本人が同意しない</text>
                  <text x="90" y="211" textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">伝わらない（終了）</text>

                  <rect x="175" y="142" width="150" height="108" rx="8" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeWidth={1.4} />
                  <text x="250" y="166" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">本人が同意する</text>
                  <text x="250" y="186" textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">事業者に結果提供</text>
                  <text x="250" y="206" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--accent)">高ストレス者は</text>
                  <text x="250" y="226" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--accent)">面接指導を申出可</text>
                </svg>
                <figcaption className="mhm-fig-cap">
                  ストレスチェックは年1回、医師・保健師等が実施し、結果は<strong>まず本人に直接通知</strong>される。事業者が結果を知るには<strong>本人の同意</strong>が必要で、同意しなければ高ストレスであってもその事実は事業者に伝わらない（左）。同意した場合に限り事業者は結果を把握でき、高ストレス者本人が希望すれば医師による面接指導を実施する（右）。「本人の同意」が事業者への情報伝達の唯一の入り口であることが、この制度のプライバシー保護の核心。
                </figcaption>
              </figure>
            );
            if (part === '[[line-care-flow]]') return (
              <figure key={key} className="mhm-figure">
                <svg viewBox="0 0 340 300" role="img" aria-label="ラインによるケアの流れ：いつもと違う部下に気づく→話を聴く→産業医等につなぐ。管理監督者自身は病気の診断をしない" className="mhm-fig-svg">
                  <rect x="40" y="10" width="260" height="56" rx="8" fill="var(--bg-warm)" stroke="var(--border-medium)" strokeWidth={1.4} />
                  <text x="170" y="33" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text)">「いつもと違う」部下に気づく</text>
                  <text x="170" y="53" textAnchor="middle" fontSize={12} fill="var(--text-muted)">遅刻・欠勤増加、残業の不自然な増減など</text>

                  <line x1={170} y1={66} x2={170} y2={82} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,86 165,78 175,78" fill="#94a3b8" />

                  <rect x="60" y="86" width="220" height="44" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="114" textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--primary-text)">話を聴く（傾聴）</text>

                  <line x1={170} y1={130} x2={170} y2={146} stroke="#94a3b8" strokeWidth={1.6} />
                  <polygon points="170,150 165,142 175,142" fill="#94a3b8" />

                  <rect x="60" y="150" width="220" height="56" rx="8" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.6} />
                  <text x="170" y="173" textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--primary-text)">産業医等の専門家につなぐ</text>
                  <text x="170" y="193" textAnchor="middle" fontSize={12} fill="var(--text-muted)">病気かどうかの判断はしない</text>

                  <line x1={170} y1={206} x2={170} y2={222} stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="3,2" />
                  <rect x="30" y="222" width="280" height="62" rx="8" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeWidth={1.4} />
                  <text x="170" y="246" textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--accent)">✕ 管理監督者が病気だと決めつける</text>
                  <text x="170" y="266" textAnchor="middle" fontSize={12} fill="var(--text-muted)">診断は医師の仕事。ここが頻出の引っかけ</text>
                </svg>
                <figcaption className="mhm-fig-cap">
                  ラインによるケアの核心は、<strong>「いつもと違う」部下への気付き</strong>から始まり、<strong>話を聴いたうえで産業医等の専門家につなぐ</strong>ところまで。管理監督者自身が病気かどうかを診断することは求められておらず、むしろ<strong>してはいけない</strong>（診断は医師の仕事）。このほか、部下からの相談への日常的な対応、職場環境等の把握と改善もラインによるケアの柱（厚生労働省「労働者の心の健康の保持増進のための指針」）。
                </figcaption>
              </figure>
            );
            if (part === '[[stress-response-types]]') return (
              <figure key={key} className="mhm-figure">
                <div className="stress-types" role="img" aria-label="1つのストレス反応が、身体的反応・心理的反応・行動的反応の3つの側面に同時に現れることを示す図">
                  <div className="stress-source-row">
                    <span className="stress-source-pill">1つのストレス反応</span>
                  </div>
                  <div className="stress-source-arrow" aria-hidden="true">↓ 同時に現れうる ↓</div>
                  <div className="stress-type-cols">
                  <div className="stress-type-col stress-type-body">
                    <span className="stress-type-label">身体的反応</span>
                    <ul>
                      <li>頭痛・肩こり</li>
                      <li>胃痛・消化器症状</li>
                      <li>不眠・疲労感</li>
                      <li>動悸・発汗</li>
                    </ul>
                  </div>
                  <div className="stress-type-col stress-type-mind">
                    <span className="stress-type-label">心理的反応</span>
                    <ul>
                      <li>不安・焦り</li>
                      <li>抑うつ感</li>
                      <li>集中力・記憶力の低下</li>
                      <li>感情の不安定さ・イライラ</li>
                    </ul>
                  </div>
                  <div className="stress-type-col stress-type-behavior">
                    <span className="stress-type-label">行動的反応</span>
                    <ul>
                      <li>遅刻・欠勤の増加</li>
                      <li>飲酒・喫煙量の増加</li>
                      <li>作業ミスの増加</li>
                      <li>コミュニケーションの回避</li>
                    </ul>
                  </div>
                  </div>
                </div>
                <figcaption className="mhm-fig-cap">
                  ストレス反応は<strong>身体・心理・行動</strong>の3つの側面に現れる。どれか1つとは限らず、複数が同時に、あるいは本人も気づかないまま進行することがある。「なんとなく調子が悪い」という段階で3側面のサインに気づくことが、セルフケアの第一歩。
                </figcaption>
              </figure>
            );
            return <span key={key} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
          })}
        </>
      );
    }
    return parseInline(text);
  }, [updateModuleId]);

  const parseContent = useCallback((text: string): React.ReactNode => {
    if (!text) return null;
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let currentOList: React.ReactNode[] = [];
    let tableLines: string[] = [];

    const flushList = (key: string) => {
      if (currentList.length > 0) {
        result.push(<ul key={`list-${key}`}>{currentList}</ul>);
        currentList = [];
      }
    };
    const flushOList = (key: string) => {
      if (currentOList.length > 0) {
        result.push(<ol key={`olist-${key}`}>{currentOList}</ol>);
        currentOList = [];
      }
    };
    const flushTable = (key: string) => {
      if (tableLines.length < 2) { tableLines = []; return; }
      const rows = tableLines.map(r =>
        r.split('|').slice(1, -1).map(cell => cell.trim())
      );
      const isSep = (r: string[]) => r.every(c => /^[-:]+$/.test(c));
      const headerRow = rows[0];
      const dataRows = rows.slice(1).filter(r => !isSep(r));
      result.push(
        <div key={`table-${key}`} className="content-table-wrap">
          <table className="content-table">
            <thead>
              <tr>{headerRow.map((cell, ci) => <th key={ci}>{parseInlineContent(cell)}</th>)}</tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{parseInlineContent(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableLines = [];
    };

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      const key = `line-${lineIdx}`;

      if (trimmedLine.startsWith('|')) {
        flushList(key); flushOList(key);
        tableLines.push(trimmedLine);
        return;
      }
      if (tableLines.length > 0) { flushTable(key); }

      if (trimmedLine.startsWith('#### ')) { flushList(key); flushOList(key); result.push(<h4 key={key} className="content-h4">{parseInlineContent(stripLeadingMarker(trimmedLine.slice(5)))}</h4>); return; }
      if (trimmedLine.startsWith('### ')) { flushList(key); flushOList(key); result.push(<h3 key={key} className="content-h3">{parseInlineContent(stripLeadingMarker(trimmedLine.slice(4)))}</h3>); return; }
      if (trimmedLine.startsWith('## ')) { flushList(key); flushOList(key); result.push(<h2 key={key} className="content-h2">{parseInlineContent(stripLeadingMarker(trimmedLine.slice(3)))}</h2>); return; }
      if (trimmedLine.startsWith('---')) { flushList(key); flushOList(key); result.push(<hr key={key} className="content-hr" />); return; }
      if (trimmedLine.startsWith('- ')) { flushOList(key); currentList.push(<li key={`li-${lineIdx}`}>{parseInlineContent(trimmedLine.slice(2))}</li>); return; }
      const olMatch = trimmedLine.match(/^(\d+)\. (.+)/);
      if (olMatch) { flushList(key); currentOList.push(<li key={`oli-${lineIdx}`}>{parseInlineContent(olMatch[2])}</li>); return; }
      if (trimmedLine === '') { flushList(key); flushOList(key); return; }
      flushList(key); flushOList(key);
      const markerKey = Object.keys(LINE_MARKERS).find((mk) => trimmedLine.startsWith(mk));
      if (markerKey) {
        const rest = trimmedLine.slice(markerKey.length).trim();
        // 本文が自前の太字ラベルで始まっていれば、そちらを使いマーカー由来のラベルは出さない（stats-g3と同じ規則・二重表示防止）。
        const own = rest.match(/^\*\*([^*]+[：:])\*\*\s*/);
        const label = own ? own[1].replace(/[：:]$/, '') : LINE_MARKERS[markerKey];
        const body = own ? rest.slice(own[0].length) : rest;
        result.push(<p key={key} className="content-p"><strong style={{ color: '#2563eb' }}>{label}：</strong>{parseInlineContent(body)}</p>);
        return;
      }
      result.push(<p key={key} className="content-p">{parseInlineContent(line)}</p>);
    });
    flushTable('final');
    flushList('final');
    flushOList('final');
    return <>{result}</>;
  }, [parseInlineContent]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId), [activeModuleId]);
  const nextModule = useMemo(() => {
    if (!activeModuleId) return null;
    const idx = modules.findIndex(m => m.id === activeModuleId);
    return idx >= 0 && idx < modules.length - 1 ? modules[idx + 1] : null;
  }, [activeModuleId]);

  const completedCount = modules.filter(m => progress[m.id]).length;
  const totalModules = modules.length;

  return (
    <div className="container" style={{ maxWidth: activeModuleId ? '800px' : view === 'glossary' ? '1000px' : '800px' }}>
      <header className="header">
        <h1 className="title" onClick={() => updateModuleId(null)} style={{ cursor: 'pointer' }}>メンタルヘルスマネジメント検定 Ⅲ種</h1>
        <p className="subtitle">セルフケアコース 学習リファレンス</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>全{modules.length}モジュール・{modules.reduce((s, m) => s + m.quiz.length, 0)}問クイズ・用語集で合格をサポート</p>
      </header>

      {!activeModuleId && (
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => switchView('dashboard')} className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> ロードマップ
            {completedCount > 0 && <span className="nav-progress-badge">{completedCount}/{totalModules}</span>}
          </button>
          {completedCount > 0 && (
            <button onClick={handleResetProgress} className="nav-tab" style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }} title="学習進捗をリセット">
              <Trash2 size={14} /> リセット
            </button>
          )}
          <button onClick={() => switchView('glossary')} className={`nav-tab ${view === 'glossary' ? 'active' : ''}`}>
            <Book size={18} /> 用語集
          </button>
          <button onClick={startRandomQuiz} className={`nav-tab ${view === 'randomquiz' ? 'active' : ''}`}>
            <Shuffle size={18} /> 全範囲クイズ
          </button>
          <button onClick={() => switchView('guide')} className={`nav-tab ${view === 'guide' ? 'active' : ''}`}>
            <Target size={18} /> 試験ガイド
          </button>
          <button onClick={() => switchView('usecase')} className={`nav-tab ${view === 'usecase' ? 'active' : ''}`}>
            <Book size={18} /> 逆引きガイド
          </button>
        </nav>
      )}

      <main>
        <AnimatePresence mode="wait">
          {activeModuleId ? (
            <motion.div key={activeModuleId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <button className="btn-back" onClick={() => updateModuleId(null)}><ChevronLeft size={18} /> 一覧に戻る</button>
              <div className="card">
                <span className="badge-chapter">Chapter {activeModule?.chapter}</span>
                <h2 style={{ marginTop: '0.5rem' }}>{parseContent(activeModule?.title || '')}</h2>
                <div className="content-body">{activeModule && parseContent(activeModule.content)}</div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Quiz
                  key={activeModuleId}
                  questions={activeModule?.quiz || []}
                  onComplete={(score, total) => handleQuizComplete(activeModuleId, score, total)}
                  renderContent={parseContent}
                />
              </div>
              {quizCompleted && (
                <div style={{ marginTop: '1rem' }}>
                  {activeModuleId && progress[activeModuleId] && (
                    <div className="score-banner">
                      {progress[activeModuleId].score} / {progress[activeModuleId].total} 問正解
                      {progress[activeModuleId].score === progress[activeModuleId].total && ' 🎉 パーフェクト！'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => updateModuleId(null)} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text)', border: '1px solid #e2e8f0' }}>
                      <ChevronLeft size={16} /> 一覧に戻る
                    </button>
                    {nextModule && (
                      <button className="btn" onClick={() => updateModuleId(nextModule.id)} style={{ flex: 2 }}>
                        次のモジュールへ：{nextModule.title} <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === 'randomquiz' ? (
            <motion.div key="rq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <button className="btn-back" onClick={() => switchView('dashboard')}><ChevronLeft size={18} /> 一覧に戻る</button>
              {rqDone ? (
                <div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {rqResults.filter(r => r.correct).length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {rqResults.length} 問正解</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>全範囲クイズ完了</p>
                  </div>
                  {(() => {
                    const byModule: Record<string, { title: string; correct: number; total: number }> = {};
                    rqResults.forEach(r => {
                      if (!byModule[r.moduleId]) byModule[r.moduleId] = { title: r.moduleTitle, correct: 0, total: 0 };
                      byModule[r.moduleId].total++;
                      if (r.correct) byModule[r.moduleId].correct++;
                    });
                    const weak = Object.entries(byModule).filter(([, v]) => v.correct < v.total);
                    return (
                      <div className="card">
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>モジュール別結果</h3>
                        {Object.entries(byModule).map(([id, v]) => (
                          <div key={id} className="rq-result-row">
                            <span className={`rq-result-dot ${v.correct === v.total ? 'ok' : 'ng'}`} />
                            <span style={{ flex: 1, fontSize: '0.85rem' }}>{v.title}</span>
                            <span style={{ fontSize: '0.8rem', color: v.correct === v.total ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{v.correct}/{v.total}</span>
                          </div>
                        ))}
                        {weak.length > 0 && (
                          <div style={{ marginTop: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>復習が必要なモジュール：</p>
                            <div className="links-row">
                              {weak.map(([id, v]) => (
                                <button key={id} className="btn-link" onClick={() => updateModuleId(id)}>
                                  {v.title} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button className="btn" onClick={startRandomQuiz} style={{ marginTop: '0.5rem' }}>
                    <Shuffle size={16} /> もう一度
                  </button>
                </div>
              ) : rqQuestions.length > 0 ? (
                <div className="card" style={{ border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>全範囲クイズ</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rqQuestions[rqIdx].moduleTitle}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rqIdx + 1} / {rqQuestions.length}
                    </span>
                  </div>
                  <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>
                    {parseContent(rqQuestions[rqIdx].q.question)}
                  </div>
                  <div className="quiz-options">
                    {rqQuestions[rqIdx].q.options.map((opt, i) => (
                      <button
                        key={`rq-${rqIdx}-${i}`}
                        className="btn"
                        style={{
                          background: rqSelected !== null
                            ? (i === rqQuestions[rqIdx].q.correctAnswer ? '#166534' : (rqSelected === i ? '#b91c1c' : '#ffffff'))
                            : '#ffffff',
                          color: rqSelected !== null && (i === rqQuestions[rqIdx].q.correctAnswer || rqSelected === i) ? 'white' : 'var(--text)',
                          justifyContent: 'space-between',
                          border: rqSelected !== null && (i === rqQuestions[rqIdx].q.correctAnswer || rqSelected === i) ? 'none' : '1px solid #e2e8f0',
                          opacity: rqSelected !== null && rqSelected !== i && i !== rqQuestions[rqIdx].q.correctAnswer ? 0.6 : 1,
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          boxShadow: 'none',
                          fontWeight: 500,
                          fontSize: '0.9rem',
                        }}
                        onClick={() => rqHandleSelect(i)}
                      >
                        <div style={{ flex: 1 }}>{parseContent(opt)}</div>
                        {rqSelected !== null && i === rqQuestions[rqIdx].q.correctAnswer && <CheckCircle2 size={18} />}
                        {rqSelected === i && i !== rqQuestions[rqIdx].q.correctAnswer && <XCircle size={18} />}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {rqSelected !== null && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                          <strong style={{ color: rqIsCorrect ? '#166534' : '#b91c1c' }}>{rqIsCorrect ? '正解！' : '不正解...'}</strong><br />
                          {parseContent(rqQuestions[rqIdx].q.explanation)}
                        </p>
                        <button className="btn" style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }} onClick={rqNext}>
                          {rqIdx + 1 < rqQuestions.length ? '次の問題へ' : '結果を見る'} <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="card" style={{ border: '1px solid #e2e8f0', textAlign: 'center', padding: '2rem' }}>
                  <Shuffle size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '0.5rem' }}>全範囲クイズ</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>全モジュールからランダムに出題します。</p>
                  <button className="btn" onClick={startRandomQuiz} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                    <Shuffle size={16} /> クイズを始める
                  </button>
                </div>
              )}
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="search-container">
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input type="text" placeholder="トピックを検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={16} /></button>}
                </div>
              </div>
              <div className="roadmap-grid">
                {filteredModules.reduce<React.ReactNode[]>((acc, m, idx) => {
                  const prev = filteredModules[idx - 1];
                  if (!prev || prev.chapter !== m.chapter) {
                    acc.push(
                      <div key={`ch-${m.chapter}`} className="chapter-header">
                        <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>Chapter {m.chapter}</span>
                        <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>{chapterNames[m.chapter]}</h3>
                      </div>
                    );
                  }
                  const p = progress[m.id];
                  acc.push(
                    <div key={m.id} className="card-module" onClick={() => updateModuleId(m.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-chapter">Chapter {m.chapter}</span>
                        {p && (
                          <span className={`progress-badge ${p.score === p.total ? 'perfect' : ''}`}>
                            {p.score === p.total ? '✓ ' : ''}{p.score}/{p.total}問
                          </span>
                        )}
                      </div>
                      <h4>{parseContent(m.title)}</h4>
                      <div className="module-desc">{parseContent(m.description)}</div>
                    </div>
                  );
                  return acc;
                }, [])}
              </div>
            </motion.div>
          ) : view === 'glossary' ? (
            <motion.div key="glossary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>用語集</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>メンタルヘルスマネジメント検定Ⅲ種の頻出用語をまとめました。</p>
              </div>
              <div className="glossary-grid">
                {Object.values(glossary).map(term => {
                  const levelColor = { '基礎': '#22c55e', '中級': '#eab308', '上級': '#ef4444' }[term.level];
                  return (
                    <div key={term.id} className="card-glossary">
                      <div className="glossary-header">
                        <h4>{term.term}</h4>
                        <span className="badge-level" style={{ background: `${levelColor}22`, color: levelColor }}>{term.level}</span>
                      </div>
                      <p className="glossary-explanation">{term.explanation}</p>
                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div className="related-links">
                          <p className="label-related">関連用語</p>
                          <div className="links-row">
                            {term.relatedTerms.map(rtid => (
                              <span key={rtid} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                                {glossary[rtid]?.term || rtid}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : view === 'about' ? (
            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>サイトについて</h2>

                <section>
                  <h3>このサイトについて</h3>
                  <p>「メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス」は、メンタルヘルスマネジメント検定Ⅲ種（セルフケアコース）の合格を目指す方のために作られた、個人運営の学習支援サイトです。</p>
                  <p>ストレスの仕組み・セルフケアの実践・社内外の相談資源など、試験に必要な知識をわかりやすく解説しています。</p>
                  <p className="privacy-disclaimer"><strong>注意：</strong>本サイトは大阪商工会議所の公式サイトではありません。試験の最新情報・申込方法・合否については、必ず公式サイトをご確認ください。</p>
                </section>

                <section>
                  <h3>コンテンツ構成</h3>
                  <ul>
                    <li><strong>学習モジュール（全{modules.length}モジュール）</strong>：{modules.map(m => m.title).join('・')}</li>
                    <li><strong>用語集</strong>：Ⅲ種頻出用語の解説</li>
                    <li><strong>全範囲クイズ</strong>：全モジュールからランダム出題</li>
                  </ul>
                </section>

                <section>
                  <h3>編集・制作方針</h3>
                  <p>本サイトのコンテンツは、メンタルヘルス・マネジメント検定（Ⅲ種）の公式の出題範囲や、一般に流通している関連書籍を参照しつつ、運営者が内容を一から再構成し、初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。</p>
                  <p>用語集・確認問題は、すべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
                </section>

                <section>
                  <h3>運営者について</h3>
                  <p>本サイトは、資格学習を個人的に進める中で、同じように学んでいる方の助けになればと思い作成・公開しています。</p>
                  <p>お問い合わせは<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">こちらのGoogleフォーム</a>からお願いします。</p>
                </section>

                <section>
                  <h3>免責事項</h3>
                  <p>本サイトの解説・問題は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは検定への合格を保証するものではありません。</p>
                </section>
              </div>
            </motion.div>
          ) : view === 'guide' ? (
            <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ExamGuide />
            </motion.div>
          ) : view === 'usecase' ? (
            <motion.div key="usecase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div dangerouslySetInnerHTML={{ __html: buildUsecaseHtml(window.location.pathname.startsWith('/mhm-g3/') ? '/mhm-g3' : '') }} />
            </motion.div>
          ) : view === 'privacy' ? (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>プライバシーポリシー</h2>
                <p className="privacy-updated">最終更新：2026年4月</p>

                <section>
                  <h3>1. サイトについて</h3>
                  <p>本サイト「メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス」は、メンタルヘルスマネジメント検定Ⅲ種の学習を支援することを目的とした個人運営のサイトです。</p>
                  <p className="privacy-disclaimer"><strong>注意：</strong>本サイトは大阪商工会議所の公式サイトではありません。試験の出題範囲・申込方法・合否については、必ず公式サイトをご確認ください。</p>
                </section>

                <section>
                  <h3>2. 学習進捗データについて</h3>
                  <p>クイズの得点・完了状況は、お使いのブラウザの <strong>ローカルストレージ</strong> にのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。ブラウザのデータ削除により消去されます。</p>
                </section>

                <section>
                  <h3>3. コンテンツの免責事項</h3>
                  <p>本サイトの解説・問題は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。</p>
                </section>

                <section>
                  <h3>4. 本ポリシーの変更</h3>
                  <p>本ポリシーは予告なく変更される場合があります。変更後のポリシーはこのページへの掲載をもって効力を生じます。</p>
                </section>
              </div>
            </motion.div>
          ) : view === 'not-found' ? (
            <motion.div key="not-found" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</p>
                <h2 style={{ marginBottom: '0.5rem' }}>ページが見つかりません</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>指定されたページは存在しません。</p>
                <button className="btn" style={{ display: 'inline-flex', width: 'auto' }} onClick={() => updateModuleId(null)}>
                  トップに戻る
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className="site-footer">
        <p className="footer-disclaimer">
          本サイトは個人による学習支援サイトであり、大阪商工会議所の公式サイトではありません。掲載内容は個人の見解に基づくものであり、公式の情報を保証するものではありません。
        </p>
        <div className="footer-links">
          <button className="footer-link" onClick={() => switchView('about')}>サイトについて</button>
          <button className="footer-link" onClick={() => switchView('privacy')}>プライバシーポリシー</button>
          <a className="footer-link" href="https://study-apps.com/editorial-policy/">編集方針</a>
        </div>
        <p className="footer-copy">© 2026 メンタルヘルスマネジメント検定 Ⅲ種 学習リファレンス</p>
      </footer>
    </div>
  );
}

export default App;
