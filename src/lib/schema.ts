// Схема БД (Drizzle, диалект PostgreSQL).
// В БД хранятся ТОЛЬКО пользовательские данные — аккаунты и прогресс.
// Контент курса read-only и лежит в src/content/data/*.json (SSG).

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // uuid
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  approved: boolean("approved").notNull().default(false), // доступ к курсу — после одобрения
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Заявки с формы записи на лендинге (лиды). Контакт может быть e-mail/телефон/telegram.
export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  contact: text("contact"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Запросы на сброс пароля (токен-ссылку админ передаёт пользователю).
export const passwordResets = pgTable("password_resets", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Посетители сайта (для конверсии). converted = оставил заявку/зарегистрировался.
export const visitors = pgTable("visitors", {
  visitorId: text("visitor_id").primaryKey(),
  converted: boolean("converted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    lessonNum: text("lesson_num").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userLesson: uniqueIndex("uq_lesson_user").on(t.userId, t.lessonNum),
  })
);

export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    moduleN: integer("module_n").notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userModule: uniqueIndex("uq_quiz_user_module").on(t.userId, t.moduleN),
  })
);

export const detectiveAttempt = pgTable(
  "detective_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    moduleN: integer("module_n").notNull(),
    found: integer("found").notNull(),
    totalFlags: integer("total_flags").notNull(),
    falsePositives: integer("false_positives").notNull(),
    verdictCorrect: boolean("verdict_correct").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userModule: uniqueIndex("uq_case_user_module").on(t.userId, t.moduleN),
  })
);

export type User = typeof users.$inferSelect;
