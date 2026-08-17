import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { CaseClient } from "@/components/detective/CaseClient";
import { cases, getCase, getModule } from "@/content/course";

type Params = { module: string };

export function generateStaticParams(): Params[] {
  return cases.map((c) => ({ module: String(c.module) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { module } = await params;
  const c = getCase(Number(module));
  if (!c) return { title: "Дело не найдено" };
  return { title: `${c.title} · Детектив` };
}

export default async function CasePage({ params }: { params: Promise<Params> }) {
  const { module } = await params;
  const kase = getCase(Number(module));
  if (!kase) notFound();
  const mod = getModule(kase.module);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container size="narrow" className="py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <Link href="/detective" className="hover:text-green-dark">Детектив</Link>
            <span>/</span>
            <span className="text-ink-secondary">Дело модуля {kase.module}</span>
          </div>

          <div className="mt-5">
            <div className="eyebrow mb-2">
              После модуля {kase.module}{mod ? `: ${mod.subtitle}` : ""}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              {kase.title}
            </h1>
            <div className="mt-2 text-base text-ink-secondary">{kase.company}</div>
          </div>

          <div className="mt-8">
            <CaseClient kase={kase} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
