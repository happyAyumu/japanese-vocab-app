export type Synonym = {
  word: string;
  nuance: string;
};

export type Antonym = {
  word: string;
  example: string;
};

/** フラッシュカード復習時の4段階評価（Anki風） */
export type Grade = "again" | "hard" | "good" | "easy";

export type HistoryEntry = {
  date: string; // ISO date
  correct: boolean;
  grade?: Grade; // フラッシュカード復習時のみ記録。クイズ正誤には付かない
};

export type VocabCard = {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  synonyms: Synonym[]; // 2つ
  antonyms: Antonym[]; // 0〜2つ
  example: string;
  registeredAt: string; // ISO date

  // フラッシュカード（カード画面）の学習進捗（間隔反復で更新）
  srsLevel: number; // 0始まり。正解のたびに増える
  nextReviewAt: string; // ISO date
  history: HistoryEntry[];

  // クイズ画面の学習進捗。フラッシュカードとは完全に別管理
  // （カード画面を終わらせてもクイズの出題対象が0件になったりしない）
  quizSrsLevel: number;
  quizNextReviewAt: string; // ISO date
  quizHistory: HistoryEntry[];
};

export type SortMode = "registered" | "aiueo" | "weak";

export type QuizQuestionType = "fillBlank" | "synAnt" | "meaning";

export type QuizQuestion = {
  type: QuizQuestionType;
  cardId: string;
  prompt: string;
  choices?: string[]; // for 4-choice questions
  answer: string;
};

export type QuizResult = {
  cardId: string;
  correct: boolean;
  question: QuizQuestion;
  userAnswer: string;
};
