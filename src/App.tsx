import { useState } from "react";
import type { SortMode } from "./types/vocab";
import { useVocabStore } from "./hooks/useVocabStore";
import { useSRS } from "./hooks/useSRS";
import { useDarkMode } from "./hooks/useDarkMode";
import { DeckView } from "./components/DeckView";
import { QuizView } from "./components/QuizView";
import { ProgressView } from "./components/ProgressView";
import { AddWordView } from "./components/AddWordView";
import { SettingsView } from "./components/SettingsView";

type Tab = "deck" | "quiz" | "progress" | "add" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "deck", label: "カード" },
  { key: "quiz", label: "クイズ" },
  { key: "progress", label: "進捗" },
  { key: "add", label: "単語を追加" },
  { key: "settings", label: "設定" },
];

export default function App() {
  const { cards, addCard, answerCard, replaceAll } = useVocabStore();
  const { dueCards, mastery } = useSRS(cards);
  const { dark, toggleDark } = useDarkMode();
  const [tab, setTab] = useState<Tab>("deck");
  const [sortMode, setSortMode] = useState<SortMode>("registered");

  const dueCardIds = new Set(dueCards.map((c) => c.id));

  return (
    <div className="min-h-screen bg-washi-bg pb-24 text-sumi-ink dark:bg-washi-bgDark dark:text-sumi-inkDark">
      <header className="flex flex-col items-center px-4 pb-4 pt-6">
        <h1 className="text-xl font-bold tracking-wide">日本語単語帳</h1>
        <p className="mt-1 text-xs text-sumi-sub dark:text-sumi-subDark">
          全{cards.length}語 ／ 習得率 {Math.round(mastery * 100)}%
        </p>
      </header>

      <main>
        {tab === "deck" && (
          <DeckView
            cards={cards}
            dueCardIds={dueCardIds}
            sortMode={sortMode}
            onAnswer={(id, correct) => answerCard(id, correct)}
          />
        )}
        {tab === "quiz" && (
          <QuizView
            cards={cards}
            onFinish={(results) => {
              for (const r of results) {
                if (!r.correct) {
                  answerCard(r.cardId, false);
                }
              }
            }}
          />
        )}
        {tab === "progress" && <ProgressView cards={cards} />}
        {tab === "add" && <AddWordView onAdd={addCard} />}
        {tab === "settings" && (
          <SettingsView
            cards={cards}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            dark={dark}
            onToggleDark={toggleDark}
            onImport={replaceAll}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-washi-border bg-washi-card py-2 dark:border-washi-borderDark dark:bg-washi-cardDark">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              tab === key
                ? "text-vermillion"
                : "text-sumi-sub dark:text-sumi-subDark"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
