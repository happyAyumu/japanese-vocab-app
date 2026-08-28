import type { VocabCard } from "../types/vocab";
import { seedWords } from "../data/seedWords";

/**
 * カードデータの永続化を抽象化するリポジトリインターフェース。
 * 実装を差し替えるだけで localStorage → SQLite/バックエンド API 等へ移行できるようにする。
 */
export interface VocabRepository {
  load(): VocabCard[];
  save(cards: VocabCard[]): void;
  clear(): void;
}

const STORAGE_KEY = "vocab-app:cards";

export class LocalStorageVocabRepository implements VocabRepository {
  constructor(private storageKey: string = STORAGE_KEY) {}

  load(): VocabCard[] {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        this.save(seedWords);
        return seedWords;
      }
      const parsed = JSON.parse(raw) as VocabCard[];
      if (!Array.isArray(parsed)) throw new Error("invalid stored data");
      return parsed;
    } catch {
      return seedWords;
    }
  }

  save(cards: VocabCard[]): void {
    window.localStorage.setItem(this.storageKey, JSON.stringify(cards));
  }

  clear(): void {
    window.localStorage.removeItem(this.storageKey);
  }
}

export const DARK_MODE_KEY = "vocab-app:dark-mode";
export const SORT_MODE_KEY = "vocab-app:sort-mode";

export function loadDarkMode(): boolean {
  try {
    return window.localStorage.getItem(DARK_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveDarkMode(value: boolean): void {
  window.localStorage.setItem(DARK_MODE_KEY, value ? "1" : "0");
}

export function exportCardsAsJSON(cards: VocabCard[]): string {
  return JSON.stringify(cards, null, 2);
}

export type ImportResult =
  | { ok: true; cards: VocabCard[] }
  | { ok: false; error: string };

export function importCardsFromJSON(json: string): ImportResult {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "JSONの内容が配列ではありません" };
    }
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.id !== "string" ||
        typeof item.kanji !== "string"
      ) {
        return { ok: false, error: "カードのデータ形式が不正です" };
      }
    }
    return { ok: true, cards: parsed as VocabCard[] };
  } catch {
    return { ok: false, error: "JSONの解析に失敗しました" };
  }
}

export const vocabRepository: VocabRepository = new LocalStorageVocabRepository();
