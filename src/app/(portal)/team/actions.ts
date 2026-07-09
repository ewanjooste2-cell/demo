"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const STATUSES = new Set(["TODO", "DOING", "DONE"]);

export async function setTaskStatus(taskId: string, status: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!STATUSES.has(status)) return;
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/team");
}

export async function createTask(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const assigneeId = String(formData.get("assigneeId") ?? "");
  const dueAt = String(formData.get("dueAt") ?? "");
  await prisma.task.create({
    data: {
      title,
      assigneeId: assigneeId || user.id,
      dueAt: dueAt ? new Date(`${dueAt}T17:00:00`) : null,
    },
  });
  revalidatePath("/team");
}
