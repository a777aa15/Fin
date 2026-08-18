"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { SiteBackground } from "@/components/SiteBackground";

function ResetInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось сменить пароль");
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-extrabold text-ink">Ссылка неполная</h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Откройте ссылку для сброса пароля целиком — в ней должен быть код.
        </p>
        <Link href="/forgot" className="btn btn-secondary mt-6">
          Запросить ссылку заново
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-dark">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-ink">Пароль изменён</h1>
        <p className="mt-2 text-sm text-ink-secondary">Сейчас перенаправим вас на страницу входа…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Новый пароль</h1>
      <p className="mt-2 text-sm text-ink-secondary">Придумайте новый пароль для входа.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Новый пароль</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Минимум 6 символов"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Повторите пароль</span>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Ещё раз"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
          />
        </label>
        {error ? (
          <div role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3.5 py-2.5 text-sm text-bad">
            {error}
          </div>
        ) : null}
        <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
          {busy ? "Сохраняем…" : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPage() {
  return (
    <>
      <SiteBackground />
      <Header />
      <main className="flex-1">
        <Container className="flex min-h-[70vh] items-center justify-center py-16">
          <Suspense fallback={null}>
            <ResetInner />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </>
  );
}
