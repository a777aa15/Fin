import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { setLessonDone, saveQuizAttempt, saveCaseAttempt } from "@/lib/repo";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("lesson"), num: z.string(), done: z.boolean() }),
  z.object({ kind: z.literal("quiz"), moduleN: z.number().int(), score: z.number().int(), total: z.number().int() }),
  z.object({
    kind: z.literal("case"),
    moduleN: z.number().int(),
    found: z.number().int(),
    totalFlags: z.number().int(),
    falsePositives: z.number().int(),
    verdictCorrect: z.boolean(),
  }),
]);

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

  const data = parsed.data;
  if (data.kind === "lesson") {
    await setLessonDone(user.id, data.num, data.done);
  } else if (data.kind === "quiz") {
    await saveQuizAttempt(user.id, data.moduleN, data.score, data.total);
  } else {
    await saveCaseAttempt(
      user.id,
      data.moduleN,
      data.found,
      data.totalFlags,
      data.falsePositives,
      data.verdictCorrect
    );
  }
  return Response.json({ ok: true });
}
