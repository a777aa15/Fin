import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { GlossaryBrowser } from "@/components/GlossaryBrowser";
import { glossary, glossaryCategories } from "@/content/course";

export const metadata: Metadata = {
  title: "Глоссарий",
  description:
    "Глоссарий курса «Финансовый аналитик»: ключевые термины финансового анализа с понятными определениями и поиском.",
};

export default function GlossaryPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="eyebrow mb-3">Справочник</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Глоссарий финансиста
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              {glossary.length} ключевых терминов из курса — от баланса и EBITDA
              до WACC и юнит-экономики. Ищите по названию или определению.
            </p>
          </div>

          <div className="mt-8">
            <GlossaryBrowser terms={glossary} categories={glossaryCategories()} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
