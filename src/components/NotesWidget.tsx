"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/progress";

// Блокнот заметок в стиле iOS Notes (тёмный). Плашка-язычок слева → плавно
// выезжает панель. Заметки сохраняются в localStorage отдельно на пользователя.

type Note = { id: string; text: string; updatedAt: number };

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function title(text: string): string {
  const line = text.split("\n").find((l) => l.trim()) || "";
  return line.trim() || "Новая заметка";
}
function preview(text: string): string {
  const rest = text.split("\n").slice(1).join(" ").trim();
  return rest || "Нет дополнительного текста";
}

export function NotesWidget() {
  const { user, loaded } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const storageKey = user ? `fa-notes-${user.id}` : null;

  // Загрузка
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setNotes(raw ? (JSON.parse(raw) as Note[]) : []);
    } catch {
      setNotes([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (activeId) editorRef.current?.focus();
  }, [activeId]);

  if (!loaded || !user) return null;

  const persist = (next: Note[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(sorted);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sorted));
      } catch {
        /* quota — игнорируем */
      }
    }
  };

  const active = notes.find((n) => n.id === activeId) || null;

  const newNote = () => {
    const n: Note = { id: crypto.randomUUID(), text: "", updatedAt: Date.now() };
    persist([n, ...notes]);
    setActiveId(n.id);
  };
  const updateActive = (text: string) => {
    if (!activeId) return;
    persist(notes.map((n) => (n.id === activeId ? { ...n, text, updatedAt: Date.now() } : n)));
  };
  const remove = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <>
      {/* Язычок слева */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть заметки"
          className="group fixed left-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-r-2xl border border-l-0 border-border bg-card/90 py-4 pl-2.5 pr-3 shadow-lg backdrop-blur-md transition-all duration-200 hover:pl-3.5 hover:pr-4 hover:shadow-[0_0_28px_-6px_rgba(52,193,123,0.5)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-green-dark" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinejoin="round" />
            <path d="M8 8h6M8 12h8M8 16h5" strokeLinecap="round" />
          </svg>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-ink opacity-0 transition-all duration-200 group-hover:max-w-[90px] group-hover:opacity-100">
            Заметки
          </span>
        </button>
      ) : null}

      {/* Панель */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[340px] max-w-[86vw] flex-col border-r border-border shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#0e1114" }}
        aria-hidden={!open}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2">
            {active ? (
              <button
                onClick={() => setActiveId(null)}
                className="flex items-center gap-1 text-sm text-green-dark transition-colors hover:text-green"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Заметки
              </button>
            ) : (
              <h2 className="text-base font-bold text-ink">Заметки</h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!active ? (
              <button
                onClick={newNote}
                aria-label="Новая заметка"
                className="flex h-8 w-8 items-center justify-center rounded-full text-green-dark transition-colors hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => remove(active.id)}
                aria-label="Удалить заметку"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-bad"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Тело */}
        {active ? (
          <textarea
            ref={editorRef}
            value={active.text}
            onChange={(e) => updateActive(e.target.value)}
            placeholder="Пишите заметку…"
            className="flex-1 resize-none bg-transparent px-4 py-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none"
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            {notes.length === 0 ? (
              <div className="mt-16 px-4 text-center text-sm text-ink-muted">
                Пока пусто. Нажмите <span className="text-green-dark">+</span>, чтобы добавить первую заметку
                прямо во время чтения.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setActiveId(n.id)}
                      className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="truncate text-[15px] font-semibold text-ink">{title(n.text)}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                        <span className="shrink-0">{fmtDate(n.updatedAt)}</span>
                        <span className="truncate">{preview(n.text)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
