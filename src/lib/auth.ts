// Аутентификация: пароли (bcrypt) + сессия в подписанном JWT-cookie (jose).
// Своя реализация вместо Auth.js — pure-JS, без внешних зависимостей от провайдеров,
// деплоится на любой хостинг с Node.

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "fa_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET не задан (см. .env.local)");
  return new TextEncoder().encode(secret);
}

export type SessionUser = { id: string; email: string; name: string | null };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

// Флаг Secure: по HTTP браузер отбрасывает Secure-куку, поэтому его можно
// отключить через COOKIE_SECURE=false (для деплоя без HTTPS). По умолчанию —
// как раньше (secure в проде). Когда подключим HTTPS/домен — ставим COOKIE_SECURE=true.
function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === "true";
  }
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
