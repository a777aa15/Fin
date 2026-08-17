import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { SiteBackground } from "@/components/SiteBackground";
import { AdminClient } from "@/components/admin/AdminClient";
import { getCurrentUser } from "@/lib/auth";
import { listUsers, listLeads } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Админка", robots: { index: false } };

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) redirect("/study");

  const [users, leads] = await Promise.all([listUsers(), listLeads()]);

  return (
    <>
      <SiteBackground />
      <Header />
      <main className="flex-1">
        <Container className="py-10 sm:py-14">
          <div className="mb-8">
            <div className="eyebrow mb-3">Админ-панель</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Заявки и доступы
            </h1>
            <p className="mt-3 max-w-2xl text-ink-secondary">
              Одобряйте доступ к курсу вручную — после подтверждения оплаты или заявки.
              Пока не одобрен, пользователь видит только страницу ожидания.
            </p>
          </div>
          <AdminClient
            users={users.map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              approved: u.approved,
              isAdmin: u.isAdmin,
              createdAt: u.createdAt.toISOString(),
            }))}
            leads={leads.map((l) => ({
              id: l.id,
              name: l.name,
              email: l.email,
              contact: l.contact,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
