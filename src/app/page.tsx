import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EnrollButton } from "@/components/EnrollButton";
import { Container, SectionHeading, ButtonLink, ArrowIcon, CheckIcon } from "@/components/primitives";
import { RedirectIfAuthed } from "@/components/RedirectIfAuthed";
import { courseFacts } from "@/content/course";

export default function Home() {
  return (
    <>
      <RedirectIfAuthed />
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsBand />
        <Outcomes />
        <Audience />
        <Format />
        <Transformation />
        <Process />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------------- HERO */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <Container size="wide" className="py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              <span className="text-xs font-medium text-ink-secondary">
                Онлайн-курс · с нуля до уверенного уровня
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
              Станьте <span className="text-green-dark">финансовым аналитиком</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Практический курс, который доводит с нуля до уровня уверенного специалиста
              с опытом 1–3 года. Вы научитесь читать отчётность, строить модели в Excel,
              оценивать компании и проекты — и защитите дипломную работу на реальном кейсе.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <EnrollButton className="px-7 py-3.5">
                Записаться на курс
                <ArrowIcon className="h-4 w-4" />
              </EnrollButton>
              <a href="#format" className="btn btn-secondary px-7 py-3.5">
                Что входит в курс
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span>Диплом на реальном кейсе</span>
              <span className="hidden sm:inline">•</span>
              <span>Практика в каждом модуле</span>
              <span className="hidden sm:inline">•</span>
              <span>ИИ-наставник</span>
            </div>
          </div>

          <HeroCard />
        </div>
      </Container>
    </section>
  );
}

