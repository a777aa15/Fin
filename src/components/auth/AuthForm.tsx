"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/progress";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Что-то пошло не так");
        setBusy(false);
        return;
      }
      await refresh(); // подтянуть пользователя + перенести гостевой прогресс
      if (data.user?.approved) {
        // вернуться на исходную страницу (?next=…), только внутренний путь
        const nextParam = new URLSearchParams(window.location.search).get("next");
        const dest = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/study";
        router.push(dest);
      } else {
        // доступ ещё не открыт — на страницу ожидания
        router.push("/pending");
      }
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        {isRegister ? "Создать аккаунт" : "Вход в аккаунт"}
      </h1>
      <p className="mt-2 text-sm text-ink-secondary">
        {isRegister
          ? "Оставьте заявку на обучение — доступ к курсу откроется после подтверждения."
          : "Войдите, чтобы продолжить обучение."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {isRegister ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Имя</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Как к вам обращаться"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
            />
          </label>
        ) : null}

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

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Пароль</span>
          <input
            type="password"
            required
            minLength={isRegister ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "Минимум 6 символов" : "Ваш пароль"}
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-green focus:outline-none"
          />
        </label>

        {error ? (
          <div role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3.5 py-2.5 text-sm text-bad">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
          {busy ? "Подождите…" : isRegister ? "Зарегистрироваться" : "Войти"}
        </button>

        {isRegister ? (
          <p className="text-center text-xs text-ink-muted">
            Регистрируясь, вы соглашаетесь на обработку персональных данных согласно{" "}
            <Link href="/privacy" className="underline hover:text-green-dark">
              политике конфиденциальности
            </Link>
            .
          </p>
        ) : null}
      </form>

      {!isRegister ? (
        <p className="mt-3 text-center text-sm">
          <Link href="/forgot" className="text-ink-secondary hover:text-green-dark">
            Забыли пароль?
          </Link>
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-ink-secondary">
        {isRegister ? (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-green-dark hover:underline">
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{" "}
            <Link href="/register" className="font-medium text-green-dark hover:underline">
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
