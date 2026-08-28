import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VocabCard } from "../types/vocab";
import { MASTERY_LEVEL_THRESHOLD, isMastered, masteryRate, recentAccuracy } from "../lib/srs";

type Props = {
  cards: VocabCard[];
};

export function ProgressView({ cards }: Props) {
  const rate = masteryRate(cards);
  const masteredCount = cards.filter(isMastered).length;

  const byDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cards) {
      counts.set(c.registeredAt, (counts.get(c.registeredAt) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [cards]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4">
      <div>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          全体の習得率（レベル{MASTERY_LEVEL_THRESHOLD}以上）
        </h2>
        <div className="h-4 w-full overflow-hidden rounded-full bg-washi-border dark:bg-washi-borderDark">
          <div
            className="h-full rounded-full bg-vermillion transition-all"
            style={{ width: `${Math.round(rate * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-sumi-sub dark:text-sumi-subDark">
          {cards.length}語中 {masteredCount}語が習得済み（{Math.round(rate * 100)}%）
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          追加日ごとの単語数
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ddd0" />
              <XAxis dataKey="date" fontSize={11} stroke="#7a7266" />
              <YAxis allowDecimals={false} fontSize={11} stroke="#7a7266" />
              <Tooltip />
              <Bar dataKey="count" fill="#a8562f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          単語ごとの詳細
        </h2>
        <div className="flex flex-col gap-2">
          {cards.map((c) => {
            const accuracy = recentAccuracy(c);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-washi-border bg-washi-card px-4 py-2 dark:border-washi-borderDark dark:bg-washi-cardDark"
              >
                <div>
                  <span className="font-semibold text-sumi-ink dark:text-sumi-inkDark">
                    {c.kanji}
                  </span>
                  <span className="ml-2 text-xs text-sumi-sub dark:text-sumi-subDark">
                    Lv.{c.srsLevel}
                  </span>
                </div>
                <div className="text-xs text-sumi-sub dark:text-sumi-subDark">
                  {accuracy === null ? "記録なし" : `${Math.round(accuracy * 100)}%`}
                  {" ／ "}
                  {c.history.length}回回答
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
