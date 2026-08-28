import type { VocabCard } from "../types/vocab";

/**
 * srsLevel と次回復習までの間隔（日数）の対応表。
 * level 0 は「まだ一度も正解していない/直近で間違えた」状態。
 */
const INTERVAL_DAYS_BY_LEVEL: Record<number, number> = {
  1: 1, // 翌日
  2: 3, // 3日後
  3: 7, // 1週間後
  4: 14, // 2週間後
};
const DEFAULT_INTERVAL_DAYS = 30; // level 5以降は1ヶ月後

export function intervalDaysForLevel(level: number): number {
  if (level <= 0) return 1;
  return INTERVAL_DAYS_BY_LEVEL[level] ?? DEFAULT_INTERVAL_DAYS;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 「覚えた」と回答した場合のカード更新。
 * srsLevel を+1し、レベルに応じて次回復習日を先延ばしする。
 */
export function applyCorrectAnswer(
  card: VocabCard,
  date: string = todayISO(),
): VocabCard {
  const nextLevel = card.srsLevel + 1;
  return {
    ...card,
    srsLevel: nextLevel,
    nextReviewAt: addDays(date, intervalDaysForLevel(nextLevel)),
    history: [...card.history, { date, correct: true }],
  };
}

/**
 * 「わからない」と回答した場合のカード更新。
 * srsLevel を0に戻し、翌日に再出題する。
 */
export function applyIncorrectAnswer(
  card: VocabCard,
  date: string = todayISO(),
): VocabCard {
  return {
    ...card,
    srsLevel: 0,
    nextReviewAt: addDays(date, 1),
    history: [...card.history, { date, correct: false }],
  };
}

export function applyAnswer(
  card: VocabCard,
  correct: boolean,
  date: string = todayISO(),
): VocabCard {
  return correct
    ? applyCorrectAnswer(card, date)
    : applyIncorrectAnswer(card, date);
}

/** 今日以前が復習日になっているカードだけを抽出する（今日の復習ビュー） */
export function getDueCards(
  cards: VocabCard[],
  date: string = todayISO(),
): VocabCard[] {
  return cards.filter((c) => c.nextReviewAt <= date);
}

/** 直近の正答率（0〜1）。履歴が無い場合は null */
export function recentAccuracy(
  card: VocabCard,
  windowSize = 5,
): number | null {
  if (card.history.length === 0) return null;
  const recent = card.history.slice(-windowSize);
  const correctCount = recent.filter((h) => h.correct).length;
  return correctCount / recent.length;
}

/**
 * 苦手度スコア（大きいほど苦手）。
 * srsLevel が低いほど、直近の正答率が低いほど苦手とみなす。
 */
export function weaknessScore(card: VocabCard): number {
  const accuracy = recentAccuracy(card);
  const accuracyPenalty = accuracy === null ? 0.5 : 1 - accuracy;
  return -card.srsLevel + accuracyPenalty * 2;
}

/** 苦手順（苦手なものが先頭）にソートしたカード配列を返す */
export function sortByWeakness(cards: VocabCard[]): VocabCard[] {
  return [...cards].sort((a, b) => weaknessScore(b) - weaknessScore(a));
}

/** 習得済み（srsLevel 3以上）とみなす閾値 */
export const MASTERY_LEVEL_THRESHOLD = 3;

export function isMastered(card: VocabCard): boolean {
  return card.srsLevel >= MASTERY_LEVEL_THRESHOLD;
}

export function masteryRate(cards: VocabCard[]): number {
  if (cards.length === 0) return 0;
  return cards.filter(isMastered).length / cards.length;
}
