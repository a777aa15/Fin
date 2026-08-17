"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EnrollButton } from "./EnrollButton";
import { EnrollDialog } from "./EnrollDialog";
import { useAuth } from "@/lib/progress";

const NAV = [
  { label: "Обзор курса", href: "/study" },
  { label: "Калькуляторы", href: "/calculators" },
  { label: "Глоссарий", href: "/glossary" },
  { label: "Детектив", href: "/detective" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loaded, logout } = useAuth();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Финансовый аналитик — на главную">
            <Logo />
            <span className="text-[15px] font-bold tracking-tight text-ink">
              Финансовый аналитик
            </span>
          </Link>

          {/* Вкладки курса — только для авторизованных (личный кабинет) */}
          {loaded && user ? (
            <nav className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition-colors ${
                      active ? "font-semibold text-green-dark" : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <span className="hidden md:block" />
          )}

          <div className="hidden items-center gap-3 md:flex">
            {loaded && user ? (
              <>
                <Link href="/study" className="max-w-[160px] truncate text-sm text-ink-secondary hover:text-ink" title={user.email}>
                  {user.name || user.email}
                </Link>
                <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-ink-secondary hover:text-ink">
                  Войти
                </Link>
                <EnrollButton className="px-5 py-2">Записаться</EnrollButton>
              </>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink md:hidden"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 top-14 z-40 bg-surface md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-5">
            {loaded && user
              ? NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-grey-light"
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            <div className="mt-3 space-y-2">
              {loaded && user ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="btn btn-secondary w-full"
                >
                  Выйти ({user.name || user.email})
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-secondary w-full">
                    Войти
                  </Link>
                  <EnrollButton className="w-full">Записаться на курс</EnrollButton>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}

      <EnrollDialog />
    </>
  );
}

function Logo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-on-green">
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 20V4M4 20h16" strokeLinecap="round" />
        <path d="M7 15l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
