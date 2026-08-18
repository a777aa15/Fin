import "server-only";
import nodemailer from "nodemailer";

// Отправка почты по SMTP (Gmail/Яндекс/Mail.ru и т.п.).
// Настраивается через env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
// Если не настроено — sendMail возвращает false (ничего не шлём, работает ручной фолбэк).

type Transport = nodemailer.Transporter;
const g = globalThis as unknown as { __mailer?: Transport | null };

function getTransport(): Transport | null {
  if (g.__mailer !== undefined) return g.__mailer;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    g.__mailer = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  g.__mailer = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });
  return g.__mailer;
}

export function isMailerConfigured(): boolean {
  return getTransport() !== null;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const t = getTransport();
  if (!t) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    await t.sendMail({ from, ...opts });
    return true;
  } catch (e) {
    console.error("[mailer] send failed:", (e as Error).message);
    return false;
  }
}
