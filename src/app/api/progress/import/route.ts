import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth";
import {
  getUserProgress,
  setLessonDone,
  saveQuizAttempt,
  saveCaseAttempt,
} from "@/lib/repo";

// Перенос гостевого прогресса (из localStorage) в аккаунт после входа/регистрации.
// Доступен и до одобрения: гость мог проходить уроки до открытия доступа.
// Размеры ограничены — чтобы нельзя было залить в БД произвольный объём.
const schema = z.object({
  lessons: z.array(z.string().max(16)).max(300).optional(),
  quizzes: z.record(z.string(), z.object({ score: z.number(), total: z.number() })).optional(),
  cases: z
    .record(
      z.string(),
      z.object({
        found: z.number(),
        totalFlags: z.number(),
        falsePositives: z.number(),
        verdictCorrect: z.boolean(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const user = await getVerifiedUser();
  if (!user) return Response.json({ error: "Требуется вход" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Ошибка данных" }, { status: 400 });

  const { lessons = [], quizzes = {}, cases = {} } = parsed.data;
  if (Object.keys(quizzes).length > 100 || Object.keys(cases).length > 100) {
    return Response.json({ error: "Слишком много записей" }, { status: 400 });
  }

  for (const num of lessons) await setLessonDone(user.id, num, true);
  for (const [m, r] of Object.entries(quizzes)) await saveQuizAttempt(user.id, Number(m), r.score, r.total);
  for (const [m, r] of Object.entries(cases))
    await saveCaseAttempt(user.id, Number(m), r.found, r.totalFlags, r.falsePositives, r.verdictCorrect);

  const progress = await getUserProgress(user.id);
  return Response.json({ ok: true, progress });
}
