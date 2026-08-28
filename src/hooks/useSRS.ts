import { useMemo } from "react";
import type { VocabCard } from "../types/vocab";
import { getDueCards, masteryRate, sortByWeakness, todayISO } from "../lib/srs";

/** SRS関連の派生データ（今日の復習対象・苦手順ソート・習得率）をまとめて計算する */
export function useSRS(cards: VocabCard[]) {
  const today = todayISO();

  const dueCards = useMemo(() => getDueCards(cards, today), [cards, today]);
  const weakOrderedCards = useMemo(() => sortByWeakness(cards), [cards]);
  const mastery = useMemo(() => masteryRate(cards), [cards]);

  return { today, dueCards, weakOrderedCards, mastery };
}
