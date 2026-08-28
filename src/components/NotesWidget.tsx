"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/progress";

// Компактный перетаскиваемый блокнот в стиле окна macOS / Apple Notes.
//  • язычок слева/справа, его можно перетаскивать вдоль края экрана;
//  • окно тянется за заголовок, перемещается по странице;
//  • появление — scale + fade с лёгким подскоком, как окна в macOS;
//  • в заметку можно вставить скриншот (Ctrl+V) или прикрепить файл.
// Заметки и позиции сохраняются в localStorage на пользователя.

type Note = { id: string; text: string; images: string[]; updatedAt: number };
type TabPos = { side: "left" | "right"; y: number };
type WinPos = { x: number; y: number };

const MAX_IMAGES = 6;
const MAX_IMG_DIM = 720; // px по большей стороне после сжатия
const JPEG_QUALITY = 0.72;

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

// Сжимает изображение (скриншот из буфера обмена или файл) до разумного
// размера перед сохранением в localStorage — иначе несколько скриншотов
// быстро упрутся в лимит браузера (обычно 5–10 МБ на источник).
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMG_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("canvas 2d недоступен"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("не удалось загрузить изображение"));
    };
    img.src = url;
  });
}

export function NotesWidget() {
  const { user, loaded } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabPos>({ side: "left", y: 320 });
  const [tabDrag, setTabDrag] = useState<{ x: number; y: number } | null>(null);
  const [win, setWin] = useState<WinPos>({ x: 84, y: 130 });
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const parsed = raw ? (JSON.parse(raw) as Note[]) : [];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(parsed.map((n) => ({ ...n, images: n.images ?? [] })));
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

  // Сообщение об ошибке скриншота само пропадает через несколько секунд.
  useEffect(() => {
    if (!imgError) return;
    const t = setTimeout(() => setImgError(null), 4000);
    return () => clearTimeout(t);
  }, [imgError]);

  if (!loaded || !user) return null;

  // Пишет в localStorage СНАЧАЛА — если места не хватило (quota), состояние
  // не меняется, и в интерфейсе не «зависает» скриншот, который на самом
  // деле не сохранился.
  const persist = (next: Note[]): boolean => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sorted));
      } catch {
        return false;
      }
    }
    setNotes(sorted);
    return true;
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
    const n: Note = { id: crypto.randomUUID(), text: "", images: [], updatedAt: Date.now() };
    persist([n, ...notes]);
    setActiveId(n.id);
  };
  const updateActive = (text: string) =>
    activeId && persist(notes.map((n) => (n.id === activeId ? { ...n, text, updatedAt: Date.now() } : n)));
  const remove = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const addImages = async (files: File[]) => {
    if (!active || files.length === 0) return;
    const room = MAX_IMAGES - active.images.length;
    if (room <= 0) {
      setImgError(`Максимум ${MAX_IMAGES} скриншотов в одной заметке`);
      return;
    }
    setImgBusy(true);
    try {
      const dataUrls = await Promise.all(files.slice(0, room).map(fileToCompressedDataUrl));
      const updated = notes.map((n) =>
        n.id === active.id ? { ...n, images: [...n.images, ...dataUrls], updatedAt: Date.now() } : n
      );
      const ok = persist(updated);
      setImgError(ok ? null : "Не хватило места в браузере — удалите старые скриншоты");
    } catch {
      setImgError("Не удалось обработать изображение");
    } finally {
      setImgBusy(false);
    }
  };
  const removeImage = (idx: number) => {
    if (!active) return;
    const images = active.images.filter((_, i) => i !== idx);
    persist(notes.map((n) => (n.id === active.id ? { ...n, images, updatedAt: Date.now() } : n)));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const images: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) images.push(f);
      }
    }
    if (images.length === 0) return; // обычный текст — не перехватываем
    e.preventDefault();
    void addImages(images);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = ""; // чтобы повторный выбор того же файла снова сработал
    if (files.length) void addImages(files);
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
          <div className="flex min-h-0 flex-1 flex-col">
            <textarea
              ref={editorRef}
              value={active.text}
              onChange={(e) => updateActive(e.target.value)}
              onPaste={handlePaste}
              placeholder="Пишите заметку… Скриншот можно вставить сюда (Ctrl+V)"
              className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3.5 text-[14px] leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none"
            />

            {active.images.length > 0 ? (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 px-3 py-2.5">
                {active.images.map((src, idx) => (
                  <div key={idx} className="group/thumb relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setLightbox(src)}
                      className="block h-full w-full"
                      aria-label="Открыть скриншот"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      aria-label="Удалить скриншот"
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2">
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilePick} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imgBusy || active.images.length >= MAX_IMAGES}
                aria-label="Прикрепить скриншот"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M4 16.5V6.5a2 2 0 012-2h4l1.5 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinejoin="round" />
                  <circle cx="12" cy="12.5" r="2.6" />
                </svg>
              </button>
              <span className="truncate text-[11px] text-white/35">
                {imgBusy ? "Обрабатываем…" : imgError ?? "Ctrl+V — вставить скриншот"}
              </span>
            </div>
          </div>
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
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      {n.images.length > 0 ? (
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={n.images[0]} alt="" className="h-full w-full object-cover" />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-white/90">{titleOf(n.text)}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                          <span className="shrink-0">{fmtDate(n.updatedAt)}</span>
                          <span className="truncate">{previewOf(n.text)}</span>
                        </div>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Просмотр скриншота во весь экран */}
      {lightbox ? (
        <button
          onClick={() => setLightbox(null)}
          aria-label="Закрыть просмотр"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
        </button>
      ) : null}
    </>
  );
}
