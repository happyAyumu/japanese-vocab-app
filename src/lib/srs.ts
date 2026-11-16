import type { Grade, VocabCard } from "../types/vocab";

/**
 * srsLevel と次回復習までの間隔（時間）の対応表。
 * level 0 は「まだ一度も正解していない/直近で間違えた」状態。
 * Lv1=12時間を起点に、以前の日単位テーブル（1/3/7/14/30日）を1/2に比例縮小している。
 */
const INTERVAL_HOURS_BY_LEVEL: Record<number, number> = {
  1: 12, // 12時間後
  2: 36, // 1.5日後
  3: 84, // 3.5日後
  4: 168, // 7日後
};
const DEFAULT_INTERVAL_HOURS = 360; // level 5以降は15日後

export function intervalHoursForLevel(level: number): number {
  if (level <= 0) return 12;
  return INTERVAL_HOURS_BY_LEVEL[level] ?? DEFAULT_INTERVAL_HOURS;
}

/** 指定した日時（ISO日時文字列）に指定時間を加算したISO日時文字列を返す */
export function addHours(isoDateTime: string, hours: number): string {
  const d = new Date(isoDateTime);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

/** 現在時刻のISO日時文字列（次回復習日時の計算に使う） */
export function nowISO(): string {
  return new Date().toISOString();
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 今日の日付（ISO日付文字列、時刻なし）。history の日付や連続学習日数の判定に使う */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO日時文字列から日付部分（YYYY-MM-DD）だけを取り出す */
function dateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

/**
 * クイズで「正解」した場合のカード更新。
 * クイズの進捗はフラッシュカード（カード画面）とは別管理のため、
 * quizSrsLevel／quizNextReviewAt／quizHistory のみを更新する。
 * （これまでは共有のsrsLevel/nextReviewAtを操作していたため、
 * カード画面を一通り終えるとクイズの出題対象が0件になってしまっていた）
 */
export function applyQuizCorrectAnswer(
  card: VocabCard,
  now: string = nowISO(),
): VocabCard {
  const nextLevel = card.quizSrsLevel + 1;
  return {
    ...card,
    quizSrsLevel: nextLevel,
    quizNextReviewAt: addHours(now, intervalHoursForLevel(nextLevel)),
    quizHistory: [...card.quizHistory, { date: dateOnly(now), correct: true }],
  };
}

/**
 * クイズで「不正解」だった場合のカード更新。
 * quizSrsLevel を0に戻し、12時間後に再出題する。
 */
export function applyQuizIncorrectAnswer(
  card: VocabCard,
  now: string = nowISO(),
): VocabCard {
  return {
    ...card,
    quizSrsLevel: 0,
    quizNextReviewAt: addHours(now, intervalHoursForLevel(0)),
    quizHistory: [...card.quizHistory, { date: dateOnly(now), correct: false }],
  };
}

export function applyQuizAnswer(
  card: VocabCard,
  correct: boolean,
  now: string = nowISO(),
): VocabCard {
  return correct
    ? applyQuizCorrectAnswer(card, now)
    : applyQuizIncorrectAnswer(card, now);
}

/** 現在時刻以前がクイズの復習日時になっているカードだけを抽出する */
export function getDueQuizCards(
  cards: VocabCard[],
  now: string = nowISO(),
): VocabCard[] {
  return cards.filter((c) => c.quizNextReviewAt <= now);
}

/**
 * フラッシュカード復習時の4段階評価（もう一度／難しい／普通／簡単）。
 * エビングハウスの忘却曲線の「一度覚えると忘却が緩やかになる」という考え方に
 * ヒントを得て間隔を指数的に延ばしていく一方、自己評価の難易度に応じて
 * 間隔を伸縮させる（SM-2系アルゴリズムの考え方）。Lv1=12時間を起点とする。
 *
 * - もう一度 (again): 覚えていなかった。レベルを0に戻し、すぐに（このセッション内）再出題する。
 * - 難しい   (hard):  レベルは上げず、現在レベルの間隔よりやや長め（×1.2）で再出題する。
 * - 普通     (good):  レベルを+1し、通常の間隔表に従って次回を設定する。
 * - 簡単     (easy):  レベルを+2し、通常より長め（×1.3）の間隔で次回を設定する。
 */
export function applyGrade(
  card: VocabCard,
  grade: Grade,
  now: string = nowISO(),
): VocabCard {
  const history = [
    ...card.history,
    { date: dateOnly(now), correct: grade !== "again", grade },
  ];

  switch (grade) {
    case "again":
      return { ...card, srsLevel: 0, nextReviewAt: now, history };
    case "hard": {
      const hours = Math.max(1, Math.round(intervalHoursForLevel(card.srsLevel) * 1.2));
      return { ...card, srsLevel: card.srsLevel, nextReviewAt: addHours(now, hours), history };
    }
    case "good": {
      const nextLevel = card.srsLevel + 1;
      return {
        ...card,
        srsLevel: nextLevel,
        nextReviewAt: addHours(now, intervalHoursForLevel(nextLevel)),
        history,
      };
    }
    case "easy": {
      const nextLevel = card.srsLevel + 2;
      const hours = Math.round(intervalHoursForLevel(nextLevel) * 1.3);
      return { ...card, srsLevel: nextLevel, nextReviewAt: addHours(now, hours), history };
    }
  }
}

/** 4段階評価ボタンに表示する「次回までの時間（時間単位）」プレビュー */
export function previewGradeIntervals(card: VocabCard): Record<Grade, number> {
  return {
    again: 0,
    hard: Math.max(1, Math.round(intervalHoursForLevel(card.srsLevel) * 1.2)),
    good: intervalHoursForLevel(card.srsLevel + 1),
    easy: Math.round(intervalHoursForLevel(card.srsLevel + 2) * 1.3),
  };
}

/** 時間数を「すぐに／○時間後／○日後／○ヶ月後／○年後」の日本語ラベルに変換する */
export function formatIntervalLabel(hours: number): string {
  if (hours <= 0) return "すぐに";
  if (hours < 24) return `${hours}時間後`;
  const days = hours / 24;
  if (days < 30) {
    const rounded = Math.round(days * 10) / 10;
    return `${rounded}日後`;
  }
  if (days < 365) return `${Math.round(days / 30)}ヶ月後`;
  return `${Math.round(days / 365)}年後`;
}

/** 現在時刻以前が復習日時になっているカードだけを抽出する（今日の復習ビュー） */
export function getDueCards(
  cards: VocabCard[],
  now: string = nowISO(),
): VocabCard[] {
  return cards.filter((c) => c.nextReviewAt <= now);
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

/**
 * 連続学習日数。フラッシュカードの評価・クイズの回答のどちらも
 * 「その日学習した」とみなす（カードのhistoryに日付が記録されていれば学習済み）。
 * 今日まだ学習していなくても、昨日までの連続記録は途切れていないものとして数える。
 */
export function computeStreak(cards: VocabCard[], today: string = todayISO()): number {
  const studiedDates = new Set<string>();
  for (const card of cards) {
    for (const entry of card.history) {
      studiedDates.add(entry.date);
    }
  }

  let streak = 0;
  let cursor = studiedDates.has(today) ? today : addDays(today, -1);
  while (studiedDates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type LevelBucket = {
  label: string;
  count: number;
  color: string;
};

/** srsLevelを4段階のバケツに分け、円グラフ表示用の件数を返す */
export function levelDistribution(cards: VocabCard[]): LevelBucket[] {
  const buckets: LevelBucket[] = [
    { label: "未学習 (Lv0以下)", count: 0, color: "#b5502e" },
    { label: "学習中 (Lv1-2)", count: 0, color: "#b98a3e" },
    { label: "定着中 (Lv3-4)", count: 0, color: "#3b6e8f" },
    { label: "習得 (Lv5+)", count: 0, color: "#4c7a4f" },
  ];

  for (const card of cards) {
    if (card.srsLevel <= 0) buckets[0].count++;
    else if (card.srsLevel <= 2) buckets[1].count++;
    else if (card.srsLevel <= 4) buckets[2].count++;
    else buckets[3].count++;
  }

  return buckets;
}
