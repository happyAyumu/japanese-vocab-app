import { useState } from "react";
import type { Antonym, Synonym, VocabCard } from "../types/vocab";
import { parseVocabText } from "../lib/parser";
import { nowISO, todayISO } from "../lib/srs";

type Props = {
  onAdd: (card: VocabCard) => void;
};

const EMPTY_SYNONYM: Synonym = { word: "", nuance: "" };
const EMPTY_ANTONYM: Antonym = { word: "", example: "" };

const FORMAT_TEMPLATE = `【単語】〇〇（読み方：〇〇）
■ 意味：〇〇
■ 語感・使う場面：〇〇
■ 例文：〇〇

▼ 類義語（2つ）
 1. 〇〇 ┈ 違い：〇〇
    例文：〇〇
 2. 〇〇 ┈ 違い：〇〇
    例文：〇〇

▼ 対義語（2つ）
 1. 〇〇
    例文：〇〇
 2. 〇〇
    例文：〇〇`;

const SAMPLE_TEXT = `【単語】飄々（読み方：ひょうひょう）
■ 意味：世間の評価や周囲の状況に動じず、気負わずつかみどころのない様子
■ 語感・使う場面：人の性格や態度を表す際に使う、やや肯定的で飄逸なニュアンスを持つ書き言葉
■ 例文：彼はどんな状況でも飄々としている。

▼ 類義語（2つ）
 1. 超然 ┈ 違い：物事に動じない点は似ているが、「飄々」より重々しく気高い響きがある
    例文：彼は批判にも超然とした態度を崩さなかった。
 2. のらりくらり ┈ 違い：つかみどころがない点は似ているが、はぐらかす・逃げるという否定的なニュアンスが強い
    例文：彼はのらりくらりと質問をかわした。

▼ 対義語（2つ）
 1. 生真面目
    例文：彼は生真面目すぎて周囲と衝突することがある。
 2. 深刻
    例文：彼は深刻な表情で会議に臨んだ。`;

