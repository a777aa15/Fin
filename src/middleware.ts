import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

// Гейт доступа:
//  • разделы курса — только авторизованным И одобренным (иначе → /pending);
//  • /admin — только админам;
//  • неавторизованный → /login?next=<путь>.
// Проверка сессии — до рендера, по подписанному JWT-cookie.

async function readSession(token: string | undefined): Promise<JWTPayload | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const payload = await readSession(req.cookies.get("fa_session")?.value);
  const path = req.nextUrl.pathname;

  const toLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  };

  // Админка
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!payload) return toLogin();
    if (payload.admin !== true) return NextResponse.redirect(new URL("/study", req.url));
    return NextResponse.next();
  }

  // Разделы курса
  if (!payload) return toLogin();
  if (payload.approved !== true) {
    return NextResponse.redirect(new URL("/pending", req.url));
  }
  return NextResponse.next();
}

// Гейтим разделы курса + админку. Публичны: /, /login, /register, /pending, /api/*, статика.
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
    "/admin",
    "/admin/:path*",
  ],
};
