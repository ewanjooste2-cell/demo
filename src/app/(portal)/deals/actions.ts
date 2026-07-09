"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DEAL_STAGES } from "@/lib/format";

export async function advanceDealStage(dealId: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return;
  const idx = DEAL_STAGES.indexOf(deal.stage as (typeof DEAL_STAGES)[number]);
  if (idx < 0 || idx >= DEAL_STAGES.length - 1) return;
  const next = DEAL_STAGES[idx + 1];
  await prisma.deal.update({
    where: { id: dealId },
    data: { stage: next, closedAt: next === "REGISTERED" ? new Date() : deal.closedAt },
  });
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
}

const DOC_FLOW: Record<string, string> = {
  REQUIRED: "SENT",
  UPLOADED: "SENT",
  SENT: "SIGNED",
};

/** Move a document one step along required/uploaded → sent → signed. */
export async function progressDocument(docId: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  const doc = await prisma.dealDocument.findUnique({ where: { id: docId } });
  if (!doc) return;
  const next = DOC_FLOW[doc.status];
  if (!next) return;
  await prisma.dealDocument.update({ where: { id: docId }, data: { status: next } });
  revalidatePath(`/deals/${doc.dealId}`);
  revalidatePath("/deals");
}
