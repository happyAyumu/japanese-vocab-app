import { useMemo } from "react";
import type { VocabCard } from "../types/vocab";
import { getDueCards, getDueQuizCards, masteryRate, sortByWeakness, todayISO } from "../lib/srs";

/**
 * SRS関連の派生データをまとめて計算する。
 * dueCards（カード画面の今日の復習対象）と dueQuizCards（クイズの今日の対象）は
 * 別々のスケジュール（nextReviewAt / quizNextReviewAt）に基づくため、完全に独立している。
 */
export function useSRS(cards: VocabCard[]) {
  const today = todayISO();

  const dueCards = useMemo(() => getDueCards(cards, today), [cards, today]);
  const dueQuizCards = useMemo(() => getDueQuizCards(cards, today), [cards, today]);
  const weakOrderedCards = useMemo(() => sortByWeakness(cards), [cards]);
  const mastery = useMemo(() => masteryRate(cards), [cards]);

  return { today, dueCards, dueQuizCards, weakOrderedCards, mastery };
}
