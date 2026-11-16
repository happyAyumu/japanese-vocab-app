import { describe, it, expect } from "vitest";
import type { VocabCard } from "../types/vocab";
import {
  applyQuizCorrectAnswer,
  applyQuizIncorrectAnswer,
  applyGrade,
  previewGradeIntervals,
  formatIntervalLabel,
  intervalHoursForLevel,
  addHours,
  getDueCards,
  getDueQuizCards,
  sortByWeakness,
  masteryRate,
  isMastered,
  computeStreak,
  levelDistribution,
} from "./srs";

const NOW = "2026-01-01T00:00:00.000Z";

function makeCard(overrides: Partial<VocabCard> = {}): VocabCard {
  return {
    id: "1",
    kanji: "テスト",
    reading: "てすと",
    meaning: "意味",
    synonyms: [],
    antonyms: [],
    example: "例文",
    registeredAt: "2026-01-01",
    srsLevel: 0,
    nextReviewAt: NOW,
    history: [],
    quizSrsLevel: 0,
    quizNextReviewAt: NOW,
    quizHistory: [],
    ...overrides,
  };
}

describe("intervalHoursForLevel", () => {
  it("returns expected hour counts for each level", () => {
    expect(intervalHoursForLevel(1)).toBe(12);
    expect(intervalHoursForLevel(2)).toBe(36);
    expect(intervalHoursForLevel(3)).toBe(84);
    expect(intervalHoursForLevel(4)).toBe(168);
    expect(intervalHoursForLevel(5)).toBe(360);
    expect(intervalHoursForLevel(10)).toBe(360);
  });
});

describe("applyQuizCorrectAnswer", () => {
  it("increments quizSrsLevel and pushes quizNextReviewAt forward, leaving flashcard fields untouched", () => {
    const card = makeCard({ srsLevel: 2, nextReviewAt: "2025-12-01T00:00:00.000Z", quizSrsLevel: 0 });
    const updated = applyQuizCorrectAnswer(card, NOW);
    expect(updated.quizSrsLevel).toBe(1);
    expect(updated.quizNextReviewAt).toBe(addHours(NOW, 12));
    expect(updated.quizHistory).toEqual([{ date: "2026-01-01", correct: true }]);
    // flashcard-side progress must stay exactly as it was
    expect(updated.srsLevel).toBe(2);
    expect(updated.nextReviewAt).toBe("2025-12-01T00:00:00.000Z");
    expect(updated.history).toEqual([]);
  });

  it("keeps advancing through the interval table", () => {
    let card = makeCard({ quizSrsLevel: 3 });
    card = applyQuizCorrectAnswer(card, NOW);
    expect(card.quizSrsLevel).toBe(4);
    expect(card.quizNextReviewAt).toBe(addHours(NOW, 168));
  });
});

describe("applyQuizIncorrectAnswer", () => {
  it("resets quizSrsLevel to 0 and schedules 12 hours later, leaving flashcard fields untouched", () => {
    const card = makeCard({ srsLevel: 4, nextReviewAt: "2025-12-01T00:00:00.000Z", quizSrsLevel: 4 });
    const updated = applyQuizIncorrectAnswer(card, NOW);
    expect(updated.quizSrsLevel).toBe(0);
    expect(updated.quizNextReviewAt).toBe(addHours(NOW, 12));
    expect(updated.quizHistory).toEqual([{ date: "2026-01-01", correct: false }]);
    expect(updated.srsLevel).toBe(4);
    expect(updated.nextReviewAt).toBe("2025-12-01T00:00:00.000Z");
  });
});

