"use client";

import Link from "next/link";
import { useCaseResults } from "@/lib/progress";

export type HubCase = {
  module: number;
  title: string;
  company: string;
  moduleSubtitle: string;
  totalFlags: number;
};

export function DetectiveHub({ cases }: { cases: HubCase[] }) {
  const { map } = useCaseResults();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cases.map((c) => {
        const prog = map[String(c.module)];
        return (
          <Link
            key={c.module}
            href={`/detective/${c.module}`}
            className="group card flex flex-col p-6 hover:border-green/50"
          >
            <div className="text-xs font-medium text-ink-muted">
              После модуля {c.module}: {c.moduleSubtitle}
            </div>
            <h3 className="mt-2 text-lg font-bold text-ink">{c.title}</h3>
            <div className="mt-1 text-sm text-ink-secondary">{c.company}</div>

            <div className="mt-4">
              {prog ? (
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    prog.verdictCorrect ? "bg-green-light text-green-dark" : "bg-amber-light text-amber"
                  }`}
                >
                  {prog.verdictCorrect ? "Вывод верный" : "Вывод неверный"} · флагов {prog.found}/{prog.totalFlags}
                  {prog.falsePositives ? ` · ${prog.falsePositives} ложных` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-grey-light px-3 py-1 text-xs font-medium text-ink-muted">
                  Не начато
                </span>
              )}
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-dark">
              Открыть дело
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
