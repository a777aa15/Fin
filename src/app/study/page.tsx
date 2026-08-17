import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { SiteBackground } from "@/components/SiteBackground";
import { StudyOverview, type SlimModule } from "@/components/study/StudyOverview";
import { modules, getQuiz, getCase } from "@/content/course";

export const metadata: Metadata = {
  title: "Обзор курса",
  description:
    "Программа курса «Финансовый аналитик»: 15 модулей, 148 уроков, тесты и дела детектива. Отмечайте прогресс по мере прохождения.",
};

export default function StudyPage() {
  // Слим-структура для клиента (без тяжёлых blocks).
  const slim: SlimModule[] = modules.map((m) => ({
    n: m.n,
    subtitle: m.subtitle,
    short: m.short,
    lessons: m.lessons.map((l) => ({ num: l.num, title: l.title, tag: l.tag ?? null })),
    hasExtras: (m.extras?.length ?? 0) > 0,
    hasQuiz: !!getQuiz(m.n),
    hasCase: !!getCase(m.n),
  }));

  return (
    <>
      <SiteBackground />
      <Header />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="eyebrow mb-3">Личный кабинет</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Обзор курса
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              15 модулей — от знакомства с профессией до дипломного анализа реальной
              компании. Открывайте уроки, проходите тесты и дела детектива, отмечайте
              прогресс.
            </p>
          </div>

          <div className="mt-8">
            <StudyOverview modules={slim} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
