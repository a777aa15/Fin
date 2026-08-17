import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { setUserApproved } from "@/lib/repo";

// Одобрить/отозвать доступ пользователя. Только для админа.
const schema = z.object({
  userId: z.string().min(1),
  approved: z.boolean(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) return Response.json({ error: "Доступ запрещён" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Ошибка данных" }, { status: 400 });
  }

  await setUserApproved(parsed.data.userId, parsed.data.approved);
  return Response.json({ ok: true });
}
