import { useRef, useState } from "react";
import type { SortMode, VocabCard } from "../types/vocab";
import { exportCardsAsJSON, importCardsFromJSON } from "../lib/repository";

type Props = {
  cards: VocabCard[];
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  dark: boolean;
  onToggleDark: () => void;
  onImport: (cards: VocabCard[]) => void;
};

export function SettingsView({
  cards,
  sortMode,
  onSortModeChange,
  dark,
  onToggleDark,
  onImport,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [sortMessage, setSortMessage] = useState("");

  function handleExport() {
    const json = exportCardsAsJSON(cards);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importCardsFromJSON(String(reader.result));
      if (result.ok) {
        onImport(result.cards);
        setMessage(`${result.cards.length}件のカードを読み込みました`);
      } else {
        setMessage(`インポート失敗: ${result.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 p-4">
      <section>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">表示</h2>
        <button
          className="rounded-full border border-washi-border bg-washi-card px-4 py-2 text-sm text-sumi-ink transition active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
          onClick={onToggleDark}
        >
          {dark ? "☀️ ライトモードにする" : "🌙 ダークモードにする"}
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">並び替え</h2>
        <div className="flex gap-2">
          {(
            [
              { mode: "registered", label: "登録順" },
              { mode: "aiueo", label: "五十音順" },
              { mode: "weak", label: "苦手順" },
            ] as { mode: SortMode; label: string }[]
          ).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => {
                onSortModeChange(mode);
                setSortMessage(`並び順を「${label}」に変更しました（カード画面に反映されます）`);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition active:scale-95 ${
                sortMode === mode
                  ? "border-vermillion bg-vermillion text-white"
                  : "border-washi-border bg-washi-card text-sumi-ink dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {sortMessage && (
          <p className="mt-2 text-sm text-good">{sortMessage}</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          データのバックアップ
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-vermillion px-4 py-2 text-sm font-semibold text-white active:scale-95"
            onClick={handleExport}
          >
            JSONをエクスポート
          </button>
          <button
            className="rounded-full border border-washi-border bg-washi-card px-4 py-2 text-sm text-sumi-ink active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
            onClick={() => fileInputRef.current?.click()}
          >
            JSONをインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {message && <p className="mt-2 text-sm text-sumi-sub dark:text-sumi-subDark">{message}</p>}
      </section>
    </div>
  );
}