export function AddWordView({ onAdd }: Props) {
  const [pasteText, setPasteText] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [kanji, setKanji] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [synonyms, setSynonyms] = useState<Synonym[]>([{ ...EMPTY_SYNONYM }, { ...EMPTY_SYNONYM }]);
  const [antonyms, setAntonyms] = useState<Antonym[]>([]);
  const [savedMessage, setSavedMessage] = useState("");

  function handleParse() {
    const result = parseVocabText(pasteText);
    setKanji(result.word.kanji ?? "");
    setReading(result.word.reading ?? "");
    setMeaning(result.word.meaning ?? "");
    if (result.word.example) {
      setExample(result.word.example);
    }
    if (result.word.synonyms && result.word.synonyms.length > 0) {
      setSynonyms(result.word.synonyms);
    }
    if (result.word.antonyms) {
      setAntonyms(result.word.antonyms);
    }
    setMissingFields(result.ok ? [] : result.missingFields);
    setSavedMessage("");
  }

  function handleSave() {
    if (!kanji.trim() || !reading.trim() || !meaning.trim()) {
      setMissingFields((prev) => {
        const fields = new Set(prev);
        if (!kanji.trim()) fields.add("単語（漢字）");
        if (!reading.trim()) fields.add("読み方");
        if (!meaning.trim()) fields.add("意味");
        return Array.from(fields);
      });
      return;
    }

    const card: VocabCard = {
      id: `word-${Date.now()}`,
      kanji: kanji.trim(),
      reading: reading.trim(),
      meaning: meaning.trim(),
      synonyms: synonyms.filter((s) => s.word.trim()),
      antonyms: antonyms.filter((a) => a.word.trim()),
      example: example.trim(),
      registeredAt: todayISO(),
      srsLevel: 0,
      nextReviewAt: nowISO(),
      history: [],
      quizSrsLevel: 0,
      quizNextReviewAt: nowISO(),
      quizHistory: [],
    };

    onAdd(card);
    setSavedMessage(`「${card.kanji}」を追加しました`);
    setKanji("");
    setReading("");
    setMeaning("");
    setExample("");
    setSynonyms([{ ...EMPTY_SYNONYM }, { ...EMPTY_SYNONYM }]);
    setAntonyms([]);
    setPasteText("");
    setMissingFields([]);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-4">
      <section>
        <h2 className="mb-2 text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">
          テキストを貼り付けて自動登録
        </h2>

        <details className="mb-3 rounded-lg border border-washi-border bg-washi-card p-3 text-sm dark:border-washi-borderDark dark:bg-washi-cardDark">
          <summary className="cursor-pointer font-semibold text-vermillion">
            入力フォーマットの説明を見る
          </summary>
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-sumi-sub dark:text-sumi-subDark">
              下記のテンプレート通りにテキストを用意して貼り付けると、自動的に各項目へ分解されます。
              類義語・対義語はそれぞれ2つまで対応していますが、1つだけでも登録できます。
              <br />
              「■ 例文：」の行に単語自体の例文を入れておくと、そこも自動で反映されます（省略した場合は解析後に手動で入力してください）。
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-washi-bg p-2 text-xs text-sumi-ink dark:bg-washi-bgDark dark:text-sumi-inkDark">
              {FORMAT_TEMPLATE}
            </pre>
            <div>
              <p className="mb-1 text-xs font-semibold text-sumi-ink dark:text-sumi-inkDark">
                例（「飄々」）:
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-washi-bg p-2 text-xs text-sumi-ink dark:bg-washi-bgDark dark:text-sumi-inkDark">
                {SAMPLE_TEXT}
              </pre>
              <button
                type="button"
                className="mt-2 rounded-full border border-washi-border px-3 py-1 text-xs text-sumi-ink active:scale-95 dark:border-washi-borderDark dark:text-sumi-inkDark"
                onClick={() => setPasteText(SAMPLE_TEXT)}
              >
                この例を下のテキストエリアに読み込む
              </button>
            </div>
          </div>
        </details>

        <textarea
          className="h-40 w-full rounded-lg border border-washi-border bg-washi-card p-3 text-sm text-sumi-ink outline-none focus:border-vermillion dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
          placeholder={"【単語】〇〇（読み方：〇〇）\n■ 意味：〇〇\n..."}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <button
          className="mt-2 rounded-full bg-vermillion px-4 py-2 text-sm font-semibold text-white active:scale-95"
          onClick={handleParse}
          disabled={!pasteText.trim()}
        >
          解析してフォームに反映
        </button>
        {missingFields.length > 0 && (
          <p className="mt-2 text-sm text-weak">
            読み取れなかった項目: {missingFields.join("、")}
            （下のフォームで手動補完してください）
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-sumi-ink dark:text-sumi-inkDark">手動入力・確認</h2>

        <LabeledInput label="単語（漢字）" value={kanji} onChange={setKanji} />
        <LabeledInput label="読み方" value={reading} onChange={setReading} />
        <LabeledTextarea label="意味" value={meaning} onChange={setMeaning} />
        <LabeledTextarea label="例文" value={example} onChange={setExample} />

        <div>
          <div className="mb-1 text-xs font-bold text-vermillion">類義語</div>
          {synonyms.map((s, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                className="w-1/3 rounded-lg border border-washi-border bg-washi-card px-2 py-1 text-sm dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
                placeholder="語"
                value={s.word}
                onChange={(e) => {
                  const next = [...synonyms];
                  next[i] = { ...next[i], word: e.target.value };
                  setSynonyms(next);
                }}
              />
              <input
                className="flex-1 rounded-lg border border-washi-border bg-washi-card px-2 py-1 text-sm dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
                placeholder="ニュアンスの違い"
                value={s.nuance}
                onChange={(e) => {
                  const next = [...synonyms];
                  next[i] = { ...next[i], nuance: e.target.value };
                  setSynonyms(next);
                }}
              />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-vermillion">
            対義語
            <button
              className="rounded-full border border-washi-border px-2 py-0.5 text-[11px] font-normal text-sumi-sub dark:border-washi-borderDark dark:text-sumi-subDark"
              onClick={() => setAntonyms((prev) => [...prev, { ...EMPTY_ANTONYM }])}
              type="button"
            >
              + 追加
            </button>
          </div>
          {antonyms.map((a, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                className="w-1/3 rounded-lg border border-washi-border bg-washi-card px-2 py-1 text-sm dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
                placeholder="語"
                value={a.word}
                onChange={(e) => {
                  const next = [...antonyms];
                  next[i] = { ...next[i], word: e.target.value };
                  setAntonyms(next);
                }}
              />
              <input
                className="flex-1 rounded-lg border border-washi-border bg-washi-card px-2 py-1 text-sm dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
                placeholder="例文"
                value={a.example}
                onChange={(e) => {
                  const next = [...antonyms];
                  next[i] = { ...next[i], example: e.target.value };
                  setAntonyms(next);
                }}
              />
            </div>
          ))}
        </div>

        <button
          className="mt-2 self-start rounded-full bg-sumi-ink px-6 py-3 text-sm font-semibold text-washi-bg active:scale-95 dark:bg-sumi-inkDark dark:text-sumi-ink"
          onClick={handleSave}
        >
          カードを追加
        </button>
        {savedMessage && <p className="text-sm text-good">{savedMessage}</p>}
      </section>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-sumi-ink dark:text-sumi-inkDark">
      {label}
      <input
        className="rounded-lg border border-washi-border bg-washi-card px-3 py-2 outline-none focus:border-vermillion dark:border-washi-borderDark dark:bg-washi-cardDark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-sumi-ink dark:text-sumi-inkDark">
      {label}
      <textarea
        className="h-20 rounded-lg border border-washi-border bg-washi-card px-3 py-2 outline-none focus:border-vermillion dark:border-washi-borderDark dark:bg-washi-cardDark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
