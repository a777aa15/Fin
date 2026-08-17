import { z } from "zod";
import { verifyPassword, signSession, setSessionCookie, isAdminEmail } from "@/lib/auth";
import { findUserByEmail, updateUserAccess } from "@/lib/repo";

const schema = z.object({
  email: z.email("Некорректный e-mail"),
  password: z.string().min(1, "Введите пароль"),
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
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Неверный e-mail или пароль" }, { status: 401 });
  }

  // Email из ADMIN_EMAILS — авто-админ и доступ (в т.ч. для ранее созданного аккаунта).
  let approved = user.approved;
  let isAdmin = user.isAdmin;
  if (isAdminEmail(user.email) && (!approved || !isAdmin)) {
    approved = true;
    isAdmin = true;
    await updateUserAccess(user.id, { approved: true, isAdmin: true });
  }

  const token = await signSession({ id: user.id, email: user.email, name: user.name, approved, isAdmin });
  await setSessionCookie(token);

  return Response.json({ user: { id: user.id, email: user.email, name: user.name, approved, isAdmin } });
}
