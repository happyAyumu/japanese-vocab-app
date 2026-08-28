import { describe, it, expect } from "vitest";
import type { VocabCard } from "../types/vocab";
import {
  applyCorrectAnswer,
  applyIncorrectAnswer,
  intervalDaysForLevel,
  addDays,
  getDueCards,
  sortByWeakness,
  masteryRate,
  isMastered,
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
