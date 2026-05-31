// mhm-g3/src/data/glossary.ts

export interface Term {
  id: string;
  term: string;
  explanation: string;
  level: '基礎' | '中級' | '上級';
  scope: 'Ⅲ種';
  relatedTerms?: string[];
}

export const glossary: Record<string, Term> = {
  'mental-health': {
    id: 'mental-health',
    term: 'メンタルヘルス',
    explanation: '精神的な健康状態のこと。単に「精神疾患がない」というだけでなく、自分の能力を発揮でき、日常の生活上のストレスに対処でき、生産的に働き、地域に貢献できるような良好な状態を指します（WHO定義）。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'stress-response', 'coping']
  },
  'stressor': {
    id: 'stressor',
    term: 'ストレッサー',
    explanation: 'ストレスを引き起こす原因となる外部からの刺激や要因のこと。職場での過重労働・対人関係・役割の不明確さ、また環境要因（騒音・温度など）もストレッサーになります。ストレッサーが直接ストレス反応を起こすのではなく、個人の「認知的評価」を介します。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['stress-response', 'cognitive-appraisal', 'coping']
  },
  'stress-response': {
    id: 'stress-response',
    term: 'ストレス反応',
    explanation: 'ストレッサーによって引き起こされる身体・心理・行動面の変化。身体反応（頭痛・胃痛・疲労感）、心理反応（不安・抑うつ・集中力低下）、行動反応（飲酒量増加・遅刻・作業ミス増加）に分けられます。早期に気づくことがセルフケアの第一歩です。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'gas', 'coping']
  },
  'coping': {
    id: 'coping',
    term: 'コーピング（ストレス対処）',
    explanation: 'ストレッサーやそれによる情動的な苦痛を管理・軽減するための意識的な努力のこと。大きく「問題焦点型コーピング」（ストレッサーそのものを解決する）と「情動焦点型コーピング」（気持ちを落ち着かせる）に分けられます。どちらが優れているわけではなく、状況に応じた使い分けが重要です。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['problem-focused', 'emotion-focused', 'stressor']
  },
  'problem-focused': {
    id: 'problem-focused',
    term: '問題焦点型コーピング',
    explanation: 'ストレスの原因（ストレッサー）そのものを解決・軽減しようとする対処法。例：「仕事量が多すぎる」なら上司と業務量を交渉する、「スキル不足」なら勉強する、など。ストレッサーが変えられる状況に有効です。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['emotion-focused', 'coping']
  },
  'emotion-focused': {
    id: 'emotion-focused',
    term: '情動焦点型コーピング',
    explanation: 'ストレスによって生じる不快な感情・気分を和らげる対処法。例：友人に話を聞いてもらう、趣味に没頭する、リラクセーション技法を行う、など。ストレッサー自体を変えられない状況（避けられない締め切りなど）に特に有効です。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['problem-focused', 'coping', 'relaxation']
  },
  'gas': {
    id: 'gas',
    term: '一般適応症候群（GAS）',
    explanation: 'ハンス・セリエが提唱したストレス反応の3段階モデル。①警告反応期：ストレッサーに接した直後、身体が急激に反応する時期（ショック相→反ショック相）。②抵抗期：ストレッサーへの適応が続く時期、一見安定しているが内部では消耗が続く。③疲憊期：適応力が限界を超え、機能が低下する時期。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'stress-response', 'burnout']
  },
  'four-care': {
    id: 'four-care',
    term: '4つのケア',
    explanation: '厚生労働省「労働者の心の健康の保持増進のための指針」に定められた、職場のメンタルヘルスケアの4つの取り組み主体。①セルフケア（労働者自身）、②ラインによるケア（管理監督者）、③事業場内産業保健スタッフ等によるケア、④事業場外資源によるケア。Ⅲ種は①セルフケアに重点を置きます。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['self-care', 'line-care', 'eap']
  },
  'self-care': {
    id: 'self-care',
    term: 'セルフケア',
    explanation: '4つのケアの1つ。労働者が自分自身のストレスや心の健康に気づき、適切に対処するための取り組み。具体的には：ストレスへの気づき、ストレスの原因の把握、コーピングの実践、困ったときに相談する力（援助希求行動）など。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['four-care', 'coping', 'stress-check']
  },
  'line-care': {
    id: 'line-care',
    term: 'ラインによるケア',
    explanation: '4つのケアの1つ。管理監督者（上司）が、部下の日常の変化に気づき、相談に対応し、職場環境の改善を行うケアのこと。Ⅱ種（ラインケアコース）の中心テーマです。管理監督者はメンタルヘルスの専門家ではありませんが、早期発見・早期対応の重要な役割を担います。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['four-care', 'self-care']
  },
  'eap': {
    id: 'eap',
    term: 'EAP（従業員支援プログラム）',
    explanation: '事業場外資源によるケアの代表例。外部の専門機関が提供するカウンセリング・相談サービスで、従業員が匿名で利用できることが多い。会社に知られずに専門家に相談できる点が特徴で、援助希求のハードルを下げる効果があります。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['four-care', 'industrial-physician']
  },
  'industrial-physician': {
    id: 'industrial-physician',
    term: '産業医',
    explanation: '事業場において労働者の健康管理を行う医師。50人以上の事業場では選任が義務付けられています。メンタルヘルス不調の従業員への面接指導、ストレスチェックの実施体制への協力、職場環境改善への助言などを行います。産業医への相談は会社の人事に直接報告されるわけではなく、守秘義務があります。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['stress-check', 'eap', 'four-care']
  },
  'stress-check': {
    id: 'stress-check',
    term: 'ストレスチェック制度',
    explanation: '2015年（平成27年）の労働安全衛生法改正で義務化された制度。50人以上の事業場では年1回の実施が義務。労働者のストレスの程度を把握し、本人へのフィードバックと職場改善に活用します。高ストレス者には医師による面接指導が行われます。結果は本人の同意なしに事業者に提供されません。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['self-care', 'industrial-physician']
  },
  'cognitive-appraisal': {
    id: 'cognitive-appraisal',
    term: '認知的評価',
    explanation: 'ラザルスとフォークマンが提唱した概念。同じストレッサーに直面しても、個人がそれをどう「評価（解釈）」するかによって、ストレス反応の大きさが変わるという考え方。「一次的評価」（これは脅威か？）と「二次的評価」（自分は対処できるか？）からなります。認知の歪みを修正することで、ストレスを和らげることができます。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'stress-response', 'coping']
  },
  'depression': {
    id: 'depression',
    term: 'うつ病',
    explanation: '持続的な抑うつ気分・意欲低下・睡眠障害・食欲変化などを主症状とする精神疾患。「気の持ちよう」ではなく治療が必要な病気です。早期発見と適切な休養・治療が重要で、職場では無理に励ましたり、気合を入れたりすることは逆効果になることがあります。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['adjustment-disorder', 'burnout']
  },
  'adjustment-disorder': {
    id: 'adjustment-disorder',
    term: '適応障害',
    explanation: '特定のストレッサー（転勤・職場の変化・対人関係など）に対する反応として生じる情緒的・行動的な症状。ストレッサーが除去されると症状が改善する傾向がありますが、放置するとうつ病に移行するリスクもあります。ストレッサーの特定と環境調整が治療の中心です。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['depression', 'stressor']
  },
  'burnout': {
    id: 'burnout',
    term: 'バーンアウト（燃え尽き症候群）',
    explanation: '仕事への意欲・熱意が高かった人が、長期間にわたる過剰なストレスや仕事量により、感情的に消耗し、達成感を失い、仕事への意欲を喪失した状態。マスラックの3要素：①情緒的消耗感、②脱人格化（他者への冷淡な態度）、③個人的達成感の減退。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['gas', 'depression']
  },
  'relaxation': {
    id: 'relaxation',
    term: 'リラクセーション技法',
    explanation: '情動焦点型コーピングの代表的な方法。①漸進的筋弛緩法：各筋肉群に力を入れて一気に脱力することで、身体の緊張を緩める。②腹式呼吸（深呼吸）：ゆっくりとした呼吸で副交感神経を優位にする。③自律訓練法：自己暗示で心身をリラックスさせる。いずれも練習によって効果が高まります。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['emotion-focused', 'coping']
  },
  'type-a': {
    id: 'type-a',
    term: 'タイプA行動パターン',
    explanation: '競争心が強く、時間切迫感があり、攻撃的・完璧主義的な行動傾向のこと。心臓病との関連が指摘されており、ストレスを受けやすい個人特性の一つです。自分がタイプAかどうかを把握することで、コーピングを工夫できます。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'cognitive-appraisal']
  },
  'help-seeking': {
    id: 'help-seeking',
    term: '援助希求行動（えんじょきゅうこう）',
    explanation: '困難な状況に置かれたとき、周囲や専門家に助けを求める行動のこと。「弱さの表れ」ではなく、セルフケアの重要なスキルとして位置づけられます。相談できる人がいること自体がストレスの緩衝材になります。産業医・EAP・精神保健福祉センターなど、適切な相談先を事前に知っておくことが援助希求行動を促します。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['self-care', 'eap', 'industrial-physician']
  },
  'social-support': {
    id: 'social-support',
    term: 'ソーシャルサポート（社会的支援）',
    explanation: '周囲の人々からの支援のこと。①情報的サポート（アドバイス）、②情動的サポート（共感・傾聴）、③道具的サポート（実際の手助け）、④評価的サポート（承認・フィードバック）の4種類に分けられます。ソーシャルサポートが豊富な人は、同じストレッサーを受けてもストレス反応が軽減される「緩衝効果」があることが研究で示されています。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['coping', 'help-seeking', 'stress-response']
  },
  'duty-of-care': {
    id: 'duty-of-care',
    term: '安全配慮義務',
    explanation: '労働契約法第5条に定められた、使用者（企業）が労働者の生命・身体・健康を守るために必要な配慮をする義務のこと。身体的な安全だけでなくメンタルヘルスも対象となります。違反した場合は民事上の損害賠償責任が生じます。ストレスチェック制度の実施・長時間労働対策・職場環境改善はこの義務の履行にあたります。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['self-health-duty', 'stress-check']
  },
  'self-health-duty': {
    id: 'self-health-duty',
    term: '自己保健義務',
    explanation: '労働者自身が自らの健康を維持・管理する義務のこと。労働契約の信義則から導かれる概念です。安全配慮義務（企業側）と対となる義務として試験頻出です。セルフケアは「労働者の自己保健義務の実践」であり、単なる努力目標ではなく法的根拠のある取り組みです。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['duty-of-care', 'self-care']
  },
  'presenteeism': {
    id: 'presenteeism',
    term: 'プレゼンティーイズム',
    explanation: '出勤しているにもかかわらず、健康問題（身体的・精神的）により生産性が低下している状態のこと。欠勤は目に見えるが、プレゼンティーイズムは「見えない損失」として企業に大きな経済的コストをもたらします。アブセンティーイズム（欠勤）と対で覚えましょう。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['absenteeism']
  },
  'absenteeism': {
    id: 'absenteeism',
    term: 'アブセンティーイズム',
    explanation: '健康問題（身体的・精神的）による欠勤のこと。プレゼンティーイズム（出勤しているが生産性低下）と並んで、企業の労働損失を示す指標として用いられます。どちらも職場のメンタルヘルス問題が企業に与えるコストの具体的な形です。',
    level: '基礎',
    scope: 'Ⅲ種',
    relatedTerms: ['presenteeism']
  },
  'panic-disorder': {
    id: 'panic-disorder',
    term: 'パニック障害',
    explanation: '突然の強烈な恐怖発作（パニック発作）が繰り返される不安障害の一つ。発作中は動悸・呼吸困難・死の恐怖などを感じます。「また発作が起きるのではないか」という予期不安から、特定の場所を避けるようになることも。適切な治療で回復可能な病気です。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['depression', 'adjustment-disorder']
  },
  'schizophrenia': {
    id: 'schizophrenia',
    term: '統合失調症',
    explanation: '思考・知覚・感情・行動の統合が乱れる精神疾患。幻覚（特に幻声）・妄想・思考の障害が主な症状です。職場では突然の言動の急変として気づかれることがあります。早期発見・専門機関への受診が重要です。うつ病・適応障害・バーンアウトとの症状の違いを整理しておきましょう。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['depression', 'adjustment-disorder']
  },
  'psychological-detachment': {
    id: 'psychological-detachment',
    term: '心理的デタッチメント',
    explanation: '休日や休暇中に仕事のことを心理的に切り離し、完全にオフの状態にすること。疲労回復に不可欠なセルフケアの習慣です。「仕事のメールをチェックしてしまう」習慣があると、身体は休んでいても心は仕事モードのままになり、疲労が回復しません。ワーク・ライフ・バランスの実践の一つです。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['self-care', 'coping']
  },
  'prevention-levels': {
    id: 'prevention-levels',
    term: '一次予防・二次予防・三次予防',
    explanation: 'メンタルヘルス対策を介入のタイミングで分類した3段階。①一次予防：発症を防ぐ（ストレス軽減・職場環境改善・教育研修）。②二次予防：早期発見・早期対処（ストレスチェック・面接指導・早期受診）。③三次予防：再発防止・職場復帰（復職支援プログラム・職場環境の調整）。Ⅲ種のセルフケアは主に一次・二次予防の観点から取り組みます。',
    level: '中級',
    scope: 'Ⅲ種',
    relatedTerms: ['stress-check', 'self-care']
  },
  'jdc-model': {
    id: 'jdc-model',
    term: 'JDCモデル（仕事の要求度-コントロール-サポートモデル）',
    explanation: 'Karasekらが提唱した職業性ストレスモデル。仕事の「要求度（Job Demands）」「コントロール（Control）」「サポート（Support）」の3要素でストレスの高さを説明します。「要求度が高く・コントロールが低く・サポートが少ない」状態が最もストレスが高いとされています。職業性ストレス簡易調査票はこのモデルに基づいています。',
    level: '上級',
    scope: 'Ⅲ種',
    relatedTerms: ['stressor', 'stress-check', 'occupational-stress-scale']
  },
  'occupational-stress-scale': {
    id: 'occupational-stress-scale',
    term: '職業性ストレス簡易調査票',
    explanation: '職場のストレス要因・ストレス反応・周囲のサポートを57項目（短縮版は23項目）で自己評価するツール。ストレスチェック制度で標準的に使用されています。JDCモデルの考え方をベースに開発された日本の自己評価ツールです。',
    level: '上級',
    scope: 'Ⅲ種',
    relatedTerms: ['stress-check', 'jdc-model']
  },
};
