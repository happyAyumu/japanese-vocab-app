import { describe, it, expect } from "vitest";
import { parseVocabText } from "./parser";

const FULL_SAMPLE = `【単語】瓦解（読み方：がかい）
■ 意味：物事が根底から崩れ壊れること
■ 語感・使う場面：組織や体制が崩壊する場面で使う硬い書き言葉
■ 例文：長年の信頼関係が一瞬で瓦解した。

▼ 類義語（2つ）
 1. 崩壊 ┈ 違い：より一般的で日常語としても使われる
    例文：計画は崩壊した。
 2. 破綻 ┈ 違い：経済的・財政的な文脈で使われやすい
    例文：財政が破綻した。

▼ 対義語（2つ）
 1. 安定
    例文：会社の経営は安定している。
 2. 存続
    例文：伝統が存続している。
`;

describe("parseVocabText", () => {
  it("parses a well-formed entry into all fields", () => {
    const result = parseVocabText(FULL_SAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.word.kanji).toBe("瓦解");
    expect(result.word.reading).toBe("がかい");
    expect(result.word.meaning).toBe("物事が根底から崩れ壊れること");
    expect(result.word.example).toBe("長年の信頼関係が一瞬で瓦解した。");
    expect(result.word.synonyms).toEqual([
      { word: "崩壊", nuance: "より一般的で日常語としても使われる" },
      { word: "破綻", nuance: "経済的・財政的な文脈で使われやすい" },
    ]);
    expect(result.word.antonyms).toEqual([
      { word: "安定", example: "会社の経営は安定している。" },
      { word: "存続", example: "伝統が存続している。" },
    ]);
  });

  it("allows zero antonyms", () => {
    const noAntonyms = FULL_SAMPLE.replace(
      /▼\s*対義語[\s\S]*/,
      "",
    );
    const result = parseVocabText(noAntonyms);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.word.antonyms).toEqual([]);
  });

  it("reports missing fields when the header is malformed", () => {
    const broken = FULL_SAMPLE.replace(
      "【単語】瓦解（読み方：がかい）",
      "瓦解 がかい",
    );
    const result = parseVocabText(broken);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure result");
    expect(result.missingFields).toContain("単語（漢字）");
    expect(result.missingFields).toContain("読み方");
  });

  it("reports a missing meaning field", () => {
    const broken = FULL_SAMPLE.replace(
      "■ 意味：物事が根底から崩れ壊れること\n",
      "",
    );
    const result = parseVocabText(broken);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure result");
    expect(result.missingFields).toContain("意味");
  });

  it("reports missing synonyms when the block is absent", () => {
    const broken = FULL_SAMPLE.replace(/▼\s*類義語[\s\S]*?(?=▼\s*対義語)/, "");
    const result = parseVocabText(broken);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure result");
    expect(result.missingFields).toContain("類義語");
  });

  it("reports a missing example field", () => {
    const broken = FULL_SAMPLE.replace(
      "■ 例文：長年の信頼関係が一瞬で瓦解した。\n",
      "",
    );
    const result = parseVocabText(broken);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure result");
    expect(result.missingFields).toContain("例文");
  });
});
