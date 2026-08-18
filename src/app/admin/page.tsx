import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/primitives";
import { AdminClient } from "@/components/admin/AdminClient";
import { getVerifiedUser } from "@/lib/auth";
import { listUsers, listLeads, getVisitorStats, listPendingResets } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Админка", robots: { index: false } };

export default async function AdminPage() {
  const me = await getVerifiedUser();
  if (!me?.isAdmin) redirect("/study");

  const [users, leads, visits, resets] = await Promise.all([
    listUsers(),
    listLeads(),
    getVisitorStats(),
    listPendingResets(),
  ]);
  const notConverted = Math.max(0, visits.total - visits.converted);
  const rate = visits.total ? Math.round((visits.converted / visits.total) * 1000) / 10 : 0;

  return (
    <>
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

          {/* Метрики конверсии */}
          <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard value={String(visits.total)} label="посетили сайт" />
            <StatCard value={String(visits.converted)} label="оставили заявку" accent />
            <StatCard value={`${rate}%`} label="конверсия" accent />
            <StatCard value={String(notConverted)} label="ушли без заявки" />
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
              note: l.note,
              createdAt: l.createdAt.toISOString(),
            }))}
            resets={resets.map((r) => ({
              token: r.token,
              email: r.email,
              name: r.name,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="card px-5 py-5 text-center">
      <div className={`text-3xl font-extrabold tracking-tight ${accent ? "text-green-dark" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-secondary sm:text-sm">{label}</div>
    </div>
  );
}
