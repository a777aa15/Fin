"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLessonProgress } from "@/lib/progress";

const MIN_PER_LESSON = 12; // оценка длительности урока для метрики «осталось часов»

export type SlimLesson = { num: string; title: string; tag: string | null };
export type SlimModule = {
  n: number;
  subtitle: string;
  short: string;
  lessons: SlimLesson[];
  hasExtras: boolean;
  hasQuiz: boolean;
  hasCase: boolean;
};

export function StudyOverview({ modules }: { modules: SlimModule[] }) {
  const { done, isDone } = useLessonProgress();
  const totalLessons = useMemo(
    () => modules.reduce((s, m) => s + m.lessons.length, 0),
    [modules]
  );
  const doneCount = useMemo(
    () => modules.reduce((s, m) => s + m.lessons.filter((l) => done.has(l.num)).length, 0),
    [modules, done]
  );
  const modulesDone = useMemo(
    () => modules.filter((m) => m.lessons.length > 0 && m.lessons.every((l) => done.has(l.num))).length,
    [modules, done]
  );
  const pct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
  const hoursLeft = Math.max(0, Math.round(((totalLessons - doneCount) * MIN_PER_LESSON) / 60));

  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  const expandAll = () => setOpen(new Set(modules.map((m) => m.n)));
  const collapseAll = () => setOpen(new Set());

  return (
    <div>
      {/* Метрики */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric value={String(doneCount)} label="уроков пройдено" />
        <Metric value={String(modulesDone)} label="модулей завершено" />
        <Metric value={`${pct}%`} label="прогресс" />
        <Metric value={String(hoursLeft)} label="часов осталось" />
      </div>

      {/* Полоса прогресса */}
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-grey-light">
          <div className="h-full rounded-full bg-green transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Управление */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Программа курса</h2>
        <div className="flex gap-2 text-sm">
          <button onClick={expandAll} className="text-ink-secondary hover:text-green-dark">
            Развернуть всё
          </button>
          <span className="text-border-strong">·</span>
          <button onClick={collapseAll} className="text-ink-secondary hover:text-green-dark">
            Свернуть всё
          </button>
        </div>
      </div>

      {/* Модули */}
      <div className="mt-4 space-y-3">
        {modules.map((m) => {
          const isOpen = open.has(m.n);
          const mDone = m.lessons.filter((l) => done.has(l.num)).length;
          return (
            <div key={m.n} className="card overflow-hidden">
              <button
                onClick={() => toggle(m.n)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-light text-sm font-bold text-green-dark">
                  {m.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink">{m.subtitle}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {mDone}/{m.lessons.length} уроков{mDone === m.lessons.length && m.lessons.length > 0 ? " · завершён" : ""}
                  </span>
                </span>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen ? (
                <div className="border-t border-border">
                  <ul className="divide-y divide-border">
                    {m.lessons.map((l) => (
                      <li key={l.num}>
                        <Link href={`/lesson/${l.num}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-grey-light/60">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${isDone(l.num) ? "border-green bg-green text-on-green" : "border-border-strong text-transparent"}`}>
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-muted">{l.num}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-ink">{l.title}</span>
                          {l.tag ? <span className="tag hidden shrink-0 sm:inline-flex">{l.tag}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3 border-t border-border bg-grey-light/40 px-5 py-3 text-sm">
                    {m.hasExtras ? (
                      <Link href={`/module/${m.n}/extras`} className="font-medium text-green-dark hover:underline">
                        Доп. материалы
                      </Link>
                    ) : null}
                    {m.hasQuiz ? (
                      <Link href={`/quiz/${m.n}`} className="font-medium text-green-dark hover:underline">
                        Тест модуля
                      </Link>
                    ) : null}
                    {m.hasCase ? (
                      <Link href={`/detective/${m.n}`} className="font-medium text-green-dark hover:underline">
                        Дело детектива
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="card px-5 py-5 text-center">
      <div className="text-3xl font-extrabold tracking-tight text-green-dark">{value}</div>
      <div className="mt-1 text-xs text-ink-secondary sm:text-sm">{label}</div>
    </div>
  );
}
