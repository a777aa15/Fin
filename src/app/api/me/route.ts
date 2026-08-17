import { getCurrentUser } from "@/lib/auth";
import { getUserProgress } from "@/lib/repo";

// Текущий пользователь + его прогресс (или null для гостя).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null, progress: null });
  }
  const progress = await getUserProgress(user.id);
  return Response.json({ user, progress });
}
