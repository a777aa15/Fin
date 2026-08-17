import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Жёсткий гейт: разделы курса доступны только авторизованным.
// Гостя перенаправляем на /login?next=<путь>. Проверка сессии — до рендера.

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("fa_session")?.value;
  if (await hasValidSession(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Гейтим только разделы курса. Публичны: /, /login, /register, /api/*, статика.
export const config = {
  matcher: [
    "/study",
    "/study/:path*",
    "/lesson/:path*",
    "/module/:path*",
    "/quiz/:path*",
    "/detective",
    "/detective/:path*",
    "/glossary",
    "/calculators",
  ],
};
