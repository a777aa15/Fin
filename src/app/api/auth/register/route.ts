import { z } from "zod";
import { cookies } from "next/headers";
import { hashPassword, signSession, setSessionCookie, isAdminEmail } from "@/lib/auth";
import { createUser, findUserByEmail, markVisitorConverted } from "@/lib/repo";
import { VISITOR_COOKIE } from "@/app/api/track/route";
import { sendRegistrationReceived, sendInBackground } from "@/lib/emails";

const schema = z.object({
  email: z.email("Некорректный e-mail"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  name: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Ошибка данных" }, { status: 400 });
  }
  const { email, password, name } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return Response.json({ error: "Пользователь с таким e-mail уже существует" }, { status: 409 });
  }

  const admin = isAdminEmail(email);
  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, name ?? null, { approved: admin, isAdmin: admin });
  const token = await signSession({
    id: user.id,
    email: user.email,
    name: user.name,
    approved: user.approved,
    isAdmin: user.isAdmin,
  });
  await setSessionCookie(token);

  // регистрация = конверсия посетителя
  const vid = (await cookies()).get(VISITOR_COOKIE)?.value;
  if (vid) await markVisitorConverted(vid);

  // Письмо «заявка принята» — только тем, кто ждёт одобрения (админу не нужно).
  // Отправка фоном, чтобы регистрация завершалась мгновенно.
  if (!user.approved) {
    sendInBackground(() => sendRegistrationReceived({ email: user.email, name: user.name }));
  }

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, approved: user.approved, isAdmin: user.isAdmin },
  });
}
