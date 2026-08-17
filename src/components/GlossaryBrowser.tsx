"use client";

import { useMemo, useState } from "react";
import type { GlossaryTerm } from "@/content/course";

export function GlossaryBrowser({
  terms,
  categories,
}: {
  terms: GlossaryTerm[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      if (cat && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)
      );
    });
  }, [terms, query, cat]);

  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      {/* Поиск */}
      <div className="relative">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск термина или определения…"
          className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
          aria-label="Поиск по глоссарию"
        />
      </div>

      {/* Категории */}
      <div className="mt-4 flex flex-wrap gap-2">
        <CatChip active={cat === null} onClick={() => setCat(null)}>
          Все
        </CatChip>
        {categories.map((c) => (
          <CatChip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </CatChip>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Найдено терминов: {filtered.length}
      </p>

      {/* Результаты */}
      {grouped.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center text-ink-muted">
          Ничего не найдено. Попробуйте изменить запрос.
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-green-dark">
                {category}
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {items.map((t) => (
                  <div key={t.term} className="card p-5">
                    <dt className="text-sm font-bold text-ink">{t.term}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                      {t.def}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CatChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-green bg-green text-on-green"
          : "border-border bg-card text-ink-secondary hover:border-green/50 hover:text-green-dark"
      }`}
    >
      {children}
    </button>
  );
}
