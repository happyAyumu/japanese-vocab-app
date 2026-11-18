import { useEffect, useMemo, useRef, useState } from "react";
import type { Grade, SortMode, VocabCard } from "../types/vocab";
import { Flashcard } from "./Flashcard";
import { formatIntervalLabel, nowISO, previewGradeIntervals, sortByWeakness } from "../lib/srs";

type FilterMode = "all" | "dueToday" | "weak";

type Props = {
  cards: VocabCard[];
  dueCardIds: Set<string>;
  sortMode: SortMode;
  onGrade: (id: string, grade: Grade) => void;
};

export function DeckView({ cards, dueCardIds, sortMode, onGrade }: Props) {
  // デフォルトは「今日の復習」。評価すると即座にnextReviewAtが先に伸びて
  // dueCardIdsから外れるため、一覧から自動的に消える。
  const [filterMode, setFilterMode] = useState<FilterMode>("dueToday");
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

  // 「今日の復習」「苦手のみ」は評価するたびに対象から外れて一覧が縮むことがある。
  // そのときidxを進めてしまうと、配列が1つ詰まった上にさらに1つ飛ばすことになり、
  // カードを読み飛ばした末にidxが配列範囲外になってしまう（起きていたバグ）。
  // 念のため、範囲外になったら安全に0へ戻す。
  useEffect(() => {
    if (idx >= shuffled.length) {
      setIdx(0);
    }
  }, [idx, shuffled.length]);

  const current = shuffled[idx];

  function go(delta: number) {
    if (shuffled.length === 0) return;
    setIdx((i) => (i + delta + shuffled.length) % shuffled.length);
  }

  function handleGrade(grade: Grade) {
    if (!current) return;
    onGrade(current.id, grade);
    // 「すべて」表示は評価しても一覧の件数が変わらないので、次のカードへ進める。
    // 「今日の復習」「苦手のみ」は評価によって対象から外れた分、配列が詰まって
    // 同じidxがそのまま次のカードを指すようになるため、ここで進めると1枚飛ばしてしまう。
    if (filterMode === "all") {
      go(1);
    }
  }

  const preview = current ? previewGradeIntervals(current) : null;
  const isDue = current ? current.nextReviewAt <= nowISO() : false;
  const hoursUntilDue = current
    ? Math.max(
        0,
        Math.round(
          (new Date(current.nextReviewAt).getTime() - new Date().getTime()) / (60 * 60 * 1000),
        ),
      )
    : 0;

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

      <div className="mt-5 flex w-full max-w-md items-center justify-center gap-2">
        <NavButton onClick={() => go(-1)}>←</NavButton>
        {current && !isDue ? (
          <div className="flex-1 rounded-xl border border-washi-border bg-washi-card px-3 py-3 text-center text-xs text-sumi-sub dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-subDark">
            まだ復習時期ではありません（次回: {formatIntervalLabel(hoursUntilDue)}）
          </div>
        ) : (
          <>
            <GradeButton
              colorClass="border-weak text-weak"
              label="もう一度"
              interval={preview ? formatIntervalLabel(preview.again) : ""}
              onClick={() => handleGrade("again")}
              disabled={!current}
            />
            <GradeButton
              colorClass="border-hard text-hard"
              label="難しい"
              interval={preview ? formatIntervalLabel(preview.hard) : ""}
              onClick={() => handleGrade("hard")}
              disabled={!current}
            />
            <GradeButton
              colorClass="border-good text-good"
              label="普通"
              interval={preview ? formatIntervalLabel(preview.good) : ""}
              onClick={() => handleGrade("good")}
              disabled={!current}
            />
            <GradeButton
              colorClass="border-easy text-easy"
              label="簡単"
              interval={preview ? formatIntervalLabel(preview.easy) : ""}
              onClick={() => handleGrade("easy")}
              disabled={!current}
            />
          </>
        )}
        <NavButton onClick={() => go(1)}>→</NavButton>
      </div>
    </div>
  );
}

function GradeButton({
  colorClass,
  label,
  interval,
  onClick,
  disabled,
}: {
  colorClass: string;
  label: string;
  interval: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${colorClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-[10px] font-normal text-sumi-sub dark:text-sumi-subDark">
        {interval}
      </span>
      <span>{label}</span>
    </button>
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
