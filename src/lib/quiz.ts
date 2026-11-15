import type { QuizQuestion, VocabCard } from "../types/vocab";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** 例文の空欄埋め問題を作る */
export function buildFillBlankQuestion(card: VocabCard): QuizQuestion | null {
  if (!card.example.includes(card.kanji)) return null;
  const prompt = card.example.split(card.kanji).join("＿＿＿＿");
  return {
    type: "fillBlank",
    cardId: card.id,
    prompt,
    answer: card.kanji,
  };
}

/** 類義語・対義語当て（4択）問題を作る */
export function buildSynAntQuestion(
  card: VocabCard,
  allCards: VocabCard[],
): QuizQuestion | null {
  const useSynonym = card.synonyms.length > 0;
  const pool = useSynonym ? card.synonyms : card.antonyms;
  if (pool.length === 0) return null;
  const correctEntry = pool[Math.floor(Math.random() * pool.length)];
  const correctWord = correctEntry.word;

  const distractorPool = allCards
    .filter((c) => c.id !== card.id)
    .flatMap((c) => [...c.synonyms.map((s) => s.word), ...c.antonyms.map((a) => a.word)])
    .filter((w) => w !== correctWord);

  const distractors = pickRandom(Array.from(new Set(distractorPool)), 3);
  if (distractors.length < 3) return null;

  const choices = shuffle([correctWord, ...distractors]);
  const label = useSynonym ? "類義語" : "対義語";

  return {
    type: "synAnt",
    cardId: card.id,
    prompt: `「${card.kanji}（${card.reading}）」の${label}はどれ？`,
    choices,
    answer: correctWord,
  };
}

/** 意味当て（4択）問題を作る。他カードの意味をダミー選択肢として使う */
export function buildMeaningQuestion(
  card: VocabCard,
  allCards: VocabCard[],
): QuizQuestion | null {
  const distractorPool = allCards
    .filter((c) => c.id !== card.id)
    .map((c) => c.meaning);
  const distractors = pickRandom(Array.from(new Set(distractorPool)), 3);
  if (distractors.length < 3) return null;

  const choices = shuffle([card.meaning, ...distractors]);

  return {
    type: "meaning",
    cardId: card.id,
    prompt: `「${card.kanji}（${card.reading}）」の意味はどれ？`,
    choices,
    answer: card.meaning,
  };
}

const BUILDERS = [
  (card: VocabCard, all: VocabCard[]) => buildFillBlankQuestion(card),
  (card: VocabCard, all: VocabCard[]) => buildSynAntQuestion(card, all),
  (card: VocabCard, all: VocabCard[]) => buildMeaningQuestion(card, all),
];

/**
 * 与えられたカード群から、5問区切りのクイズを生成する。
 * 出題形式は3種類の中からランダムに選ばれる（成立しない形式はスキップしてフォールバック）。
 */
export function buildQuiz(
  cards: VocabCard[],
  allCards: VocabCard[],
  size = 5,
): QuizQuestion[] {
  const targets = pickRandom(cards, Math.min(size, cards.length));
  const questions: QuizQuestion[] = [];

  for (const card of targets) {
    const order = shuffle(BUILDERS);
    let question: QuizQuestion | null = null;
    for (const build of order) {
      question = build(card, allCards);
      if (question) break;
    }
    if (question) questions.push(question);
  }

  return questions;
}

export type QuizCategory = "fourChoice" | "fillBlank";

const FOUR_CHOICE_BUILDERS = [
  (card: VocabCard, all: VocabCard[]) => buildSynAntQuestion(card, all),
  (card: VocabCard, all: VocabCard[]) => buildMeaningQuestion(card, all),
];

/**
 * 指定したカード群（通常は「今日復習すべきカード」）のうち、
 * 選んだ出題カテゴリ（4択／穴埋め）で問題が成立するものだけを使って
 * 1枚につき1問、全件分のクイズを組み立てる。
 * 成立しないカード（例: 穴埋めで例文に単語が含まれない）は自動的にスキップされる。
 */
export function buildFilteredQuiz(
  cards: VocabCard[],
  allCards: VocabCard[],
  category: QuizCategory,
): QuizQuestion[] {
  const shuffledCards = shuffle(cards);
  const questions: QuizQuestion[] = [];

  for (const card of shuffledCards) {
    let question: QuizQuestion | null = null;

    if (category === "fillBlank") {
      question = buildFillBlankQuestion(card);
    } else {
      for (const build of shuffle(FOUR_CHOICE_BUILDERS)) {
        question = build(card, allCards);
        if (question) break;
      }
    }

    if (question) questions.push(question);
  }

  return questions;
}
