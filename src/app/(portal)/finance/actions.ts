"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function markPayoutPaid(dealId: string) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.stage !== "REGISTERED") return;
  await prisma.deal.update({ where: { id: dealId }, data: { payoutStatus: "PAID" } });
  revalidatePath("/finance");
}
