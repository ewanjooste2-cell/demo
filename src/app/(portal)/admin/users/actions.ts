"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdminSession() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return user;
}

export async function createUser(_prev: { error?: string } | undefined, formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "AGENT") === "ADMIN" ? "ADMIN" : "AGENT";
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "") || null;

  if (!name || !email || password.length < 8) {
    return { error: "Name, email and a password of at least 8 characters are required." };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "A user with that email already exists." };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      calendarToken: `cal-${crypto.randomUUID()}`,
    },
  });
  revalidatePath("/admin/users");
  return {};
}

export async function toggleUserActive(userId: string) {
  const admin = await requireAdminSession();
  if (userId === admin.id) return; // can't deactivate yourself
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  revalidatePath("/admin/users");
}

export async function resetPassword(userId: string, formData: FormData) {
  await requireAdminSession();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return;
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/admin/users");
}
