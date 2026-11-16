import { useMemo } from "react";
import type { VocabCard } from "../types/vocab";
import { getDueCards, getDueQuizCards, masteryRate, nowISO, sortByWeakness } from "../lib/srs";

/**
 * SRS関連の派生データをまとめて計算する。
 * dueCards（カード画面の復習対象）と dueQuizCards（クイズの対象）は
 * 別々のスケジュール（nextReviewAt / quizNextReviewAt、時刻まで含む）に基づくため、完全に独立している。
 */
export function useSRS(cards: VocabCard[]) {
  const now = nowISO();

  const dueCards = useMemo(() => getDueCards(cards, now), [cards, now]);
  const dueQuizCards = useMemo(() => getDueQuizCards(cards, now), [cards, now]);
  const weakOrderedCards = useMemo(() => sortByWeakness(cards), [cards]);
  const mastery = useMemo(() => masteryRate(cards), [cards]);

  return { now, dueCards, dueQuizCards, weakOrderedCards, mastery };
}
