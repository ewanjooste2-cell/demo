"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN" | "AGENT",
  });
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
