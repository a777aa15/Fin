// Доступ к данным пользователя (аккаунт + прогресс) через Drizzle.

import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, leads, visitors, passwordResets, lessonProgress, quizAttempt, detectiveAttempt } from "./schema";

export type ProgressSnapshot = {
  lessons: string[];
  quizzes: Record<string, { score: number; total: number }>;
  cases: Record<
    string,
    { found: number; totalFlags: number; falsePositives: number; verdictCorrect: boolean }
  >;
};

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string | null,
  opts?: { approved?: boolean; isAdmin?: boolean }
) {
  const db = await getDb();
  const id = randomUUID();
  const approved = opts?.approved ?? false;
  const isAdmin = opts?.isAdmin ?? false;
  await db.insert(users).values({ id, email: email.toLowerCase(), passwordHash, name, approved, isAdmin });
  return { id, email: email.toLowerCase(), name, approved, isAdmin };
}

export async function getUserById(id: string) {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

// Одобрить/отозвать доступ к курсу.
export async function setUserApproved(userId: string, approved: boolean) {
  const db = await getDb();
  await db.update(users).set({ approved }).where(eq(users.id, userId));
}

// Синхронизировать флаги (для email из ADMIN_EMAILS — авто-админ и доступ).
export async function updateUserAccess(userId: string, patch: { approved?: boolean; isAdmin?: boolean }) {
  const db = await getDb();
  await db.update(users).set(patch).where(eq(users.id, userId));
}

export async function listUsers() {
  const db = await getDb();
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      approved: users.approved,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

// Заявка. Одна на e-mail: если такой email уже есть — не дублируем.
export async function createLead(data: {
  name: string | null;
  email: string | null;
  contact: string | null;
  note: string | null;
}): Promise<{ duplicate: boolean }> {
  const db = await getDb();
  const email = data.email ? data.email.trim().toLowerCase() : null;
  if (email) {
    const existing = await db.select({ id: leads.id }).from(leads).where(eq(leads.email, email)).limit(1);
    if (existing.length) return { duplicate: true };
  }
  try {
    await db.insert(leads).values({ id: randomUUID(), name: data.name, email, contact: data.contact, note: data.note });
  } catch {
    // гонка: сработал уникальный индекс по email
    return { duplicate: true };
  }
  return { duplicate: false };
}

// ---------- Сброс пароля ----------
export async function createPasswordReset(userId: string): Promise<string> {
  const db = await getDb();
  const token = (randomUUID() + randomUUID()).replace(/-/g, "");
  await db.insert(passwordResets).values({ token, userId });
  return token;
}

export async function getValidReset(token: string) {
  const db = await getDb();
  const rows = await db.select().from(passwordResets).where(eq(passwordResets.token, token)).limit(1);
  const r = rows[0];
  if (!r || r.used) return null;
  if (Date.now() - new Date(r.createdAt).getTime() > 24 * 60 * 60 * 1000) return null; // 24 ч
  return r;
}

export async function consumeReset(token: string) {
  const db = await getDb();
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.token, token));
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const db = await getDb();
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function listPendingResets() {
  const db = await getDb();
  return db
    .select({
      token: passwordResets.token,
      createdAt: passwordResets.createdAt,
      email: users.email,
      name: users.name,
    })
    .from(passwordResets)
    .leftJoin(users, eq(passwordResets.userId, users.id))
    .where(eq(passwordResets.used, false))
    .orderBy(desc(passwordResets.createdAt));
}

export async function listLeads() {
  const db = await getDb();
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

// ---------- Посетители / конверсия ----------
export async function trackVisitor(visitorId: string) {
  const db = await getDb();
  await db.insert(visitors).values({ visitorId }).onConflictDoNothing({ target: visitors.visitorId });
}

export async function markVisitorConverted(visitorId: string) {
  const db = await getDb();
  // upsert: если посетителя ещё нет (напр. пришёл без беакона) — создаём сразу с конверсией
  await db
    .insert(visitors)
    .values({ visitorId, converted: true })
    .onConflictDoUpdate({ target: visitors.visitorId, set: { converted: true } });
}

export async function getVisitorStats(): Promise<{ total: number; converted: number }> {
  const db = await getDb();
  const rows = await db.select({ converted: visitors.converted }).from(visitors);
  return { total: rows.length, converted: rows.filter((r) => r.converted).length };
}

export async function getUserProgress(userId: string): Promise<ProgressSnapshot> {
  const db = await getDb();
  const [lessons, quizzes, cases] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(quizAttempt).where(eq(quizAttempt.userId, userId)),
    db.select().from(detectiveAttempt).where(eq(detectiveAttempt.userId, userId)),
  ]);
  return {
    lessons: lessons.map((l) => l.lessonNum),
    quizzes: Object.fromEntries(
      quizzes.map((q) => [String(q.moduleN), { score: q.score, total: q.total }])
    ),
    cases: Object.fromEntries(
      cases.map((c) => [
        String(c.moduleN),
        {
          found: c.found,
          totalFlags: c.totalFlags,
          falsePositives: c.falsePositives,
          verdictCorrect: c.verdictCorrect,
        },
      ])
    ),
  };
}

export async function setLessonDone(userId: string, lessonNum: string, done: boolean) {
  const db = await getDb();
  if (done) {
    await db
      .insert(lessonProgress)
      .values({ id: randomUUID(), userId, lessonNum })
      .onConflictDoNothing({ target: [lessonProgress.userId, lessonProgress.lessonNum] });
  } else {
    await db
      .delete(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonNum, lessonNum)));
  }
}

export async function saveQuizAttempt(userId: string, moduleN: number, score: number, total: number) {
  const db = await getDb();
  await db
    .insert(quizAttempt)
    .values({ id: randomUUID(), userId, moduleN, score, total })
    .onConflictDoUpdate({
      target: [quizAttempt.userId, quizAttempt.moduleN],
      set: {
        // сохраняем лучший результат
        score: sql`GREATEST(${quizAttempt.score}, excluded.score)`,
        total: sql`excluded.total`,
        updatedAt: sql`now()`,
      },
    });
}

export async function saveCaseAttempt(
  userId: string,
  moduleN: number,
  found: number,
  totalFlags: number,
  falsePositives: number,
  verdictCorrect: boolean
) {
  const db = await getDb();
  await db
    .insert(detectiveAttempt)
    .values({ id: randomUUID(), userId, moduleN, found, totalFlags, falsePositives, verdictCorrect })
    .onConflictDoUpdate({
      target: [detectiveAttempt.userId, detectiveAttempt.moduleN],
      set: {
        found: sql`excluded.found`,
        totalFlags: sql`excluded.total_flags`,
        falsePositives: sql`excluded.false_positives`,
        verdictCorrect: sql`excluded.verdict_correct`,
        updatedAt: sql`now()`,
      },
    });
}
