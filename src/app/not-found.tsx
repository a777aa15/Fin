import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="flex min-h-[60vh] items-center justify-center py-20">
          <div className="text-center">
            <div className="text-7xl font-extrabold tracking-tight text-green-dark sm:text-8xl">404</div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Страница не найдена
            </h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-secondary">
              Возможно, ссылка устарела или страница была перемещена.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/" className="btn btn-primary">
                На главную
              </Link>
              <Link href="/study" className="btn btn-secondary">
                К курсу
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
