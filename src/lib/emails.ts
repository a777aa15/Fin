import "server-only";
import { sendMail } from "./mailer";
import { siteUrl } from "./site";

// Письма курса: уведомление админу о заявке и статусные письма пользователю.
// Все отправки «мягкие»: если SMTP не настроен или почта недоступна —
// основной сценарий (заявка/регистрация/одобрение) всё равно завершается успешно.

// Отправка письма в фоне: SMTP-сессия занимает несколько секунд, и ждать её
// в HTTP-ответе нельзя — пользователь смотрел бы на «Отправляем…» ~10 секунд.
// Сервер долгоживущий (не serverless), поэтому промис спокойно доработает после ответа.
export function sendInBackground(task: () => Promise<void>): void {
  void task().catch((e) => console.error("[email]", (e as Error).message));
}

// Кому слать уведомления: NOTIFY_EMAIL, иначе первый из ADMIN_EMAILS.
function adminRecipient(): string | null {
  const explicit = process.env.NOTIFY_EMAIL?.trim();
  if (explicit) return explicit;
  const first = (process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
  return first || null;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Общая обёртка письма в стилистике курса.
function layout(title: string, bodyHtml: string, cta?: { text: string; href: string }): string {
  return `
  <div style="background:#f4f6f5;padding:28px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e7e5">
      <div style="background:#14181c;padding:18px 24px">
        <span style="color:#86e5b1;font-weight:700;font-size:15px">Финансовый аналитик</span>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 14px;font-size:19px;color:#14181c">${esc(title)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3d4650">${bodyHtml}</div>
        ${
          cta
            ? `<p style="margin:24px 0 4px">
                 <a href="${cta.href}" style="background:#1F7A3D;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;display:inline-block">${esc(cta.text)}</a>
               </p>`
            : ""
        }
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e3e7e5;font-size:12px;color:#8b949c">
        Онлайн-курс «Финансовый аналитик» · <a href="${siteUrl()}" style="color:#1F7A3D">${siteUrl().replace(/^https?:\/\//, "")}</a>
      </div>
    </div>
  </div>`;
}

// 1. Админу — новая заявка с сайта.
export async function notifyAdminNewLead(lead: {
  name: string | null;
  email: string | null;
  contact: string | null;
  note: string | null;
}): Promise<void> {
  const to = adminRecipient();
  if (!to) return;
  const rows = [
    ["Имя", lead.name],
    ["E-mail", lead.email],
    ["Контакт", lead.contact],
    ["Цель", lead.note],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8b949c">${k}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`
    )
    .join("");

  await sendMail({
    to,
    subject: `Новая заявка с сайта${lead.name ? `: ${lead.name}` : ""}`,
    text: `Новая заявка.\nИмя: ${lead.name ?? "—"}\nE-mail: ${lead.email ?? "—"}\nКонтакт: ${lead.contact ?? "—"}\nЦель: ${lead.note ?? "—"}\n\nВсе заявки: ${siteUrl()}/admin`,
    html: layout(
      "Новая заявка с сайта",
      `<table style="border-collapse:collapse;font-size:15px">${rows}</table>`,
      { text: "Открыть админку", href: `${siteUrl()}/admin` }
    ),
  });
}

// 2. Пользователю — регистрация принята, доступ открывается вручную.
export async function sendRegistrationReceived(user: { email: string; name: string | null }): Promise<void> {
  await sendMail({
    to: user.email,
    subject: "Заявка на курс принята — Финансовый аналитик",
    text: `Здравствуйте${user.name ? `, ${user.name}` : ""}!\n\nВы зарегистрировались на курсе «Финансовый аналитик». Доступ открывается вручную — после подтверждения заявки или оплаты. Мы свяжемся с вами в ближайшее время.\n\nСтраница статуса: ${siteUrl()}/pending`,
    html: layout(
      "Заявка принята",
      `<p>Здравствуйте${user.name ? `, ${esc(user.name)}` : ""}!</p>
       <p>Вы зарегистрировались на курсе «Финансовый аналитик». Доступ открывается вручную —
       после подтверждения заявки или оплаты. Мы свяжемся с вами в ближайшее время.</p>
       <p style="color:#8b949c;font-size:14px">Когда доступ откроют, вы получите письмо — и курс сразу станет доступен в вашем аккаунте.</p>`,
      { text: "Проверить статус", href: `${siteUrl()}/pending` }
    ),
  });
}

// 3. Пользователю — доступ к курсу открыт.
export async function sendAccessGranted(user: { email: string; name: string | null }): Promise<void> {
  await sendMail({
    to: user.email,
    subject: "Доступ к курсу открыт — Финансовый аналитик",
    text: `Здравствуйте${user.name ? `, ${user.name}` : ""}!\n\nДоступ к курсу «Финансовый аналитик» открыт. 15 модулей, 148 уроков, тесты, калькуляторы, тренажёр «Финансовый детектив» и ИИ-наставник уже ждут вас.\n\nНачать: ${siteUrl()}/study`,
    html: layout(
      "Доступ к курсу открыт",
      `<p>Здравствуйте${user.name ? `, ${esc(user.name)}` : ""}!</p>
       <p>Доступ к курсу открыт. Вам уже доступны 15 модулей и 148 уроков, тесты с автопроверкой,
       финансовые калькуляторы, тренажёр «Финансовый детектив» и личный ИИ-наставник.</p>
       <p>Прогресс сохраняется в аккаунте — можно учиться с любого устройства.</p>`,
      { text: "Начать обучение", href: `${siteUrl()}/study` }
    ),
  });
}
