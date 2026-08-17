// Доступ к данным пользователя (аккаунт + прогресс) через Drizzle.

import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users, lessonProgress, quizAttempt, detectiveAttempt } from "./schema";

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

export async function createUser(email: string, passwordHash: string, name: string | null) {
  const db = await getDb();
  const id = randomUUID();
  await db.insert(users).values({ id, email: email.toLowerCase(), passwordHash, name });
  return { id, email: email.toLowerCase(), name };
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
