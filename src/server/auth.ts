/**
 * Authentification par session JWT signee, stockee dans un cookie httpOnly.
 * - Mot de passe : bcrypt (jamais stocke ni renvoye en clair).
 * - Le cookie n'est pas lisible par le JavaScript du navigateur (httpOnly).
 */
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import { ApiError } from "./http";
import { ROLES } from "@/lib/constants";
import { SESSION_COOKIE } from "./auth-consts";

export { SESSION_COOKIE };
const SESSION_DUREE_JOURS = 7;

export interface SessionUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: string;
  balanceFcfa: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function jwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length < 32 || secret.startsWith("remplacez-par")) {
    throw new ApiError(
      500,
      "Configuration serveur incomplete : JWT_SECRET manquant dans .env.local (voir .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: { id: string; role: string }): Promise<void> {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DUREE_JOURS}d`)
    .setIssuer("mutuel-togo")
    .sign(jwtSecretKey());

  const cookieStore = await cookies();
  // Cookie Secure quand la requête arrive en HTTPS (production / proxy).
  // En test local sur le Wi-Fi (http://192.168.x.x), un cookie Secure serait
  // rejeté par les téléphones : forcez COOKIE_SECURE=true dès que le site
  // est servi en HTTPS en production.
  const headerStore = await headers();
  const proto = (headerStore.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const forceSecure = (process.env.COOKIE_SECURE ?? "").trim().toLowerCase();
  const secure =
    forceSecure === "true" ? true : forceSecure === "false" ? false : proto === "https";
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_DUREE_JOURS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const USER_SELECT = `
  id,
  full_name AS "fullName",
  phone,
  email,
  role,
  balance_fcfa AS "balanceFcfa",
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"`;

export interface UserRowWithPassword extends SessionUser {
  passwordHash: string;
}

export async function findUserByPhone(
  phone: string
): Promise<UserRowWithPassword | null> {
  return queryOne<UserRowWithPassword>(
    `SELECT ${USER_SELECT}, password_hash AS "passwordHash" FROM users WHERE phone = $1`,
    [phone]
  );
}

export async function findUserByEmail(
  email: string
): Promise<UserRowWithPassword | null> {
  return queryOne<UserRowWithPassword>(
    `SELECT ${USER_SELECT}, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
}

export async function findUserById(id: string): Promise<SessionUser | null> {
  return queryOne<SessionUser>(`SELECT ${USER_SELECT} FROM users WHERE id = $1`, [id]);
}

/** Utilisateur connecte (ou null). Re-verifie toujours en base que le compte existe et est actif. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey(), { issuer: "mutuel-togo" });
    if (!payload.sub) return null;
    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Session expirée. Reconnectez-vous.");
  if (user.role !== ROLES.USER)
    throw new ApiError(403, "Cet espace est réservé aux clients MUTUEL TOGO.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Session expirée. Reconnectez-vous.");
  if (user.role !== ROLES.ADMIN)
    throw new ApiError(403, "Accès réservé à l'administration MUTUEL TOGO.");
  return user;
}

export function publicUser(user: SessionUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    balanceFcfa: user.balanceFcfa,
    createdAt: user.createdAt,
  };
}
