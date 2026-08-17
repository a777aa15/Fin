import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { CalculatorsClient } from "@/components/CalculatorsClient";

export const metadata: Metadata = {
  title: "Калькуляторы",
  description:
    "Финансовые калькуляторы курса: NPV/IRR, WACC, CAPM, точка безубыточности, LTV/CAC, цена облигации и уравнение Фишера. Живой пересчёт.",
};

export default function CalculatorsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="eyebrow mb-3">Инструменты</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Финансовые калькуляторы
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-secondary">
              Те же формулы, что в курсе — считайте прямо на сайте. Вводите значения,
              результат пересчитывается мгновенно.
            </p>
          </div>

          <div className="mt-8">
            <CalculatorsClient />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
