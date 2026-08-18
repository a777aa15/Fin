"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/progress";

// Компактный перетаскиваемый блокнот в стиле окна macOS / Apple Notes.
//  • язычок слева/справа, его можно перетаскивать вдоль края экрана;
//  • окно тянется за заголовок, перемещается по странице;
//  • появление — scale + fade с лёгким подскоком, как окна в macOS.
// Заметки и позиции сохраняются в localStorage на пользователя.

type Note = { id: string; text: string; updatedAt: number };
type TabPos = { side: "left" | "right"; y: number };
type WinPos = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Реальная ширина/высота окна заметок (на узких экранах — 90vw).
const WIN_H = 400;
function winSize() {
  if (typeof window === "undefined") return { w: 320, h: WIN_H };
  return { w: Math.min(320, window.innerWidth * 0.9), h: WIN_H };
}
// Вписать окно в видимую область, чтобы оно не создавало горизонтальный скролл.
function fitWin(p: WinPos): WinPos {
  if (typeof window === "undefined") return p;
  const { w, h } = winSize();
  return {
    x: clamp(p.x, 8, Math.max(8, window.innerWidth - w - 8)),
    y: clamp(p.y, 8, Math.max(8, window.innerHeight - h - 8)),
  };
}
function fitTab(p: TabPos): TabPos {
  if (typeof window === "undefined") return p;
  return { side: p.side, y: clamp(p.y, 48, Math.max(48, window.innerHeight - 48)) };
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
const titleOf = (t: string) => (t.split("\n").find((l) => l.trim()) || "").trim() || "Новая заметка";
const previewOf = (t: string) => t.split("\n").slice(1).join(" ").trim() || "Нет текста";

export function NotesWidget() {
  const { user, loaded } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabPos>({ side: "left", y: 320 });
  const [tabDrag, setTabDrag] = useState<{ x: number; y: number } | null>(null);
  const [win, setWin] = useState<WinPos>({ x: 84, y: 130 });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const tabRef = useRef({ down: false, moved: false, sx: 0, sy: 0 });
  const winRef = useRef({ down: false, ox: 0, oy: 0 });

  const storageKey = user ? `fa-notes-${user.id}` : null;

  // Загрузка заметок и позиций
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      // localStorage недоступен при SSR, а ключ зависит от пользователя —
      // поэтому заметки читаются здесь, после монтирования.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(raw ? (JSON.parse(raw) as Note[]) : []);
    } catch {
      setNotes([]);
    }
    try {
      const t = localStorage.getItem("fa-notes-tab");
      if (t) setTab(fitTab(JSON.parse(t)));
      const w = localStorage.getItem("fa-notes-win");
      if (w) setWin(fitWin(JSON.parse(w)));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Держим окно и язычок в пределах экрана: позиция могла сохраниться на
  // широком мониторе, а открыться на телефоне — иначе появлялся горизонтальный скролл.
  useEffect(() => {
    const onResize = () => {
      setWin((p) => fitWin(p));
      setTab((p) => fitTab(p));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (open && activeId) editorRef.current?.focus();
  }, [open, activeId]);

  if (!loaded || !user) return null;

  const persist = (next: Note[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(sorted);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sorted));
      } catch {
        /* quota */
      }
    }
  };
  const savePos = (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  };

  const active = notes.find((n) => n.id === activeId) || null;
  const newNote = () => {
    const n: Note = { id: crypto.randomUUID(), text: "", updatedAt: Date.now() };
    persist([n, ...notes]);
    setActiveId(n.id);
  };
  const updateActive = (text: string) =>
    activeId && persist(notes.map((n) => (n.id === activeId ? { ...n, text, updatedAt: Date.now() } : n)));
  const remove = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  /* ---- перетаскивание язычка вдоль края ---- */
  const onTabDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* pointer уже отпущен/не активен */
    }
    tabRef.current = { down: true, moved: false, sx: e.clientX, sy: e.clientY };
  };
  const onTabMove = (e: React.PointerEvent) => {
    if (!tabRef.current.down) return;
    if (Math.hypot(e.clientX - tabRef.current.sx, e.clientY - tabRef.current.sy) > 5) tabRef.current.moved = true;
    if (tabRef.current.moved) setTabDrag({ x: e.clientX, y: e.clientY });
  };
  const onTabUp = (e: React.PointerEvent) => {
    if (!tabRef.current.down) return;
    tabRef.current.down = false;
    if (!tabRef.current.moved) {
      setOpen(true);
    } else {
      const side: "left" | "right" = e.clientX < window.innerWidth / 2 ? "left" : "right";
      const y = clamp(e.clientY, 48, window.innerHeight - 48);
      const np = { side, y };
      setTab(np);
      savePos("fa-notes-tab", np);
    }
    setTabDrag(null);
  };

  /* ---- перетаскивание окна за шапку ---- */
  const onWinDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    winRef.current = { down: true, ox: e.clientX - win.x, oy: e.clientY - win.y };
  };
  const onWinMove = (e: React.PointerEvent) => {
    if (!winRef.current.down) return;
    setWin(fitWin({ x: e.clientX - winRef.current.ox, y: e.clientY - winRef.current.oy }));
  };
  const onWinUp = () => {
    if (!winRef.current.down) return;
    winRef.current.down = false;
    savePos("fa-notes-win", win);
  };

  const tabStyle: React.CSSProperties = tabDrag
    ? { left: tabDrag.x, top: tabDrag.y, transform: "translate(-50%,-50%)" }
    : tab.side === "left"
      ? { left: 0, top: tab.y, transform: "translateY(-50%)" }
      : { right: 0, top: tab.y, transform: "translateY(-50%)" };

  return (
    <>
      {/* Язычок (прячется, когда окно открыто) */}
      {!open && (
      <button
        onPointerDown={onTabDown}
        onPointerMove={onTabMove}
        onPointerUp={onTabUp}
        aria-label="Заметки"
        style={{ ...tabStyle, touchAction: "none" }}
        className={`group fixed z-40 flex touch-none select-none items-center gap-2 border border-border bg-card/90 py-3.5 shadow-lg backdrop-blur-md transition-[padding,box-shadow,background-color] duration-200 hover:shadow-[0_0_26px_-6px_rgba(52,193,123,0.55)] ${
          tabDrag
            ? "cursor-grabbing rounded-2xl px-3"
            : tab.side === "left"
              ? "cursor-grab rounded-r-2xl border-l-0 pl-2.5 pr-3 hover:pl-3.5 hover:pr-4"
              : "cursor-grab rounded-l-2xl border-r-0 flex-row-reverse pl-3 pr-2.5 hover:pl-4 hover:pr-3.5"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-green-dark" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinejoin="round" />
          <path d="M8 8h6M8 12h8M8 16h5" strokeLinecap="round" />
        </svg>
        <span
          className={`overflow-hidden whitespace-nowrap text-sm font-medium text-ink transition-all duration-200 ${
            tabDrag ? "max-w-0 opacity-0" : "max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100"
          }`}
        >
          Заметки
        </span>
      </button>
      )}

      {/* Окно (в стиле macOS) */}
      <div
        role="dialog"
        aria-label="Заметки"
        style={{
          left: win.x,
          top: win.y,
          transformOrigin: tab.side === "left" ? "top left" : "top right",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={`fixed z-50 flex h-[400px] w-[320px] max-w-[90vw] flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-[transform,opacity] duration-500 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* Стекло-фон окна */}
        <div className="absolute inset-0 -z-10 backdrop-blur-xl" style={{ background: "rgba(28,28,30,0.92)" }} />

        {/* Шапка окна (перетаскивание) */}
        <div
          onPointerDown={onWinDown}
          onPointerMove={onWinMove}
          onPointerUp={onWinUp}
          className="flex h-10 shrink-0 cursor-grab touch-none items-center border-b border-white/10 px-3.5 active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          {/* Слева: назад (в редакторе) или иконка */}
          <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
            {active ? (
              <button onClick={() => setActiveId(null)} aria-label="К списку" className="flex items-center gap-1 text-[13px] text-[#e9c14a] hover:text-[#f2cf63]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Заметки
              </button>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#e9c14a]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinejoin="round" />
                <path d="M8 8h6M8 12h8M8 16h5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-white/80">
            {active ? "Заметка" : "Заметки"}
          </div>
          <div className="ml-auto flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            {active ? (
              <button onClick={() => remove(active.id)} aria-label="Удалить" className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-[#ff6b6b]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ) : (
              <button onClick={newNote} aria-label="Новая заметка" className="flex h-7 w-7 items-center justify-center rounded-md text-[#e9c14a] hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Закрыть" className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
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
            className="flex-1 resize-none bg-transparent px-4 py-3.5 text-[14px] leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none"
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            {notes.length === 0 ? (
              <div className="mt-14 px-5 text-center text-[13px] leading-relaxed text-white/40">
                Пусто. Нажмите <span className="text-[#e9c14a]">+</span>, чтобы записать мысль
                прямо во время чтения.
              </div>
            ) : (
              <ul className="space-y-0.5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setActiveId(n.id)}
                      className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="truncate text-[14px] font-semibold text-white/90">{titleOf(n.text)}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                        <span className="shrink-0">{fmtDate(n.updatedAt)}</span>
                        <span className="truncate">{previewOf(n.text)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
