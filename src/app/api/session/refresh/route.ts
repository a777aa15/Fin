import { getCurrentUser, signSession, setSessionCookie, isAdminEmail } from "@/lib/auth";
import { getUserById, updateUserAccess } from "@/lib/repo";

// Перечитать статус пользователя из БД и переподписать сессию.
// Нужен, чтобы после одобрения админом доступ появился без повторного входа.
export async function POST() {
  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const user = await getUserById(current.id);
  if (!user) return Response.json({ error: "Пользователь не найден" }, { status: 404 });

  let approved = user.approved;
  let isAdmin = user.isAdmin;
  if (isAdminEmail(user.email) && (!approved || !isAdmin)) {
    approved = true;
    isAdmin = true;
    await updateUserAccess(user.id, { approved: true, isAdmin: true });
  }

  const token = await signSession({ id: user.id, email: user.email, name: user.name, approved, isAdmin });
  await setSessionCookie(token);
  return Response.json({ approved, isAdmin });
}
