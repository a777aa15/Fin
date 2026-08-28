"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { QuizQuestion } from "@/content/course";
import { useQuizResults } from "@/lib/progress";

export function QuizClient({
  moduleN,
  questions,
  hasCase,
}: {
  moduleN: number;
  questions: QuizQuestion[];
  hasCase: boolean;
}) {
  const { get: getSaved, set: saveResult } = useQuizResults();
  const saved = getSaved(moduleN);

  // Если тест уже проходили — сначала показываем итог прошлой попытки,
  // а не чистый бланк (иначе кажется, что результат «слетел»).
  const [reviewingPast, setReviewingPast] = useState(false);

  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  // Прогресс подгружается из БД асинхронно (после /api/me), поэтому при
  // первом рендере saved ещё не известен — useState(!!saved) его бы не увидел.
  // Как только данные приходят, один раз включаем экран «уже проходили»,
  // если пользователь ещё не начал отвечать и не отправил свежую попытку.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (submitted) {
      hydratedRef.current = true;
      return;
    }
    if (saved && answers.every((a) => a === null)) {
      hydratedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewingPast(true);
    }
  }, [saved, submitted, answers]);

  const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
  const allAnswered = answers.every((a) => a !== null);

  useEffect(() => {
    if (submitted) saveResult(moduleN, { score, total: questions.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const startFresh = () => {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setReviewingPast(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Экран «уже проходили этот тест» — вместо чистого бланка при повторном заходе.
  if (reviewingPast && saved) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="text-sm text-ink-muted">Вы уже проходили этот тест</div>
        <div className="text-4xl font-extrabold text-green-dark">
          {saved.score} / {saved.total}
        </div>
        <div className="text-sm text-ink-secondary">
          Лучший результат сохранён. Можно пройти ещё раз — новый результат заменит прошлый,
          только если он окажется выше.
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button onClick={startFresh} className="btn btn-primary px-6 py-3">
            Пройти тест заново
          </button>
          <Link href="/study" className="btn btn-secondary px-6 py-3">
            Вернуться к обзору курса
          </Link>
          {hasCase ? (
            <Link href={`/detective/${moduleN}`} className="btn btn-secondary px-6 py-3">
              Дело детектива модуля
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      {submitted ? (
        <div className="card mb-6 flex flex-col items-center gap-2 p-6 text-center">
          <div className="text-sm text-ink-muted">Результат</div>
          <div className="text-4xl font-extrabold text-green-dark">
            {score} / {questions.length}
          </div>
          <div className="text-sm text-ink-secondary">
            {score === questions.length
              ? "Отлично! Все ответы верны."
              : score >= questions.length - 1
                ? "Почти идеально — разберите отмеченные вопросы."
                : "Есть над чем поработать — перечитайте объяснения ниже."}
          </div>
        </div>
      ) : null}

      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const selected = answers[qi];
          return (
            <li key={qi} className="card p-6">
              <div className="flex gap-3">
                <span className="text-sm font-bold text-green-dark tabular-nums">
                  {qi + 1}.
                </span>
                <p className="text-[15px] font-semibold leading-relaxed text-ink">
                  {q.q}
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isCorrect = q.correct === oi;
                  let cls = "border-border bg-surface hover:border-green/50";
                  if (submitted) {
                    if (isCorrect) cls = "border-green bg-green-light";
                    else if (isSelected) cls = "border-bad/50 bg-bad/10";
                    else cls = "border-border bg-surface";
                  } else if (isSelected) {
                    cls = "border-green bg-green-light";
                  }
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors ${cls} ${submitted ? "cursor-default" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-green)]"
                      />
                      <span className="text-ink">{opt}</span>
                      {submitted && isCorrect ? (
                        <span className="ml-auto shrink-0 text-xs font-semibold text-green-dark">верно</span>
                      ) : null}
                      {submitted && isSelected && !isCorrect ? (
                        <span className="ml-auto shrink-0 text-xs font-semibold text-bad">ваш ответ</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {submitted ? (
                <div className="mt-4 rounded-xl border border-border bg-grey-light/50 p-4 text-sm leading-relaxed text-ink-secondary">
                  <span className="font-semibold text-ink">Разбор. </span>
                  {q.explain}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            onClick={() => {
              setSubmitted(true);
              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={!allAnswered}
            className="btn btn-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Проверить ответы
          </button>
        ) : (
          <>
            <button onClick={startFresh} className="btn btn-secondary px-6 py-3">
              Пройти заново
            </button>
            {hasCase ? (
              <Link href={`/detective/${moduleN}`} className="btn btn-primary px-6 py-3">
                Дело детектива модуля
              </Link>
            ) : null}
            <Link href="/study" className="btn btn-secondary px-6 py-3">
              Вернуться к обзору курса
            </Link>
          </>
        )}
        {!allAnswered && !submitted ? (
          <span className="text-sm text-ink-muted">Ответьте на все вопросы, чтобы проверить</span>
        ) : null}
      </div>
    </div>
  );
}