function HeroCard() {
  const skills = [
    "Читать баланс, P&L и отчёт о движении денег",
    "Строить финмодель и DCF-оценку в Excel",
    "Считать NPV, IRR и стоимость капитала",
    "Разбирать юнит-экономику и точку безубыточности",
  ];
  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <span className="eyebrow">После курса вы сможете</span>
        <span className="tag">навыки junior+</span>
      </div>
      <ul className="mt-5 space-y-3">
        {skills.map((s) => (
          <li key={s} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-light text-green-dark">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm leading-relaxed text-ink">{s}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
        <MiniFact value={String(courseFacts.lessons)} label="уроков" />
        <MiniFact value={String(courseFacts.modules)} label="модулей" />
        <MiniFact value="Диплом" label="в портфолио" />
      </div>
    </div>
  );
}

function MiniFact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-extrabold text-green-dark">{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------- STATS BAND */
function StatsBand() {
  const stats = [
    { value: String(courseFacts.lessons), label: "уроков с практикой" },
    { value: String(courseFacts.calculators), label: "финансовых калькуляторов" },
    { value: String(courseFacts.quizQuestions), label: "вопросов в тестах" },
    { value: String(courseFacts.glossaryTerms), label: "терминов в глоссарии" },
  ];
  return (
    <section className="py-14 sm:py-16">
      <Container size="wide">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card px-5 py-6 text-center">
              <div className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1.5 text-sm text-ink-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------- OUTCOMES */
const OUTCOMES = [
  { title: "Читать финансовую отчётность", desc: "Баланс, P&L и cash flow — понимать, что стоит за цифрами, и находить нестыковки." },
  { title: "Анализировать состояние компании", desc: "Ликвидность, рентабельность, оборачиваемость, долговая нагрузка — по формулам и на практике." },
  { title: "Работать в Excel как финансист", desc: "Формулы, модели, план-факт и таблицы чувствительности — рабочий инструмент, а не хаос." },
  { title: "Строить финансовые модели", desc: "Трёхкомпонентная модель и DCF-оценка — от выручки до справедливой стоимости бизнеса." },
  { title: "Оценивать инвестпроекты", desc: "NPV, IRR, срок окупаемости, стоимость капитала (WACC, CAPM) — принимать обоснованные решения." },
  { title: "Считать юнит-экономику", desc: "LTV/CAC, точка безубыточности, маржинальность — понимать, зарабатывает ли бизнес." },
  { title: "Бюджетировать и прогнозировать", desc: "Строить бюджет, вести план-факт, прогнозировать выручку и операционные расходы." },
  { title: "Представлять цифры и выводы", desc: "Готовить аналитическую отчётность и доносить результат до руководства." },
  { title: "Защитить дипломный проект", desc: "Полный финансовый анализ реальной компании — готовый кейс в портфолио для работодателя." },
];

function Outcomes() {
  return (
    <section id="outcomes" className="scroll-mt-16 py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading
          eyebrow="Результат"
          title="Чему вы научитесь"
          intro="Не абстрактная теория, а конкретные навыки, которые ежедневно применяет финансовый аналитик — и которые можно показать на собеседовании."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <div key={o.title} className="card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-light text-sm font-bold text-green-dark">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{o.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------- AUDIENCE */
const AUDIENCE = [
  { title: "Новичкам с нуля", desc: "Без опыта в финансах — начинаете с азов бухучёта и отчётности, без пробелов." },
  { title: "Тем, кто меняет профессию", desc: "Хотите войти в финансы из смежной сферы и получить востребованную специальность." },
  { title: "Начинающим специалистам", desc: "Бухгалтерам, экономистам, junior-аналитикам — систематизировать знания и вырасти." },
  { title: "Предпринимателям", desc: "Понимать финансы своего бизнеса: юнит-экономику, модель, точку безубыточности." },
];

function Audience() {
  return (
    <section id="audience" className="scroll-mt-16 py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading eyebrow="Для кого" title="Подойдёт, если вы —" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <div key={a.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-bold text-ink">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{a.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ FORMAT */
const FEATURES = [
  { title: "148 уроков", desc: "Структурированная теория с примерами, кейсами и таблицами — читаете в удобном темпе.", icon: "book" },
  { title: "Тесты с автопроверкой", desc: "После каждого модуля — вопросы с разбором и объяснением правильных ответов.", icon: "check" },
  { title: "6 финансовых калькуляторов", desc: "NPV/IRR, WACC, CAPM, точка безубыточности, LTV/CAC, облигации — считайте прямо на сайте.", icon: "calc" },
  { title: "Тренажёр «Финансовый детектив»", desc: "Ищите красные флаги в отчётности реальных компаний — как настоящий аналитик.", icon: "search" },
  { title: "Глоссарий 52 термина", desc: "Все ключевые понятия с понятными определениями и поиском.", icon: "list" },
  { title: "Дипломная работа", desc: "Полный финансовый анализ реальной компании — готовый проект в портфолио.", icon: "award" },
];

function Format() {
  return (
    <section id="format" className="scroll-mt-16 border-y border-border bg-card py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading
          eyebrow="Формат"
          title="Что входит в курс"
          intro="Практика, тренажёры и инструменты аналитика — а не только видеолекции."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green text-on-green">
                <FeatureIcon name={f.icon} />
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------- TRANSFORMATION */
function Transformation() {
  const before = [
    "Не отличаете EBITDA от денежного потока",
    "Excel-модель вызывает страх",
    "Нет портфолио и подтверждённых навыков",
    "Не понимаете, из чего складывается стоимость бизнеса",
  ];
  const after = [
    "Свободно читаете и анализируете отчётность",
    "Строите финмодель и DCF с нуля",
    "Дипломный кейс в портфолио для работодателя",
    "Оцениваете проекты и обосновываете решения",
  ];
  return (
    <section className="py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading eyebrow="Трансформация" title="До и после курса" align="center" />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-sm font-semibold text-ink-muted">До</div>
            <ul className="mt-4 space-y-3">
              {before.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-ink-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-green/30 bg-green-light/40 p-6">
            <div className="text-sm font-semibold text-green-dark">После</div>
            <ul className="mt-4 space-y-3">
              {after.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-on-green">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------- PROCESS */
const STEPS = [
  { n: "01", title: "Теория с примерами", desc: "Понятные объяснения с кейсами реальных компаний и таблицами." },
  { n: "02", title: "Тренажёры и тесты", desc: "Закрепляете материал тестами и игрой «Финансовый детектив»." },
  { n: "03", title: "Практика в Excel", desc: "Считаете на калькуляторах и собираете собственные модели." },
  { n: "04", title: "Дипломный проект", desc: "Полный анализ реальной компании — итог и портфолио." },
];

function Process() {
  return (
    <section className="py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading eyebrow="Как проходит обучение" title="Путь от новичка к аналитику" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-6">
              <div className="text-2xl font-extrabold text-green/40">{s.n}</div>
              <h3 className="mt-3 text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------- PRICING */
const PLANS = [
  {
    name: "Самостоятельно",
    tagline: "Все материалы курса",
    features: ["148 уроков и доп. материалы", "Тесты с автопроверкой", "Калькуляторы и глоссарий", "Тренажёр «Детектив»"],
    highlighted: false,
  },
  {
    name: "С практикой",
    tagline: "Материалы + сопровождение",
    features: ["Всё из тарифа «Самостоятельно»", "Проверка ключевых заданий", "Дипломный проект с ревью", "Ответы на вопросы"],
    highlighted: true,
  },
  {
    name: "С наставником",
    tagline: "Максимальное сопровождение",
    features: ["Всё из тарифа «С практикой»", "Личный наставник-аналитик", "Разбор карьеры и резюме", "Приоритетная поддержка"],
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 py-14 sm:py-20">
      <Container size="wide">
        <SectionHeading
          eyebrow="Тарифы"
          title="Выберите формат участия"
          intro="Стоимость и старт ближайшего потока уточняются — оставьте заявку, и мы расскажем об условиях и действующих предложениях."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.highlighted ? "border-green bg-card shadow-md" : "border-border bg-card"
              }`}
            >
              {p.highlighted ? (
                <span className="absolute -top-3 left-7 rounded-full bg-green px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-green">
                  Популярный
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{p.tagline}</p>
              <div className="mt-4 text-2xl font-extrabold text-ink">По запросу</div>
              <ul className="mt-5 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <EnrollButton variant={p.highlighted ? "primary" : "secondary"} className="w-full">
                  Записаться
                </EnrollButton>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------- FAQ */
const FAQ = [
  { q: "Нужен ли опыт в финансах или бухгалтерии?", a: "Нет. Курс начинается с азов — бухучёта и отчётности с нуля. Достаточно школьной математики и базового Excel." },
  { q: "Сколько времени занимает обучение?", a: "Курс из 15 модулей и 148 уроков проходится в удобном темпе. В среднем — несколько месяцев при регулярных занятиях." },
  { q: "Будет ли практика, а не только теория?", a: "Да. В каждом модуле — тесты, калькуляторы и тренажёр «Финансовый детектив», а в финале — дипломный анализ реальной компании." },
  { q: "Получу ли я что-то для портфолио?", a: "Да. Дипломная работа — полный финансовый анализ реальной компании, который можно показать работодателю." },
  { q: "Как оплатить и когда старт?", a: "Оставьте заявку — мы свяжемся, расскажем о ближайшем потоке, условиях и способах оплаты." },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-14 sm:py-20">
      <Container size="narrow">
        <SectionHeading eyebrow="Вопросы" title="Частые вопросы" align="center" />
        <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <span className="text-base font-semibold text-ink">{item.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-ink-secondary transition-transform group-open:rotate-45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------- FINAL CTA */
function FinalCta() {
  return (
    <section className="py-14 sm:py-20">
      <Container size="wide">
        <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-80"
            style={{ background: "radial-gradient(40rem 20rem at 50% 0%, rgba(52,193,123,0.18), transparent 70%)" }}
          />
          <div className="relative">
            <div className="eyebrow">Старт ближайшего потока</div>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Начните путь в профессию финансового аналитика
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-secondary sm:text-lg">
              Оставьте заявку — забронируем место в потоке, ответим на вопросы и расскажем об условиях участия.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <EnrollButton className="px-8 py-4">
                Записаться на курс
                <ArrowIcon className="h-4 w-4" />
              </EnrollButton>
              <ButtonLink href="/study" variant="secondary" className="px-8 py-4">
                Посмотреть программу
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------- ICONS */
function FeatureIcon({ name }: { name: string }): ReactNode {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true, className: "h-5 w-5" } as const;
  switch (name) {
    case "book":
      return <svg {...common}><path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z" strokeLinejoin="round" /><path d="M18 17H6" /></svg>;
    case "check":
      return <svg {...common}><path d="M9 11l3 3L20 6" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" strokeLinecap="round" /></svg>;
    case "calc":
      return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h0M12 11h0M15 11h0M9 15h0M12 15h0M15 15h3" strokeLinecap="round" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>;
    case "list":
      return <svg {...common}><path d="M8 6h12M8 12h12M8 18h12M4 6h0M4 12h0M4 18h0" strokeLinecap="round" /></svg>;
    case "award":
      return <svg {...common}><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2 4 2-1-7.5" strokeLinejoin="round" /></svg>;
    default:
      return null;
  }
}
