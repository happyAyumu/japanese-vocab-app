export type Synonym = {
  word: string;
  nuance: string;
};

export type Antonym = {
  word: string;
  example: string;
};

export type HistoryEntry = {
  date: string; // ISO date
  correct: boolean;
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

  // 学習進捗（間隔反復で更新）
  srsLevel: number; // 0始まり。正解のたびに増える
  nextReviewAt: string; // ISO date
  history: HistoryEntry[];
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
