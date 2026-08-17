import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center">
        <Container className="py-16">
          <AuthForm mode="register" />
        </Container>
      </main>
      <Footer />
    </>
  );
}
