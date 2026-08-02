// メンタルヘルスマネジメント検定Ⅲ種 試験情報の唯一のソース
// 試験要件が変わった場合はこのファイルのみを更新する

export const EXAM_CONFIG = {
  duration: 120,                      // 試験時間（分）
  questionCount: '50問',              // 出題数
  passingScore: 70,                   // 合格基準（点）
  passingScoreLabel: '100点満点中70点以上',
  format: 'マークシート方式（選択問題）',
  schedule: '年2回（11月・3月）',
} as const;
