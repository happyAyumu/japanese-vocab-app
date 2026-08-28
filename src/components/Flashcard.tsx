import { useState } from "react";
import type { VocabCard } from "../types/vocab";
import { recentAccuracy } from "../lib/srs";

type Props = {
  card: VocabCard;
};

export function Flashcard({ card }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative h-[360px] w-full max-w-md [perspective:1400px]"
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`card-flip relative h-full w-full cursor-pointer rounded-2xl shadow-lg ${
          flipped ? "flipped" : ""
        }`}
      >
        <div className="card-face absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl border border-washi-border bg-washi-card p-7 text-center dark:border-washi-borderDark dark:bg-washi-cardDark">
          {card.srsLevel < 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-vermillion-soft px-3 py-1 text-xs font-semibold text-weak dark:bg-vermillion-softDark">
              要復習
            </span>
          )}
          <div className="text-3xl font-bold text-sumi-ink dark:text-sumi-inkDark">
            {card.kanji}
          </div>
          <div className="mt-2 text-base text-sumi-sub dark:text-sumi-subDark">
            {card.reading}
          </div>
          <div className="absolute bottom-4 text-xs text-sumi-sub dark:text-sumi-subDark">
            タップして意味を見る
          </div>
        </div>

        <div className="card-face card-face-back absolute inset-0 flex flex-col items-start overflow-y-auto rounded-2xl border border-washi-border bg-washi-card p-6 text-left dark:border-washi-borderDark dark:bg-washi-cardDark">
          <Section label="意味">
            <p className="text-sm leading-relaxed text-sumi-ink dark:text-sumi-inkDark">
              {card.meaning}
            </p>
          </Section>

          <Section label="類義語">
            {card.synonyms.map((s, i) => (
              <div key={i} className="mb-1 text-sm text-sumi-ink dark:text-sumi-inkDark">
                ・<b>{s.word}</b> ── {s.nuance}
              </div>
            ))}
          </Section>

          <Section label="対義語">
            {card.antonyms.length > 0 ? (
              card.antonyms.map((a, i) => (
                <div key={i} className="mb-1 text-sm text-sumi-ink dark:text-sumi-inkDark">
                  ・<b>{a.word}</b>
                  <br />
                  <span className="text-xs text-sumi-sub dark:text-sumi-subDark">{a.example}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-sumi-sub dark:text-sumi-subDark">特になし</span>
            )}
          </Section>

          <Section label="例文">
            <p className="text-sm text-sumi-sub dark:text-sumi-subDark">{card.example}</p>
          </Section>

          <div className="mt-1 text-xs text-sumi-sub dark:text-sumi-subDark">
            正答率: {formatAccuracy(recentAccuracy(card))} ／ レベル {card.srsLevel}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 w-full">
      <div className="mb-1 text-xs font-bold tracking-wide text-vermillion">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return "記録なし";
  return `${Math.round(accuracy * 100)}%`;
}
