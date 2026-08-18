"use client";

import { useState } from "react";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  approved: boolean;
  isAdmin: boolean;
  createdAt: string;
};
export type AdminLead = {
  id: string;
  name: string | null;
  email: string | null;
  contact: string | null;
  note: string | null;
  createdAt: string;
};
export type AdminReset = {
  token: string;
  email: string | null;
  name: string | null;
  createdAt: string;
};

function fmt(d: string) {
  try {
    return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

export function AdminClient({
  users: initialUsers,
  leads,
  resets,
}: {
  users: AdminUser[];
  leads: AdminLead[];
  resets: AdminReset[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyResetLink = async (token: string) => {
    const link = `${window.location.origin}/reset?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Скопируйте ссылку для сброса пароля:", link);
    }
    setCopied(token);
    setTimeout(() => setCopied((t) => (t === token ? null : t)), 2000);
  };

  const setApproved = async (id: string, approved: boolean) => {
    setBusy(id);
    // оптимистично
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, approved } : u)));
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, approved }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // откат
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, approved: !approved } : u)));
    } finally {
      setBusy(null);
    }
  };

  const pending = users.filter((u) => !u.approved && !u.isAdmin).length;

  return (
    <div className="space-y-10">
      {/* Пользователи */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Пользователи <span className="text-ink-muted">({users.length})</span>
          </h2>
          {pending > 0 ? (
            <span className="rounded-full bg-amber-light px-3 py-1 text-xs font-semibold text-amber">
              Ждут одобрения: {pending}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-grey-light text-left text-ink-secondary">
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-ink">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-ink-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{fmt(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin ? (
                      <span className="rounded-full bg-green-light px-2.5 py-1 text-xs font-semibold text-green-dark">Админ</span>
                    ) : u.approved ? (
                      <span className="rounded-full bg-green-light px-2.5 py-1 text-xs font-semibold text-green-dark">Доступ открыт</span>
                    ) : (
                      <span className="rounded-full bg-amber-light px-2.5 py-1 text-xs font-semibold text-amber">На рассмотрении</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isAdmin ? (
                      <span className="text-ink-muted">—</span>
                    ) : u.approved ? (
                      <button
                        onClick={() => setApproved(u.id, false)}
                        disabled={busy === u.id}
                        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-ink-secondary hover:border-bad hover:text-bad disabled:opacity-50"
                      >
                        Отозвать
                      </button>
                    ) : (
                      <button
                        onClick={() => setApproved(u.id, true)}
                        disabled={busy === u.id}
                        className="rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-on-green hover:bg-green-dark disabled:opacity-50"
                      >
                        Одобрить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Заявки с формы */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-ink">
          Заявки с сайта <span className="text-ink-muted">({leads.length})</span>
        </h2>
        {leads.length === 0 ? (
          <p className="text-sm text-ink-muted">Пока заявок нет.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-grey-light text-left text-ink-secondary">
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Контакт</th>
                  <th className="px-4 py-3 font-medium">Цель</th>
                  <th className="px-4 py-3 font-medium">Когда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-ink">{l.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-secondary">{l.email || "—"}</td>
                    <td className="px-4 py-3 text-ink-secondary">{l.contact || "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-ink-muted" title={l.note || ""}>{l.note || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{fmt(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Запросы на сброс пароля */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-ink">
          Сбросы пароля <span className="text-ink-muted">({resets.length})</span>
        </h2>
        <p className="mb-4 text-sm text-ink-muted">
          Скопируйте ссылку и отправьте её пользователю — по ней он задаст новый пароль. Ссылка действует 24 часа.
        </p>
        {resets.length === 0 ? (
          <p className="text-sm text-ink-muted">Активных запросов нет.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-grey-light text-left text-ink-secondary">
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Запрошено</th>
                  <th className="px-4 py-3 font-medium text-right">Ссылка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resets.map((r) => (
                  <tr key={r.token}>
                    <td className="px-4 py-3 text-ink">{r.email || "—"}{r.name ? ` (${r.name})` : ""}</td>
                    <td className="px-4 py-3 text-ink-muted">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyResetLink(r.token)}
                        className="rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-on-green hover:bg-green-dark"
                      >
                        {copied === r.token ? "Скопировано ✓" : "Скопировать ссылку"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
