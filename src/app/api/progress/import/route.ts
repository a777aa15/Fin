import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserProgress,
  setLessonDone,
  saveQuizAttempt,
  saveCaseAttempt,
} from "@/lib/repo";

// Перенос гостевого прогресса (из localStorage) в аккаунт после входа/регистрации.
const schema = z.object({
  lessons: z.array(z.string()).optional(),
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
  const user = await getCurrentUser();
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

  for (const num of lessons) await setLessonDone(user.id, num, true);
  for (const [m, r] of Object.entries(quizzes)) await saveQuizAttempt(user.id, Number(m), r.score, r.total);
  for (const [m, r] of Object.entries(cases))
    await saveCaseAttempt(user.id, Number(m), r.found, r.totalFlags, r.falsePositives, r.verdictCorrect);

  const progress = await getUserProgress(user.id);
  return Response.json({ ok: true, progress });
}
