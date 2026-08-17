"use client";

import { useState } from "react";
import { Container } from "./primitives";

// Плашка записи на курс (формат один — тарифов нет).
// Лид-форма без бэкенда: показывает подтверждение + mailto-фолбэк.
// TODO(CRM/оплата): заменить handleSubmit на реальную отправку заявки.
const CONTACT_EMAIL = "hello@example.com"; // ← заменить на реальный адрес

const PERKS = [
  "Личный ИИ-наставник",
  "Практика в каждом модуле",
  "Реальный кейс в портфолио",
  "Доступ с любого устройства",
];

export function EnrollSection() {
  const [form, setForm] = useState({ name: "", email: "", contact: "" });
  const [sent, setSent] = useState(false);

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Заявка на курс «Финансовый аналитик»"
  )}&body=${encodeURIComponent(`Имя: ${form.name}\nE-mail: ${form.email}\nКонтакт: ${form.contact}`)}`;

  return (
    <section id="enroll" className="scroll-mt-16 py-14 sm:py-20">
      <Container size="wide">
        <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-card p-6 sm:p-10">
          <div aria-hidden className="deco-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            {/* Левая часть — оффер */}
            <div>
              <div className="eyebrow">Запись на курс</div>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
                Начните учиться на финансового аналитика
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-secondary">
                Оставьте почту — расскажем о старте ближайшего потока, стоимости и условиях.
                Никакого спама, только по делу.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-light text-green-dark">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Правая часть — форма */}
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
              {sent ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-dark">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-ink">Заявка принята</h3>
                  <p className="mt-2 text-sm text-ink-secondary">
                    Спасибо, {form.name || "друг"}! Свяжемся с вами по указанному контакту.
                  </p>
                  <a href={mailtoHref} className="btn btn-secondary mt-5">
                    Продублировать письмом
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="en-name" className="mb-1.5 block text-sm font-medium text-ink">
                      Имя
                    </label>
                    <input
                      id="en-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      autoComplete="name"
                      placeholder="Как к вам обращаться"
                      className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="en-email" className="mb-1.5 block text-sm font-medium text-ink">
                      E-mail <span className="text-green">*</span>
                    </label>
                    <input
                      id="en-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="en-contact" className="mb-1.5 block text-sm font-medium text-ink">
                      Телефон или Telegram <span className="text-ink-muted">(необязательно)</span>
                    </label>
                    <input
                      id="en-contact"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="@username или +7…"
                      className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">
                    Оставить заявку
                  </button>
                  <p className="text-center text-xs text-ink-muted">
                    Нажимая кнопку, вы соглашаетесь на обработку контактных данных для связи по курсу.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
