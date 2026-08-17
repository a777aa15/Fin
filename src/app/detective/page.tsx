import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { DetectiveHub, type HubCase } from "@/components/detective/DetectiveHub";
import { cases, getModule } from "@/content/course";

export const metadata: Metadata = {
  title: "Финансовый детектив",
  description:
    "Тренажёр «Финансовый детектив»: ищите красные флаги в отчётности реальных компаний и делайте вывод, как настоящий аналитик.",
};

export default function DetectivePage() {
  const hub: HubCase[] = cases.map((c) => ({
    module: c.module,
    title: c.title,
    company: c.company,
    moduleSubtitle: getModule(c.module)?.subtitle ?? "",
    totalFlags: c.totalFlags,
  }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="eyebrow mb-3">Тренажёр</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Финансовый детектив
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              {cases.length} дел по мотивам реальных ситуаций. Вжившись в роль аналитика,
              изучите документы, отметьте «красные флаги» в отчётности и сделайте
              обоснованный вывод. Проверьте, насколько цепкий у вас глаз.
            </p>
          </div>

          <div className="mt-8">
            <DetectiveHub cases={hub} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
