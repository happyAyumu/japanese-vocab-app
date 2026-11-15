import { useMemo, useState } from "react";
import type { QuizQuestion, QuizResult, VocabCard } from "../types/vocab";
import { buildFilteredQuiz, type QuizCategory } from "../lib/quiz";

type Props = {
  cards: VocabCard[];
  dueCards: VocabCard[];
  onFinish: (results: QuizResult[]) => void;
};

const CATEGORY_LABEL: Record<QuizCategory, string> = {
  fourChoice: "4択",
  fillBlank: "穴埋め",
};

export function QuizView({ cards, dueCards, onFinish }: Props) {
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);

  const cardsById = useMemo(() => {
    const map = new Map<string, VocabCard>();
    for (const c of cards) map.set(c.id, c);
    return map;
  }, [cards]);

  function startQuiz(selected: QuizCategory) {
    const generated = buildFilteredQuiz(dueCards, cards, selected);
    setCategory(selected);
    setQuiz(generated);
    setQIdx(0);
    setResults([]);
    setFeedback(null);
    setInputValue("");
    setHintRevealed(false);
  }

  function submitAnswer(userAnswer: string) {
    if (!quiz) return;
    const question = quiz[qIdx];
    const correct = userAnswer.trim() === question.answer.trim();
    setFeedback(correct ? "correct" : "incorrect");
    setResults((prev) => [
      ...prev,
      { cardId: question.cardId, correct, question, userAnswer },
    ]);
  }

  function next() {
    if (!quiz) return;
    setFeedback(null);
    setInputValue("");
    setHintRevealed(false);
    if (qIdx + 1 >= quiz.length) {
      onFinish(results);
      setQuiz(null);
      setCategory(null);
    } else {
      setQIdx((i) => i + 1);
    }
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-sumi-sub dark:text-sumi-subDark">
          今日復習すべき単語を対象にクイズが出題されます。
        </p>

        {dueCards.length === 0 ? (
          <p className="text-sm font-semibold text-vermillion">
            今日復習すべき単語はありません
          </p>
        ) : (
          <p className="text-xs text-sumi-sub dark:text-sumi-subDark">
            対象: {dueCards.length}語
          </p>
        )}

        <div className="flex gap-3">
          <button
            className="rounded-full bg-vermillion px-6 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
            onClick={() => startQuiz("fourChoice")}
            disabled={dueCards.length === 0}
          >
            4択
          </button>
          <button
            className="rounded-full bg-vermillion px-6 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
            onClick={() => startQuiz("fillBlank")}
            disabled={dueCards.length === 0}
          >
            穴埋め
          </button>
        </div>

        {results.length > 0 && (
          <QuizSummary results={results} cardsById={cardsById} />
        )}
      </div>
    );
  }

  if (quiz.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-sumi-sub dark:text-sumi-subDark">
          {category && CATEGORY_LABEL[category]}形式で出題できる単語がありませんでした
          （例文に単語が含まれない、または類義語・対義語が未設定の可能性があります）。
        </p>
        <button
          className="rounded-full border border-washi-border bg-washi-card px-6 py-3 text-sm font-semibold text-sumi-ink active:scale-95 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
          onClick={() => {
            setQuiz(null);
            setCategory(null);
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  const question = quiz[qIdx];
  const card = cardsById.get(question.cardId);
  const remaining = quiz.length - qIdx;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xs text-sumi-sub dark:text-sumi-subDark">
        {qIdx + 1} / {quiz.length} 問　／　残り {remaining} 問
      </div>
      <div className="w-full max-w-md rounded-2xl border border-washi-border bg-washi-card p-6 dark:border-washi-borderDark dark:bg-washi-cardDark">
        <p className="mb-4 text-base leading-relaxed text-sumi-ink dark:text-sumi-inkDark">
          {question.prompt}
        </p>

        {question.type === "fillBlank" ? (
          <div className="flex flex-col gap-3">
            <input
              className="rounded-lg border border-washi-border bg-washi-bg px-3 py-2 text-sumi-ink outline-none focus:border-vermillion dark:border-washi-borderDark dark:bg-washi-bgDark dark:text-sumi-inkDark"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="空欄に入る単語"
              disabled={feedback !== null}
            />
            {feedback === null && (
              <div className="flex gap-2">
                <button
                  className="rounded-full bg-vermillion px-4 py-2 text-sm font-semibold text-white active:scale-95"
                  onClick={() => submitAnswer(inputValue)}
                  disabled={inputValue.trim().length === 0}
                >
                  回答する
                </button>
                <button
                  className="rounded-full border border-washi-border bg-washi-card px-4 py-2 text-sm text-sumi-ink transition active:scale-95 disabled:opacity-40 dark:border-washi-borderDark dark:bg-washi-cardDark dark:text-sumi-inkDark"
                  onClick={() => setHintRevealed(true)}
                  disabled={hintRevealed || !card || card.synonyms.length === 0}
                  type="button"
                >
                  ヒント
                </button>
              </div>
            )}
            {hintRevealed && (
              <p className="text-xs text-sumi-sub dark:text-sumi-subDark">
                類義語: {card?.synonyms.map((s) => s.word).join("、") || "登録されていません"}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {question.choices?.map((choice) => (
              <button
                key={choice}
                disabled={feedback !== null}
                onClick={() => submitAnswer(choice)}
                className="rounded-lg border border-washi-border bg-washi-bg px-3 py-2 text-left text-sm text-sumi-ink transition active:scale-95 disabled:opacity-60 dark:border-washi-borderDark dark:bg-washi-bgDark dark:text-sumi-inkDark"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {feedback && (
          <div className="mt-4">
            <p
              className={`text-sm font-semibold ${
                feedback === "correct" ? "text-good" : "text-weak"
              }`}
            >
              {feedback === "correct" ? "正解！" : `不正解。正解は「${question.answer}」`}
            </p>
            {card && (
              <p className="mt-1 text-xs text-sumi-sub dark:text-sumi-subDark">{card.meaning}</p>
            )}
            <button
              className="mt-3 rounded-full bg-sumi-ink px-4 py-2 text-sm font-semibold text-washi-bg active:scale-95 dark:bg-sumi-inkDark dark:text-sumi-ink"
              onClick={next}
            >
              {qIdx + 1 >= quiz.length ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizSummary({
  results,
  cardsById,
}: {
  results: QuizResult[];
  cardsById: Map<string, VocabCard>;
}) {
  const correctCount = results.filter((r) => r.correct).length;
  return (
    <div className="mt-2 w-full max-w-md rounded-2xl border border-washi-border bg-washi-card p-5 text-left dark:border-washi-borderDark dark:bg-washi-cardDark">
      <div className="mb-3 text-center text-sm font-semibold text-sumi-ink dark:text-sumi-inkDark">
        前回の結果: {correctCount} / {results.length} 問正解
      </div>
      <ul className="space-y-1 text-sm">
        {results.map((r, i) => {
          const card = cardsById.get(r.cardId);
          return (
            <li key={i} className={r.correct ? "text-good" : "text-weak"}>
              {r.correct ? "○" : "✕"} {card?.kanji ?? "?"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
