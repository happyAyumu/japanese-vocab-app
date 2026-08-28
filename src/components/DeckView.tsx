import { useEffect, useMemo, useRef, useState } from "react";
import type { SortMode, VocabCard } from "../types/vocab";
import { Flashcard } from "./Flashcard";
import { sortByWeakness } from "../lib/srs";

type FilterMode = "all" | "dueToday" | "weak";

type Props = {
  cards: VocabCard[];
  dueCardIds: Set<string>;
  sortMode: SortMode;
  onAnswer: (id: string, correct: boolean) => void;
};

export function DeckView({ cards, dueCardIds, sortMode, onAnswer }: Props) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const baseSorted = useMemo(() => {
    if (sortMode === "aiueo") {
      return [...cards].sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
    }
    if (sortMode === "weak") {
      return sortByWeakness(cards);
    }
    return cards; // registered order
  }, [cards, sortMode]);

  const filtered = useMemo(() => {
    let list = baseSorted;
    if (filterMode === "dueToday") {
      list = list.filter((c) => dueCardIds.has(c.id));
    } else if (filterMode === "weak") {
      list = list.filter((c) => c.srsLevel < 0 || c.srsLevel === 0);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSorted, filterMode, dueCardIds]);

  const shuffled = useMemo(() => {
    if (shuffleSeed === 0) return filtered;
    const arr = [...filtered];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, shuffleSeed]);

  useEffect(() => {
    setIdx(0);
  }, [filterMode, shuffleSeed, cards.length]);

  const current = shuffled[idx];

  function go(delta: number) {
    if (shuffled.length === 0) return;
    setIdx((i) => (i + delta + shuffled.length) % shuffled.length);
  }

  function handleAnswer(correct: boolean) {
    if (!current) return;
    onAnswer(current.id, correct);
    go(1);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <FilterButton active={filterMode === "all"} onClick={() => setFilterMode("all")}>
          すべて
        </FilterButton>
        <FilterButton
          active={filterMode === "dueToday"}
          onClick={() => setFilterMode("dueToday")}
        >
          今日の復習（{dueCardIds.size}）
        </FilterButton>
        <FilterButton active={filterMode === "weak"} onClick={() => setFilterMode("weak")}>
          苦手のみ
        </FilterButton>
        <button
          className="rounded-full border border-washi-border bg-washi-card px-4 py-2 text-sm text-sumi-ink transition active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
          onClick={() => setShuffleSeed((s) => s + 1)}
        >
          シャッフル
        </button>
      </div>

      <div className="mb-2 text-sm text-sumi-sub dark:text-sumi-subDark">
        {shuffled.length > 0 ? `${idx + 1} / ${shuffled.length}` : ""}
      </div>

      {current ? (
        <div
          className="w-full max-w-md"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 60) {
              go(dx < 0 ? 1 : -1);
            }
            touchStartX.current = null;
          }}
        >
          <Flashcard card={current} />
        </div>
      ) : (
        <div className="p-10 text-center text-sm text-sumi-sub dark:text-sumi-subDark">
          該当する単語がありません 👍
        </div>
      )}

      <div className="mt-5 flex items-center gap-4">
        <NavButton onClick={() => go(-1)}>←</NavButton>
        <button
          className="rounded-full border border-weak px-4 py-3 text-sm font-semibold text-weak transition active:scale-95"
          onClick={() => handleAnswer(false)}
          disabled={!current}
        >
          わからない
        </button>
        <button
          className="rounded-full border border-good px-4 py-3 text-sm font-semibold text-good transition active:scale-95"
          onClick={() => handleAnswer(true)}
          disabled={!current}
        >
          覚えた
        </button>
        <NavButton onClick={() => go(1)}>→</NavButton>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition active:scale-95 ${
        active
          ? "border-vermillion bg-vermillion text-white"
          : "border-washi-border bg-washi-card text-sumi-ink dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
      }`}
    >
      {children}
    </button>
  );
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-washi-border bg-washi-card text-lg text-sumi-ink transition active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
    >
      {children}
    </button>
  );
}
