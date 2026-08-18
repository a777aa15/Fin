import { getVerifiedUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/repo";

// Текущий пользователь + его прогресс (или null для гостя).
// Статус доступа сверяется с БД (getVerifiedUser), поэтому одобрение и отзыв
// вступают в силу при первой же загрузке любой страницы.
export async function GET() {
  const user = await getVerifiedUser();
  if (!user) {
    return Response.json({ user: null, progress: null });
  }
  const progress = await getUserProgress(user.id);
  return Response.json({ user, progress });
}
