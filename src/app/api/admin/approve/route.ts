import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth";
import { setUserApproved, getUserById } from "@/lib/repo";
import { sendAccessGranted, sendInBackground } from "@/lib/emails";

// Одобрить/отозвать доступ пользователя. Только для админа.
const schema = z.object({
  userId: z.string().min(1),
  approved: z.boolean(),
});

export async function POST(req: Request) {
  // Права админа сверяются с БД — отзыв админки действует сразу.
  const me = await getVerifiedUser();
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

  // Письмо об открытии доступа шлём только при переходе «не одобрен → одобрен».
  const before = await getUserById(parsed.data.userId);
  await setUserApproved(parsed.data.userId, parsed.data.approved);

  if (parsed.data.approved && before && !before.approved) {
    sendInBackground(() => sendAccessGranted({ email: before.email, name: before.name }));
  }

  return Response.json({ ok: true });
}
