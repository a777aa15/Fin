"use client";

import { useMemo, useState } from "react";
import type { DetectiveCase } from "@/content/course";
import { useCaseResults } from "@/lib/progress";

export function CaseClient({ kase }: { kase: DetectiveCase }) {
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [verdict, setVerdict] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { set: saveResult } = useCaseResults();

  const allStatements = useMemo(
    () => kase.documents.flatMap((d) => d.statements),
    [kase]
  );
  const totalFlags = useMemo(
    () => allStatements.filter((s) => s.isFlag).length,
    [allStatements]
  );

  const found = allStatements.filter((s) => s.isFlag && flagged.has(s.id)).length;
  const falsePositives = allStatements.filter((s) => !s.isFlag && flagged.has(s.id)).length;
  const verdictCorrect = verdict !== null && kase.verdictOptions[verdict]?.correct === true;

  const toggle = (id: string) => {
    if (submitted) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    setSubmitted(true);
    saveResult(kase.module, { found, totalFlags, falsePositives, verdictCorrect });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setFlagged(new Set());
    setVerdict(null);
    setSubmitted(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Брифинг */}
      <div className="card p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-green-dark">
          Ваша роль
        </div>
        <p className="mt-1.5 text-sm text-ink-secondary">{kase.role}</p>
        <div className="mt-4 text-sm leading-relaxed text-ink">{kase.briefing}</div>
      </div>

      {/* Результат после отправки */}
      {submitted ? (
        <div className={`mt-6 rounded-2xl border p-6 ${verdictCorrect ? "border-green bg-green-light" : "border-amber/40 bg-amber-light"}`}>
          <div className="text-lg font-bold text-ink">
            {verdictCorrect ? "Вывод верный" : "Вывод неверный"}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Найдено флагов" value={`${found} / ${totalFlags}`} />
            <Stat label="Ложных срабатываний" value={String(falsePositives)} />
            <Stat label="Вывод" value={verdictCorrect ? "верный" : "неверный"} />
          </div>
        </div>
      ) : null}

      {/* Инструкция */}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm text-ink-muted">
        Отметьте в документах утверждения, которые считаете «красными флагами», затем
        выберите итоговый вывод и нажмите «Проверить».
      </div>

      {/* Документы */}
      <div className="mt-6 space-y-6">
        {kase.documents.map((doc) => (
          <div key={doc.id} className="card overflow-hidden">
            <div className="border-b border-border bg-grey-light/50 px-5 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{doc.type}</div>
              <div className="text-sm font-bold text-ink">{doc.title}</div>
            </div>
            <ul className="divide-y divide-border">
              {doc.statements.map((st) => {
                const isFlagged = flagged.has(st.id);
                let cls = "";
                if (submitted) {
                  if (st.isFlag && isFlagged) cls = "bg-green-light";
                  else if (st.isFlag && !isFlagged) cls = "bg-amber-light";
                  else if (!st.isFlag && isFlagged) cls = "bg-bad/10";
                } else if (isFlagged) {
                  cls = "bg-green-light";
                }
                return (
                  <li key={st.id} className={cls}>
                    <button
                      type="button"
                      onClick={() => toggle(st.id)}
                      disabled={submitted}
                      className={`flex w-full items-start gap-3 px-5 py-3.5 text-left ${submitted ? "cursor-default" : "cursor-pointer hover:bg-grey-light/40"}`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isFlagged ? "border-green bg-green text-on-green" : "border-border-strong text-transparent"}`}>
                        <FlagIcon />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm leading-relaxed text-ink">{st.text}</span>
                        {submitted ? (
                          <span className={`mt-1.5 block text-xs leading-relaxed ${st.isFlag ? "text-green-dark" : "text-ink-muted"}`}>
                            <span className="font-semibold">
                              {st.isFlag ? "🚩 Красный флаг. " : "Не флаг. "}
                            </span>
                            {st.explain}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Вердикт */}
      <div className="mt-8 card p-6">
        <h3 className="text-base font-bold text-ink">{kase.verdictQuestion}</h3>
        <div className="mt-4 space-y-2.5">
          {kase.verdictOptions.map((opt, oi) => {
            const isSelected = verdict === oi;
            let cls = "border-border bg-surface hover:border-green/50";
            if (submitted) {
              if (opt.correct) cls = "border-green bg-green-light";
              else if (isSelected) cls = "border-bad/50 bg-bad/10";
              else cls = "border-border bg-surface";
            } else if (isSelected) {
              cls = "border-green bg-green-light";
            }
            return (
              <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors ${cls} ${submitted ? "cursor-default" : ""}`}>
                <input
                  type="radio"
                  name="verdict"
                  checked={isSelected}
                  disabled={submitted}
                  onChange={() => setVerdict(oi)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-green)]"
                />
                <span>
                  <span className="block text-ink">{opt.text}</span>
                  {submitted && (opt.correct || isSelected) ? (
                    <span className={`mt-1.5 block text-xs leading-relaxed ${opt.correct ? "text-green-dark" : "text-ink-muted"}`}>
                      {opt.explain}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={verdict === null}
            className="btn btn-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Проверить дело
          </button>
        ) : (
          <button onClick={reset} className="btn btn-secondary px-6 py-3">
            Пройти заново
          </button>
        )}
        {verdict === null && !submitted ? (
          <span className="text-sm text-ink-muted">Выберите итоговый вывод, чтобы проверить</span>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card/70 px-3 py-2">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-0.5 font-bold text-ink">{value}</div>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
