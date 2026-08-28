"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Кнопка «Назад»: возвращает на предыдущую страницу (например, из дела
// детектива обратно к уроку, с которого на него перешли), а не просто
// в общий обзор курса.
//
// document.referrer не годится для этой проверки: при клиентской навигации
// Next.js (Link/router.push) он не обновляется — документ не перезагружается,
// поэтому всегда остаётся referrer'ом самого первого захода на сайт.
// history.length корректно растёт при каждом клиентском переходе в этой
// вкладке, поэтому используем его: >1 обычно означает, что переход был
// внутри сайта. Если страницу открыли напрямую (новая вкладка, прямая
// ссылка) — length будет 1, и мы ведём на fallbackHref.
export function BackButton({ fallbackHref = "/study", label = "Назад" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // window недоступен при SSR — читаем историю только после монтирования,
    // иначе разметка сервера и клиента разойдётся (hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanGoBack(window.history.length > 1);
  }, []);

  const icon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const cls = "inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-green-dark";

  if (canGoBack) {
    return (
      <button onClick={() => router.back()} className={cls}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Link href={fallbackHref} className={cls}>
      {icon}
      {label}
    </Link>
  );
}
