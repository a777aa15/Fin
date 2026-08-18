import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container, ArrowIcon } from "@/components/primitives";
import { LessonBlocks } from "@/components/LessonBlocks";
import { LessonComplete } from "@/components/study/LessonComplete";
import { flatLessons, getLessonByNum, getPrevNext, getQuiz, getCase } from "@/content/course";

type Params = { num: string };

export function generateStaticParams(): Params[] {
  return flatLessons.map((fl) => ({ num: fl.lesson.num }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { num } = await params;
  const fl = getLessonByNum(num);
  if (!fl) return { title: "Урок не найден" };
  return { title: `${fl.lesson.num} ${fl.lesson.title}` };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { num } = await params;
  const fl = getLessonByNum(num);
  if (!fl) notFound();

  const { lesson, module } = fl;
  const { prev, next } = getPrevNext(num);
  const hasQuiz = !!getQuiz(module.n);
  const hasCase = !!getCase(module.n);
  const hasExtras = (module.extras?.length ?? 0) > 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container size="narrow" className="py-8 sm:py-12">
          {/* Хлебные крошки */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <Link href="/study" className="hover:text-green-dark">Обзор</Link>
            <span>/</span>
            <span>Модуль {module.n}</span>
            <span>/</span>
            <span className="text-ink-secondary">{module.subtitle}</span>
          </div>

          {/* Заголовок */}
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-green-dark tabular-nums">Урок {lesson.num}</span>
                {lesson.tag ? <span className="tag">{lesson.tag}</span> : null}
              </div>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                {lesson.title}
              </h1>
            </div>
            <div className="shrink-0">
              <LessonComplete num={lesson.num} />
            </div>
          </div>

          <div className="mt-8">
            <LessonBlocks blocks={lesson.blocks} />
          </div>

          {/* Ссылки на активности модуля */}
          {(hasQuiz || hasCase || hasExtras) && (
            <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
              {hasExtras ? (
                <Link href={`/module/${module.n}/extras`} className="btn btn-secondary px-5 py-2.5">
                  Доп. материалы модуля
                </Link>
              ) : null}
              {hasQuiz ? (
                <Link href={`/quiz/${module.n}`} className="btn btn-secondary px-5 py-2.5">
                  Пройти тест модуля
                </Link>
              ) : null}
              {hasCase ? (
                <Link href={`/detective/${module.n}`} className="btn btn-secondary px-5 py-2.5">
                  Дело детектива
                </Link>
              ) : null}
            </div>
          )}

          {/* Навигация между уроками */}
          <nav className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {prev ? (
              <Link href={`/lesson/${prev.num}`} className="group card flex min-w-0 items-center gap-3 p-4 hover:border-green/50">
                <ArrowIcon className="h-5 w-5 shrink-0 rotate-180 text-ink-muted group-hover:text-green-dark" />
                <span className="min-w-0">
                  <span className="block text-xs text-ink-muted">Предыдущий урок</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{prev.num} {prev.title}</span>
                </span>
              </Link>
            ) : <span className="hidden sm:block" />}

            {next ? (
              <Link href={`/lesson/${next.num}`} className="group card flex min-w-0 items-center justify-end gap-3 p-4 text-right hover:border-green/50">
                <span className="min-w-0">
                  <span className="block text-xs text-ink-muted">Следующий урок</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{next.num} {next.title}</span>
                </span>
                <ArrowIcon className="h-5 w-5 shrink-0 text-ink-muted group-hover:text-green-dark" />
              </Link>
            ) : (
              <Link href="/study" className="group card flex min-w-0 items-center justify-end gap-3 p-4 text-right hover:border-green/50">
                <span className="min-w-0">
                  <span className="block text-xs text-ink-muted">Курс пройден</span>
                  <span className="mt-0.5 block text-sm font-semibold text-green-dark">Вернуться к обзору</span>
                </span>
                <ArrowIcon className="h-5 w-5 shrink-0 text-green-dark" />
              </Link>
            )}
          </nav>
        </Container>
      </main>
      <Footer />
    </>
  );
}
