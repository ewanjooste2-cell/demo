import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "./auth";

export async function getUserOrRedirect(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getUserOrRedirect();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Prisma where-clause fragment scoping data to the signed-in agent (admins see all). */
export function agentScope(user: SessionUser) {
  return user.role === "ADMIN" ? {} : { agentId: user.id };
}
