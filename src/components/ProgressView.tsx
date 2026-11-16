import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VocabCard } from "../types/vocab";
import {
  MASTERY_LEVEL_THRESHOLD,
  computeStreak,
  currentYearMonth,
  isMastered,
  levelDistribution,
  masteryRate,
  monthlyStudyCounts,
  shiftYearMonth,
} from "../lib/srs";

type Props = {
  cards: VocabCard[];
};

function formatYearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${Number(month)}月`;
}

export function ProgressView({ cards }: Props) {
  const rate = masteryRate(cards);
  const masteredCount = cards.filter(isMastered).length;
  const streak = useMemo(() => computeStreak(cards), [cards]);
  const buckets = useMemo(() => levelDistribution(cards), [cards]);

  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const monthlyCounts = useMemo(() => monthlyStudyCounts(cards, yearMonth), [cards, yearMonth]);
  const chartData = useMemo(
    () => monthlyCounts.map((d) => ({ ...d, day: Number(d.date.slice(8, 10)) })),
    [monthlyCounts],
  );
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 10) - 1);

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

      <div className="flex items-center gap-4 rounded-2xl border border-washi-border bg-washi-card p-5 dark:border-washi-borderDark dark:bg-washi-cardDark">
        <div className="text-4xl">🔥</div>
        <div>
          <div className="text-2xl font-bold text-sumi-ink dark:text-sumi-inkDark">
            {streak}日連続
          </div>
          <p className="text-xs text-sumi-sub dark:text-sumi-subDark">
            フラッシュカードの評価、またはクイズの回答で記録されます
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          レベル別の割合
        </h2>
        <div className="flex justify-center">
          <PieChart width={240} height={220}>
            <Pie
              data={buckets}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {buckets.map((bucket) => (
                <Cell key={bucket.label} fill={bucket.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {buckets.map((bucket) => (
            <li
              key={bucket.label}
              className="flex items-center gap-2 text-sm text-sumi-ink dark:text-sumi-inkDark"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: bucket.color }}
              />
              <span>{bucket.label}</span>
              <span className="text-sumi-sub dark:text-sumi-subDark">（{bucket.count}語）</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
            月間の学習量
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYearMonth((ym) => shiftYearMonth(ym, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-washi-border bg-washi-card text-sm text-sumi-ink active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
            >
              ←
            </button>
            <span className="min-w-[5.5rem] text-center text-sm text-sumi-ink dark:text-sumi-inkDark">
              {formatYearMonthLabel(yearMonth)}
            </span>
            <button
              type="button"
              onClick={() => setYearMonth((ym) => shiftYearMonth(ym, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-washi-border bg-washi-card text-sm text-sumi-ink active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
            >
              →
            </button>
          </div>
        </div>
        <p className="mb-2 text-xs text-sumi-sub dark:text-sumi-subDark">
          フラッシュカードの評価＋クイズの回答の合計回数（1日ごと、月の全日を表示）
        </p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ddd0" />
              <XAxis
                dataKey="day"
                fontSize={11}
                stroke="#7a7266"
                interval={tickInterval}
              />
              <YAxis allowDecimals={false} fontSize={11} stroke="#7a7266" width={40} />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""} />
              <Bar dataKey="count" fill="#a8562f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
