"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/format";

async function requireLeadAccess(leadId: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (user.role !== "ADMIN" && lead.agentId !== user.id) throw new Error("Not your lead");
  return { user, lead };
}

export async function updateLeadStatus(leadId: string, status: string) {
  if (!LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) return;
  const { user } = await requireLeadAccess(leadId);
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  await prisma.leadNote.create({
    data: { leadId, userId: user.id, body: `Status changed to ${status.toLowerCase()}.` },
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function addLeadNote(leadId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const { user } = await requireLeadAccess(leadId);
  await prisma.leadNote.create({ data: { leadId, userId: user.id, body } });
  revalidatePath(`/leads/${leadId}`);
}

export async function assignLead(leadId: string, formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return;
  const agentId = String(formData.get("agentId") ?? "") || null;
  await prisma.lead.update({ where: { id: leadId }, data: { agentId } });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function createLead(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const listingId = String(formData.get("listingId") ?? "") || null;

  let agentId: string | null = user.role === "ADMIN" ? null : user.id;
  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    agentId = listing?.agentId ?? agentId;
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      message: String(formData.get("message") ?? "").trim() || null,
      source: "MANUAL",
      listingId,
      agentId,
    },
  });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}
