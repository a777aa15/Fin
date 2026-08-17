import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center">
        <Container className="py-16">
          <AuthForm mode="login" />
        </Container>
      </main>
      <Footer />
    </>
  );
}