describe("getDueCards", () => {
  it("only returns cards whose nextReviewAt is now or earlier", () => {
    const cards = [
      makeCard({ id: "a", nextReviewAt: "2026-01-01T00:00:00.000Z" }),
      makeCard({ id: "b", nextReviewAt: "2026-01-05T00:00:00.000Z" }),
      makeCard({ id: "c", nextReviewAt: "2026-01-10T00:00:00.000Z" }),
    ];
    const due = getDueCards(cards, "2026-01-05T00:00:00.000Z");
    expect(due.map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("getDueQuizCards", () => {
  it("only returns cards whose quizNextReviewAt is now or earlier, independent of nextReviewAt", () => {
    const cards = [
      // this card's flashcard schedule is far in the future, but it should still be due for quiz
      makeCard({ id: "a", nextReviewAt: "2099-01-01T00:00:00.000Z", quizNextReviewAt: "2026-01-01T00:00:00.000Z" }),
      makeCard({ id: "b", nextReviewAt: "2026-01-01T00:00:00.000Z", quizNextReviewAt: "2026-01-10T00:00:00.000Z" }),
    ];
    const due = getDueQuizCards(cards, "2026-01-05T00:00:00.000Z");
    expect(due.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("sortByWeakness", () => {
  it("puts lower srsLevel cards first", () => {
    const cards = [
      makeCard({ id: "high", srsLevel: 5 }),
      makeCard({ id: "low", srsLevel: -1 }),
      makeCard({ id: "mid", srsLevel: 1 }),
    ];
    const sorted = sortByWeakness(cards);
    expect(sorted[0].id).toBe("low");
    expect(sorted[sorted.length - 1].id).toBe("high");
  });
});

describe("mastery", () => {
  it("isMastered is true at srsLevel 3+", () => {
    expect(isMastered(makeCard({ srsLevel: 2 }))).toBe(false);
    expect(isMastered(makeCard({ srsLevel: 3 }))).toBe(true);
  });

  it("masteryRate computes ratio of mastered cards", () => {
    const cards = [
      makeCard({ srsLevel: 3 }),
      makeCard({ srsLevel: 4 }),
      makeCard({ srsLevel: 0 }),
      makeCard({ srsLevel: 1 }),
    ];
    expect(masteryRate(cards)).toBe(0.5);
  });

  it("masteryRate is 0 for an empty list", () => {
    expect(masteryRate([])).toBe(0);
  });
});

describe("applyGrade", () => {
  it("again resets level to 0 and schedules immediately", () => {
    const card = makeCard({ srsLevel: 3 });
    const updated = applyGrade(card, "again", NOW);
    expect(updated.srsLevel).toBe(0);
    expect(updated.nextReviewAt).toBe(NOW);
    expect(updated.history).toEqual([
      { date: "2026-01-01", correct: false, grade: "again" },
    ]);
  });

  it("hard keeps the level unchanged but pushes the interval out slightly", () => {
    const card = makeCard({ srsLevel: 2 }); // base interval 36 hours
    const updated = applyGrade(card, "hard", NOW);
    expect(updated.srsLevel).toBe(2);
    expect(updated.nextReviewAt).toBe(addHours(NOW, 43)); // round(36 * 1.2)
  });

  it("good promotes the level by 1 using the standard interval table", () => {
    const card = makeCard({ srsLevel: 2 });
    const updated = applyGrade(card, "good", NOW);
    expect(updated.srsLevel).toBe(3);
    expect(updated.nextReviewAt).toBe(addHours(NOW, intervalHoursForLevel(3)));
  });

  it("easy promotes the level by 2 with a longer interval than good", () => {
    const card = makeCard({ srsLevel: 2 });
    const goodUpdate = applyGrade(card, "good", NOW);
    const easyUpdate = applyGrade(card, "easy", NOW);
    expect(easyUpdate.srsLevel).toBe(4);
    expect(easyUpdate.nextReviewAt >= goodUpdate.nextReviewAt).toBe(true);
  });

  it("ordering of next review dates is again <= hard <= good <= easy", () => {
    const card = makeCard({ srsLevel: 2 });
    const again = applyGrade(card, "again", NOW).nextReviewAt;
    const hard = applyGrade(card, "hard", NOW).nextReviewAt;
    const good = applyGrade(card, "good", NOW).nextReviewAt;
    const easy = applyGrade(card, "easy", NOW).nextReviewAt;
    expect(again <= hard).toBe(true);
    expect(hard <= good).toBe(true);
    expect(good <= easy).toBe(true);
  });
});

describe("previewGradeIntervals", () => {
  it("returns a preview (in hours) matching what applyGrade would schedule", () => {
    const card = makeCard({ srsLevel: 1 });
    const preview = previewGradeIntervals(card);
    expect(preview.again).toBe(0);
    expect(addHours(NOW, preview.good)).toBe(
      applyGrade(card, "good", NOW).nextReviewAt,
    );
  });
});

describe("formatIntervalLabel", () => {
  it("formats hours into human-readable Japanese labels", () => {
    expect(formatIntervalLabel(0)).toBe("すぐに");
    expect(formatIntervalLabel(12)).toBe("12時間後");
    expect(formatIntervalLabel(36)).toBe("1.5日後");
    expect(formatIntervalLabel(168)).toBe("7日後");
    expect(formatIntervalLabel(720)).toBe("1ヶ月後");
    expect(formatIntervalLabel(24 * 365)).toBe("1年後");
  });
});

describe("computeStreak", () => {
  it("counts consecutive studied days ending today", () => {
    const cards = [
      makeCard({
        history: [
          { date: "2026-01-03", correct: true },
          { date: "2026-01-04", correct: true },
          { date: "2026-01-05", correct: true },
        ],
      }),
    ];
    expect(computeStreak(cards, "2026-01-05")).toBe(3);
  });

  it("does not break the streak if today has not been studied yet", () => {
    const cards = [
      makeCard({
        history: [
          { date: "2026-01-04", correct: true },
          { date: "2026-01-05", correct: true },
        ],
      }),
    ];
    expect(computeStreak(cards, "2026-01-06")).toBe(2);
  });

  it("resets to 0 when there is a gap before today", () => {
    const cards = [
      makeCard({ history: [{ date: "2026-01-01", correct: true }] }),
    ];
    expect(computeStreak(cards, "2026-01-05")).toBe(0);
  });

  it("merges history across multiple cards for the same day", () => {
    const cards = [
      makeCard({ id: "a", history: [{ date: "2026-01-05", correct: true }] }),
      makeCard({ id: "b", history: [{ date: "2026-01-04", correct: false }] }),
    ];
    expect(computeStreak(cards, "2026-01-05")).toBe(2);
  });

  it("returns 0 when there is no history at all", () => {
    expect(computeStreak([makeCard({})], "2026-01-05")).toBe(0);
  });
});

describe("levelDistribution", () => {
  it("buckets cards into the 4 level groups", () => {
    const cards = [
      makeCard({ id: "a", srsLevel: -1 }),
      makeCard({ id: "b", srsLevel: 0 }),
      makeCard({ id: "c", srsLevel: 1 }),
      makeCard({ id: "d", srsLevel: 2 }),
      makeCard({ id: "e", srsLevel: 3 }),
      makeCard({ id: "f", srsLevel: 4 }),
      makeCard({ id: "g", srsLevel: 5 }),
      makeCard({ id: "h", srsLevel: 10 }),
    ];
    const buckets = levelDistribution(cards);
    expect(buckets.map((b) => b.count)).toEqual([2, 2, 2, 2]);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(cards.length);
  });
});
