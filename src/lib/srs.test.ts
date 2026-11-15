import { describe, it, expect } from "vitest";
import type { VocabCard } from "../types/vocab";
import {
  applyCorrectAnswer,
  applyIncorrectAnswer,
  applyGrade,
  previewGradeIntervals,
  formatIntervalLabel,
  intervalDaysForLevel,
  addDays,
  getDueCards,
  sortByWeakness,
  masteryRate,
  isMastered,
  computeStreak,
  levelDistribution,
} from "./srs";

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
    nextReviewAt: "2026-01-01",
    history: [],
    ...overrides,
  };
}

describe("intervalDaysForLevel", () => {
  it("returns expected day counts for each level", () => {
    expect(intervalDaysForLevel(1)).toBe(1);
    expect(intervalDaysForLevel(2)).toBe(3);
    expect(intervalDaysForLevel(3)).toBe(7);
    expect(intervalDaysForLevel(4)).toBe(14);
    expect(intervalDaysForLevel(5)).toBe(30);
    expect(intervalDaysForLevel(10)).toBe(30);
  });
});

describe("applyCorrectAnswer", () => {
  it("increments srsLevel and pushes nextReviewAt forward", () => {
    const card = makeCard({ srsLevel: 0 });
    const updated = applyCorrectAnswer(card, "2026-01-01");
    expect(updated.srsLevel).toBe(1);
    expect(updated.nextReviewAt).toBe(addDays("2026-01-01", 1));
    expect(updated.history).toEqual([{ date: "2026-01-01", correct: true }]);
  });

  it("keeps advancing through the interval table", () => {
    let card = makeCard({ srsLevel: 3 });
    card = applyCorrectAnswer(card, "2026-01-01");
    expect(card.srsLevel).toBe(4);
    expect(card.nextReviewAt).toBe(addDays("2026-01-01", 14));
  });
});

describe("applyIncorrectAnswer", () => {
  it("resets srsLevel to 0 and schedules for tomorrow", () => {
    const card = makeCard({ srsLevel: 4 });
    const updated = applyIncorrectAnswer(card, "2026-01-01");
    expect(updated.srsLevel).toBe(0);
    expect(updated.nextReviewAt).toBe(addDays("2026-01-01", 1));
    expect(updated.history).toEqual([{ date: "2026-01-01", correct: false }]);
  });
});

describe("getDueCards", () => {
  it("only returns cards whose nextReviewAt is today or earlier", () => {
    const cards = [
      makeCard({ id: "a", nextReviewAt: "2026-01-01" }),
      makeCard({ id: "b", nextReviewAt: "2026-01-05" }),
      makeCard({ id: "c", nextReviewAt: "2026-01-10" }),
    ];
    const due = getDueCards(cards, "2026-01-05");
    expect(due.map((c) => c.id)).toEqual(["a", "b"]);
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
  it("again resets level to 0 and schedules for the same day", () => {
    const card = makeCard({ srsLevel: 3 });
    const updated = applyGrade(card, "again", "2026-01-01");
    expect(updated.srsLevel).toBe(0);
    expect(updated.nextReviewAt).toBe("2026-01-01");
    expect(updated.history).toEqual([
      { date: "2026-01-01", correct: false, grade: "again" },
    ]);
  });

  it("hard keeps the level unchanged but pushes the interval out slightly", () => {
    const card = makeCard({ srsLevel: 2 }); // base interval 3 days
    const updated = applyGrade(card, "hard", "2026-01-01");
    expect(updated.srsLevel).toBe(2);
    expect(updated.nextReviewAt).toBe(addDays("2026-01-01", 4)); // round(3 * 1.2)
  });

  it("good promotes the level by 1 using the standard interval table", () => {
    const card = makeCard({ srsLevel: 2 });
    const updated = applyGrade(card, "good", "2026-01-01");
    expect(updated.srsLevel).toBe(3);
    expect(updated.nextReviewAt).toBe(addDays("2026-01-01", intervalDaysForLevel(3)));
  });

  it("easy promotes the level by 2 with a longer interval than good", () => {
    const card = makeCard({ srsLevel: 2 });
    const goodUpdate = applyGrade(card, "good", "2026-01-01");
    const easyUpdate = applyGrade(card, "easy", "2026-01-01");
    expect(easyUpdate.srsLevel).toBe(4);
    expect(easyUpdate.nextReviewAt >= goodUpdate.nextReviewAt).toBe(true);
  });

  it("ordering of next review dates is again <= hard <= good <= easy", () => {
    const card = makeCard({ srsLevel: 2 });
    const again = applyGrade(card, "again", "2026-01-01").nextReviewAt;
    const hard = applyGrade(card, "hard", "2026-01-01").nextReviewAt;
    const good = applyGrade(card, "good", "2026-01-01").nextReviewAt;
    const easy = applyGrade(card, "easy", "2026-01-01").nextReviewAt;
    expect(again <= hard).toBe(true);
    expect(hard <= good).toBe(true);
    expect(good <= easy).toBe(true);
  });
});

describe("previewGradeIntervals", () => {
  it("returns a preview matching what applyGrade would schedule", () => {
    const card = makeCard({ srsLevel: 1 });
    const preview = previewGradeIntervals(card);
    expect(preview.again).toBe(0);
    expect(addDays("2026-01-01", preview.good)).toBe(
      applyGrade(card, "good", "2026-01-01").nextReviewAt,
    );
  });
});

describe("formatIntervalLabel", () => {
  it("formats days into human-readable Japanese labels", () => {
    expect(formatIntervalLabel(0)).toBe("今日中");
    expect(formatIntervalLabel(1)).toBe("1日後");
    expect(formatIntervalLabel(14)).toBe("14日後");
    expect(formatIntervalLabel(30)).toBe("1ヶ月後");
    expect(formatIntervalLabel(365)).toBe("1年後");
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
