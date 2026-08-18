import { z } from "zod";
import { findUserByEmail, createPasswordReset } from "@/lib/repo";
import { sendMail } from "@/lib/mailer";

// Запрос на сброс пароля. Создаёт токен и отправляет ссылку письмом (если настроен SMTP).
// Если SMTP не настроен — токен всё равно виден админу в /admin (ручная передача).
// Ответ всегда одинаковый — не раскрываем, существует ли аккаунт.
const schema = z.object({ email: z.string().trim().email("Некорректный e-mail") });

function baseUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

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

  const user = await findUserByEmail(parsed.data.email);
  if (user) {
    const token = await createPasswordReset(user.id);
    const link = `${baseUrl(req)}/reset?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Сброс пароля — Финансовый аналитик",
      text: `Здравствуйте! Вы запросили сброс пароля.\n\nПерейдите по ссылке, чтобы задать новый пароль (действует 24 часа):\n${link}\n\nЕсли вы не запрашивали сброс — просто проигнорируйте это письмо.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
          <h2 style="color:#1F7A3D">Сброс пароля</h2>
          <p>Вы запросили сброс пароля на курсе «Финансовый аналитик».</p>
          <p>Нажмите кнопку, чтобы задать новый пароль. Ссылка действует 24 часа.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#1F7A3D;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Задать новый пароль</a>
          </p>
          <p style="color:#666;font-size:13px">Если кнопка не работает, откройте ссылку:<br><a href="${link}">${link}</a></p>
          <p style="color:#666;font-size:13px">Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
        </div>`,
    });
  }
  return Response.json({ ok: true });
}
