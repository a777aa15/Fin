"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* ignore — сообщение всё равно нейтральное */
    }
    setBusy(false);
    setSent(true);
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="flex min-h-[70vh] items-center justify-center py-16">
          <div className="w-full max-w-sm">
            {sent ? (
              <div className="card p-8 text-center">
                <h1 className="text-xl font-extrabold text-ink">Проверьте почту</h1>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                  Если аккаунт с этой почтой существует, мы отправили на неё ссылку для
                  сброса пароля. Проверьте входящие и папку «Спам» — ссылка действует 24 часа.
                </p>
                <Link href="/login" className="btn btn-secondary mt-6">
                  Вернуться ко входу
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">Забыли пароль?</h1>
                <p className="mt-2 text-sm text-ink-secondary">
                  Укажите e-mail аккаунта — мы поможем восстановить доступ.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">E-mail</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
                    />
                  </label>
                  <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
                    {busy ? "Отправляем…" : "Восстановить доступ"}
                  </button>
                </form>
                <p className="mt-5 text-center text-sm text-ink-secondary">
                  Вспомнили пароль?{" "}
                  <Link href="/login" className="font-medium text-green-dark hover:underline">
                    Войти
                  </Link>
                </p>
              </>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
