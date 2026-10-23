/**
 * Protection des pages (les API revérifient chacune la session en base).
 * - Espace client : rôle USER requis, sinon redirection /connexion.
 * - Back-office  : rôle ADMIN requis, sinon redirection /admin/connexion.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/server/auth-consts";

const CHEMINS_CLIENT = ["/tableau-de-bord", "/profil", "/credit", "/transfert", "/messages"];

async function roleFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.JWT_SECRET ?? "";
  if (!token || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: "mutuel-togo",
    });
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await roleFromRequest(request);

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/connexion") {
      if (role === "ADMIN")
        return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (role !== "ADMIN")
      return NextResponse.redirect(new URL("/admin/connexion", request.url));
    return NextResponse.next();
  }

  const espaceClient = CHEMINS_CLIENT.some(
    (c) => pathname === c || pathname.startsWith(`${c}/`)
  );
  if (espaceClient) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
    if (role !== "USER") {
      const url = new URL("/connexion", request.url);
      url.searchParams.set("retour", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tableau-de-bord/:path*",
    "/profil/:path*",
    "/credit/:path*",
    "/transfert/:path*",
    "/messages/:path*",
    "/admin/:path*",
  ],
};
