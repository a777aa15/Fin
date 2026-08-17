"use client";

import { useEffect, useRef, useState } from "react";
import { ENROLL_EVENT } from "./EnrollButton";

// Модалка записи на курс.
// v1: собирает заявку без бэкенда и показывает подтверждение + mailto-фолбэк.
// TODO(монетизация/CRM): здесь точка подключения оплаты или отправки лида на эндпойнт.
const CONTACT_EMAIL = "hello@example.com"; // ← заменить на реальный адрес

export function EnrollDialog() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", goal: "" });
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setSent(false);
      setOpen(true);
    };
    window.addEventListener(ENROLL_EVENT, onOpen);
    return () => window.removeEventListener(ENROLL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Заявка на курс «Финансовый аналитик»"
  )}&body=${encodeURIComponent(`Имя: ${form.name}\nКонтакт: ${form.contact}\nЦель: ${form.goal}`)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="enroll-title">
      <button aria-label="Закрыть" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl sm:p-8">
        <button onClick={() => setOpen(false)} aria-label="Закрыть" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-grey-light hover:text-ink">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-dark">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-ink">Заявка принята</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              Спасибо, {form.name || "друг"}! Мы свяжемся с вами по указанному контакту.
              Можно продублировать заявку письмом.
            </p>
            <a href={mailtoHref} className="btn btn-secondary mt-5">
              Отправить письмом
            </a>
          </div>
        ) : (
          <>
            <div className="eyebrow mb-1">Запись на курс</div>
            <h3 id="enroll-title" className="text-2xl font-bold text-ink">
              Оставьте заявку
            </h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Забронируйте место в потоке. Мы свяжемся, ответим на вопросы и расскажем об условиях.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <Field label="Имя" required htmlFor="enroll-name" inputRef={firstFieldRef} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Как к вам обращаться" autoComplete="name" />
              <Field label="Телефон, Telegram или e-mail" required htmlFor="enroll-contact" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="@username или +7…" />
              <div>
                <label htmlFor="enroll-goal" className="mb-1.5 block text-sm font-medium text-ink">
                  Ваша цель <span className="text-ink-muted">(необязательно)</span>
                </label>
                <textarea
                  id="enroll-goal"
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  rows={2}
                  placeholder="Например: сменить профессию, вырасти до аналитика, разобраться в финансах бизнеса"
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Отправить заявку
              </button>
              <p className="text-center text-xs text-ink-muted">
                Нажимая кнопку, вы соглашаетесь на обработку контактных данных для связи по курсу.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputRef,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required ? <span className="text-green">*</span> : null}
      </label>
      <input
        ref={inputRef}
        id={htmlFor}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
      />
    </div>
  );
}
