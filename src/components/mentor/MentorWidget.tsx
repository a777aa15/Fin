"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/progress";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Я ваш наставник — старший финансовый аналитик. Разберём компанию, найдём слабые места в рассуждении, задам неудобные вопросы. Спрашивайте по теме урока или приносите свой разбор.",
};

export function MentorWidget() {
  const pathname = usePathname();
  const { user, loaded } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lessonNum = (() => {
    const m = pathname.match(/^\/lesson\/([^/]+)$/);
    return m ? decodeURIComponent(m[1]) : undefined;
  })();

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, open, busy]);

  // Наставник — только для авторизованных
  if (!loaded || !user) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      // отправляем историю начиная с первого сообщения пользователя (Gemini ждёт user-первым)
      const firstUser = next.findIndex((m) => m.role === "user");
      const history = firstUser >= 0 ? next.slice(firstUser) : next;
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lessonNum }),
      });
      const data = await res.json();
      setMsgs((cur) => [
        ...cur,
        { role: "assistant", content: data.text || data.error || "Пустой ответ." },
      ]);
    } catch {
      setMsgs((cur) => [...cur, { role: "assistant", content: "Сеть недоступна, попробуйте ещё раз." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-green px-5 py-3 text-sm font-bold text-on-green shadow-lg transition-colors hover:bg-green-dark"
          aria-label="Открыть чат с наставником"
        >
          <ChatIcon />
          Наставник
        </button>
      ) : null}

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex h-[70vh] max-h-[560px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Заголовок */}
          <div className="flex items-start justify-between gap-3 border-b border-border bg-green px-4 py-3 text-on-green">
            <div>
              <div className="text-sm font-bold">Наставник</div>
              <div className="text-xs text-green-light">Старший финансовый аналитик</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Закрыть чат" className="rounded-full p-1 hover:bg-white/15">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Сообщения */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-green text-on-green"
                      : "bg-grey-light text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-grey-light px-3.5 py-2.5 text-sm text-ink-muted">
                  Наставник печатает…
                </div>
              </div>
            ) : null}
          </div>

          {/* Ввод */}
          <div className="border-t border-border p-3">
            {lessonNum ? (
              <div className="mb-2 text-[11px] text-ink-muted">Контекст: урок {lessonNum}</div>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Спросите наставника…"
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-green text-on-green transition-colors hover:bg-green-dark disabled:opacity-50"
                aria-label="Отправить"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <path d="M5 12l14-7-7 14-2-5-5-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
