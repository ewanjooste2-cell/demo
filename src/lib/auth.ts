import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";

const COOKIE_NAME = "portal_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as "ADMIN" | "AGENT",
    };
  } catch {
    return null;
  }
});

/** Returns the session or throws a redirect-worthy null; verify user still active. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) throw new Error("UNAUTHENTICATED");
  return session;
}
