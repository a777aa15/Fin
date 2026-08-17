import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { LessonBlocks } from "@/components/LessonBlocks";
import { modules, getModule } from "@/content/course";

type Params = { n: string };

export function generateStaticParams(): Params[] {
  return modules.filter((m) => (m.extras?.length ?? 0) > 0).map((m) => ({ n: String(m.n) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { n } = await params;
  const m = getModule(Number(n));
  if (!m) return { title: "Материалы не найдены" };
  return { title: `Доп. материалы · Модуль ${m.n}` };
}

export default async function ExtrasPage({ params }: { params: Promise<Params> }) {
  const { n } = await params;
  const module = getModule(Number(n));
  if (!module || (module.extras?.length ?? 0) === 0) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container size="narrow" className="py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <Link href="/study" className="hover:text-green-dark">Обзор</Link>
            <span>/</span>
            <span className="text-ink-secondary">Модуль {module.n}</span>
          </div>

          <div className="mt-5">
            <div className="eyebrow mb-2">Дополнительные материалы</div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              {module.subtitle}
            </h1>
          </div>

          <div className="mt-8 space-y-8">
            {module.extras.map((ex, i) => (
              <section key={i} className="card p-6 sm:p-7">
                <h2 className="text-xl font-bold text-ink">{ex.title}</h2>
                <div className="mt-3">
                  <LessonBlocks blocks={ex.blocks} />
                </div>
              </section>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
