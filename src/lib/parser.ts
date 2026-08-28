import type { Antonym, Synonym } from "../types/vocab";

export type ParsedWord = {
  kanji: string;
  reading: string;
  meaning: string;
  nuance: string; // 語感・使う場面（参考情報として保持。カード自体には必須項目ではない）
  synonyms: Synonym[];
  antonyms: Antonym[];
};

export type ParseResult =
  | { ok: true; word: ParsedWord }
  | { ok: false; word: Partial<ParsedWord>; missingFields: string[] };

/**
 * 下記フォーマットのテキストをパースする:
 *
 * 【単語】〇〇（読み方：〇〇）
 * ■ 意味：〇〇
 * ■ 語感・使う場面：〇〇
 *
 * ▼ 類義語（2つ）
 *  1. 〇〇 ┈ 違い：〇〇
 *     例文：〇〇
 *  2. 〇〇 ┈ 違い：〇〇
 *     例文：〇〇
 *
 * ▼ 対義語（2つ）
 *  1. 〇〇
 *     例文：〇〇
 *  2. 〇〇
 *     例文：〇〇
 */
export function parseVocabText(raw: string): ParseResult {
  const text = raw.replace(/\r\n/g, "\n");
  const missingFields: string[] = [];

  const headerMatch = text.match(
    /【単語】\s*([^（(\n]+?)\s*[（(]\s*読み方[:：]\s*([^）)\n]+)[）)]/,
  );
  const kanji = headerMatch?.[1]?.trim();
  const reading = headerMatch?.[2]?.trim();
  if (!kanji) missingFields.push("単語（漢字）");
  if (!reading) missingFields.push("読み方");

  const meaningMatch = text.match(/■\s*意味[:：]\s*(.+)/);
  const meaning = meaningMatch?.[1]?.trim();
  if (!meaning) missingFields.push("意味");

  const nuanceMatch = text.match(/■\s*語感[・･]使う場面[:：]\s*(.+)/);
  const nuance = nuanceMatch?.[1]?.trim() ?? "";

  const synonyms = parseSynonymBlock(text);
  if (synonyms.length === 0) missingFields.push("類義語");

  const antonyms = parseAntonymBlock(text);
  // 対義語は0〜2個許容されるため、ブロック自体が存在しない場合のみ警告しない

  const word: Partial<ParsedWord> = {
    kanji,
    reading,
    meaning,
    nuance,
    synonyms,
    antonyms,
  };

  if (missingFields.length > 0) {
    return { ok: false, word, missingFields };
  }

  return {
    ok: true,
    word: {
      kanji: kanji!,
      reading: reading!,
      meaning: meaning!,
      nuance,
      synonyms,
      antonyms,
    },
  };
}

function parseSynonymBlock(text: string): Synonym[] {
  const blockMatch = text.match(
    /▼\s*類義語[^\n]*\n([\s\S]*?)(?=\n\s*▼|\s*$)/,
  );
  if (!blockMatch) return [];
  const block = blockMatch[1];

  const entries: Synonym[] = [];
  const itemRegex =
    /(\d+)\.\s*([^\n┈]+?)\s*┈\s*違い[:：]\s*([^\n]+)\n\s*例文[:：]\s*([^\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(block)) !== null) {
    entries.push({
      word: m[2].trim(),
      nuance: m[3].trim(),
    });
  }
  return entries;
}

function parseAntonymBlock(text: string): Antonym[] {
  const blockMatch = text.match(/▼\s*対義語[^\n]*\n([\s\S]*?)(?=\n\s*▼|\s*$)/);
  if (!blockMatch) return [];
  const block = blockMatch[1];

  const entries: Antonym[] = [];
  const itemRegex = /(\d+)\.\s*([^\n]+?)\s*\n\s*例文[:：]\s*([^\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(block)) !== null) {
    entries.push({
      word: m[2].trim(),
      example: m[3].trim(),
    });
  }
  return entries;
}
