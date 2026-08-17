// Подключение к БД через Drizzle.
// Локально (без DATABASE_URL или file:) — PGlite (Postgres в WASM, без сервера).
// На проде — обычный Postgres через postgres-js (DATABASE_URL=postgres://…).
// Схема идентична: везде диалект PostgreSQL, код запросов один и тот же.

import "server-only";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

type DrizzleDb = Awaited<ReturnType<typeof createDb>>;

async function createDb() {
  const url = process.env.DATABASE_URL || "";
  const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");

  if (isPostgres) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 5 });
    return drizzle(client, { schema });
  }

  // PGlite: данные в каталоге на диске (по умолчанию ./.pglite-data)
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR || "./.pglite-data";
  const client = new PGlite(dir);
  return drizzle(client, { schema });
}

// Идемпотентное создание таблиц (без drizzle-kit — одинаково для PGlite и Postgres).
async function ensureSchema(db: DrizzleDb) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      name text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  // Гейт доступа: колонки могли отсутствовать в уже созданной таблице.
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leads (
      id text PRIMARY KEY,
      name text,
      email text NOT NULL,
      contact text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      lesson_num text NOT NULL,
      done_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_user ON lesson_progress (user_id, lesson_num);`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS quiz_attempt (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      module_n integer NOT NULL,
      score integer NOT NULL,
      total integer NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_user_module ON quiz_attempt (user_id, module_n);`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS detective_attempt (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      module_n integer NOT NULL,
      found integer NOT NULL,
      total_flags integer NOT NULL,
      false_positives integer NOT NULL,
      verdict_correct boolean NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_case_user_module ON detective_attempt (user_id, module_n);`);
}

// Мемоизированный синглтон (переживает hot-reload в dev через globalThis).
const globalForDb = globalThis as unknown as {
  __dbPromise?: Promise<DrizzleDb>;
};

export function getDb(): Promise<DrizzleDb> {
  if (!globalForDb.__dbPromise) {
    globalForDb.__dbPromise = (async () => {
      const db = await createDb();
      await ensureSchema(db);
      return db;
    })();
  }
  return globalForDb.__dbPromise;
}

export { schema };
