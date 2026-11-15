import { describe, it, expect } from "vitest";
import type { VocabCard } from "../types/vocab";
import {
  buildFillBlankQuestion,
  buildMeaningQuestion,
  buildSynAntQuestion,
  buildQuiz,
  buildFilteredQuiz,
} from "./quiz";

function makeCard(overrides: Partial<VocabCard>): VocabCard {
  return {
    id: "1",
    kanji: "狡猾",
    reading: "こうかつ",
    meaning: "ずる賢く、悪知恵が働くこと",
    synonyms: [{ word: "老獪", nuance: "経験に裏打ちされたしたたかさ" }],
    antonyms: [{ word: "誠実", example: "彼女は誠実だ。" }],
    example: "彼は狡猾なやり方で出し抜いた。",
    registeredAt: "2026-01-01",
    srsLevel: 0,
    nextReviewAt: "2026-01-01",
    history: [],
    ...overrides,
  };
}

const deck: VocabCard[] = [
  makeCard({ id: "1", kanji: "狡猾" }),
  makeCard({
    id: "2",
    kanji: "忌避",
    reading: "きひ",
    meaning: "嫌って避けること",
    synonyms: [{ word: "敬遠", nuance: "柔らかい" }],
    antonyms: [{ word: "歓迎", example: "歓迎する。" }],
    example: "薬品には忌避効果がある。",
  }),
  makeCard({
    id: "3",
    kanji: "紅潮",
    reading: "こうちょう",
    meaning: "顔が赤くなること",
    synonyms: [{ word: "上気", nuance: "ほてる" }],
    antonyms: [{ word: "青ざめる", example: "青ざめた。" }],
    example: "頬が紅潮した。",
  }),
  makeCard({
    id: "4",
    kanji: "憤然",
    reading: "ふんぜん",
    meaning: "腹を立てている様子",
    synonyms: [{ word: "憤慨", nuance: "怒りに焦点" }],
    antonyms: [{ word: "平然", example: "平然としていた。" }],
    example: "彼は憤然とした。",
  }),
];

describe("buildFillBlankQuestion", () => {
  it("replaces the kanji in the example with a blank", () => {
    const q = buildFillBlankQuestion(deck[0]);
    expect(q).not.toBeNull();
    expect(q!.prompt).not.toContain("狡猾");
    expect(q!.answer).toBe("狡猾");
  });

  it("returns null when the kanji does not appear in the example", () => {
    const card = makeCard({ example: "全く別の文章です。" });
    expect(buildFillBlankQuestion(card)).toBeNull();
  });
});

describe("buildSynAntQuestion", () => {
  it("produces 4 choices including the correct synonym", () => {
    const q = buildSynAntQuestion(deck[0], deck);
    expect(q).not.toBeNull();
    expect(q!.choices).toHaveLength(4);
    expect(q!.choices).toContain(q!.answer);
  });
});

describe("buildMeaningQuestion", () => {
  it("produces 4 choices including the correct meaning", () => {
    const q = buildMeaningQuestion(deck[0], deck);
    expect(q).not.toBeNull();
    expect(q!.choices).toHaveLength(4);
    expect(q!.choices).toContain(deck[0].meaning);
  });
});

describe("buildQuiz", () => {
  it("builds at most `size` questions from the given cards", () => {
    const quiz = buildQuiz(deck, deck, 3);
    expect(quiz.length).toBeLessThanOrEqual(3);
    for (const q of quiz) {
      expect(["fillBlank", "synAnt", "meaning"]).toContain(q.type);
    }
  });
});

describe("buildFilteredQuiz", () => {
  it("builds one fillBlank question per eligible card, skipping ones without a matching example", () => {
    const withoutExample = makeCard({
      id: "5",
      kanji: "日和見",
      reading: "ひよりみ",
      meaning: "情勢を見て有利な方につくこと",
      example: "全く別の文章です。",
    });
    const pool = [...deck, withoutExample];
    const quiz = buildFilteredQuiz(pool, pool, "fillBlank");
    expect(quiz.length).toBe(deck.length); // withoutExample is skipped
    for (const q of quiz) {
      expect(q.type).toBe("fillBlank");
    }
  });

  it("builds one 4-choice question (synAnt or meaning) per eligible card", () => {
    const quiz = buildFilteredQuiz(deck, deck, "fourChoice");
    expect(quiz.length).toBe(deck.length);
    for (const q of quiz) {
      expect(["synAnt", "meaning"]).toContain(q.type);
      expect(q.choices).toHaveLength(4);
    }
  });

  it("returns an empty array when given no cards", () => {
    expect(buildFilteredQuiz([], deck, "fourChoice")).toEqual([]);
  });
});
