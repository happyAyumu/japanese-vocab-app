import { useCallback, useEffect, useState } from "react";
import type { Grade, VocabCard } from "../types/vocab";
import { vocabRepository } from "../lib/repository";
import { applyGrade, applyQuizAnswer } from "../lib/srs";

export function useVocabStore() {
  const [cards, setCards] = useState<VocabCard[]>(() => vocabRepository.load());

  useEffect(() => {
    vocabRepository.save(cards);
  }, [cards]);

  const addCard = useCallback((card: VocabCard) => {
    setCards((prev) => [...prev, card]);
  }, []);

  const updateCard = useCallback((id: string, updater: (card: VocabCard) => VocabCard) => {
    setCards((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const quizAnswerCard = useCallback((id: string, correct: boolean) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? applyQuizAnswer(c, correct) : c)),
    );
  }, []);

  const gradeCard = useCallback((id: string, grade: Grade) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? applyGrade(c, grade) : c)),
    );
  }, []);

  const replaceAll = useCallback((newCards: VocabCard[]) => {
    setCards(newCards);
  }, []);

  return { cards, addCard, updateCard, removeCard, quizAnswerCard, gradeCard, replaceAll };
}
