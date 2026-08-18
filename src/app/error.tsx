"use client";

import Link from "next/link";
import { useEffect } from "react";

// Экран ошибки вместо белой страницы. Показывается при сбое рендера/данных.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-light text-amber">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 8v5" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
            <path d="M10.3 3.9L2.6 17.4A2 2 0 004.3 20.4h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Что-то пошло не так</h1>
        <p className="mt-3 leading-relaxed text-ink-secondary">
          Мы уже знаем о проблеме. Попробуйте обновить страницу — обычно это помогает.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">
            Попробовать снова
          </button>
          <Link href="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
