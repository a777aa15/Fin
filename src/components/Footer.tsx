import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-on-green">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 20V4M4 20h16" strokeLinecap="round" />
                  <path d="M7 15l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-bold text-ink">Финансовый аналитик</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-secondary">
              Онлайн-курс с нуля до уверенного уровня 1–3 года опыта. Отчётность,
              Excel, финмоделирование, оценка и юнит-экономика.
            </p>
          </div>

          <FooterCol
            title="Курс"
            links={[
              { label: "Обзор курса", href: "/study" },
              { label: "Калькуляторы", href: "/calculators" },
              { label: "Глоссарий", href: "/glossary" },
              { label: "Финансовый детектив", href: "/detective" },
            ]}
          />
          <FooterCol
            title="Разделы"
            links={[
              { label: "Чему научитесь", href: "/#outcomes" },
              { label: "Для кого", href: "/#audience" },
              { label: "Записаться", href: "/#enroll" },
              { label: "Вопросы", href: "/#faq" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-ink-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Курс «Финансовый аналитик»</p>
          <p>15 модулей · 148 уроков</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h4>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-ink-secondary transition-colors hover:text-green-dark">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
