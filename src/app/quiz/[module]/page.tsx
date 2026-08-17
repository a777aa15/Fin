import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { QuizClient } from "@/components/quiz/QuizClient";
import { quizzes, getQuiz, getModule, getCase } from "@/content/course";

type Params = { module: string };

export function generateStaticParams(): Params[] {
  return quizzes.map((q) => ({ module: String(q.module) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { module } = await params;
  const m = getModule(Number(module));
  return { title: `Тест · Модуль ${module}${m ? " · " + m.subtitle : ""}` };
}

export default async function QuizPage({ params }: { params: Promise<Params> }) {
  const { module } = await params;
  const moduleN = Number(module);
  const quiz = getQuiz(moduleN);
  const mod = getModule(moduleN);
  if (!quiz || !mod) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container size="narrow" className="py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <Link href="/study" className="hover:text-green-dark">Обзор</Link>
            <span>/</span>
            <span className="text-ink-secondary">Модуль {mod.n}</span>
          </div>

          <div className="mt-5">
            <div className="eyebrow mb-2">Тест модуля</div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              {mod.subtitle}
            </h1>
            <p className="mt-3 text-sm text-ink-secondary">
              {quiz.questions.length} вопросов с автопроверкой и разбором. Ответьте на все и
              нажмите «Проверить».
            </p>
          </div>

          <div className="mt-8">
            <QuizClient moduleN={moduleN} questions={quiz.questions} hasCase={!!getCase(moduleN)} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
