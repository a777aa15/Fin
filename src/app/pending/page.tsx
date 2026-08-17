"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { SiteBackground } from "@/components/SiteBackground";
import { useAuth } from "@/lib/progress";

export default function PendingPage() {
  const router = useRouter();
  const { user, loaded, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    setNote(null);
    try {
      const res = await fetch("/api/session/refresh", { method: "POST" });
      const data = await res.json();
      if (data.approved) {
        router.push("/study");
        return;
      }
      setNote("Пока доступ не открыт. Мы сообщим, как только подтвердим заявку.");
    } catch {
      setNote("Не удалось проверить. Попробуйте ещё раз.");
    } finally {
      setChecking(false);
    }
  }, [router]);

  // Гостя — на вход; уже одобренного — сразу в курс.
  useEffect(() => {
    if (!loaded) return;
    if (!user) router.replace("/login");
    else if (user.approved) router.replace("/study");
  }, [loaded, user, router]);

  // Тихая авто-проверка раз в 15 секунд.
  useEffect(() => {
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [check]);

  return (
    <>
      <SiteBackground />
      <Header />
      <main className="flex-1">
        <Container className="py-16 sm:py-24">
          <div className="card mx-auto max-w-lg p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-green-dark">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Заявка на рассмотрении
            </h1>
            <p className="mt-3 leading-relaxed text-ink-secondary">
              Спасибо за регистрацию{user?.name ? `, ${user.name}` : ""}! Доступ к курсу
              открывается вручную — после подтверждения заявки или оплаты. Мы откроем
              его в ближайшее время, и эта страница сама впустит вас в курс.
            </p>
            {note ? <p className="mt-4 text-sm text-ink-muted">{note}</p> : null}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={check}
                disabled={checking}
                className="btn btn-primary w-full max-w-xs disabled:opacity-60"
              >
                {checking ? "Проверяем…" : "Проверить доступ"}
              </button>
              <button
                onClick={() => logout().then(() => router.push("/"))}
                className="text-sm text-ink-secondary hover:text-ink"
              >
                Выйти
              </button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
