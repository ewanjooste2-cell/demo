"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED = new Set(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]);

export async function setShowingStatus(showingId: string, status: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!ALLOWED.has(status)) return;
  await prisma.showing.update({ where: { id: showingId }, data: { status } });
  revalidatePath("/showings");
}

export async function createShowing(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const listingId = String(formData.get("listingId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const kind = formData.get("kind") === "OPEN_HOUSE" ? "OPEN_HOUSE" : "PRIVATE";
  if (!listingId || !date || !time) return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;

  const startsAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startsAt.getTime())) return;
  const minutes = kind === "OPEN_HOUSE" ? 120 : 45;

  await prisma.showing.create({
    data: {
      listingId,
      leadId: leadId || null,
      agentId: listing.agentId ?? user.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + minutes * 60 * 1000),
      kind,
      status: "CONFIRMED",
    },
  });
  revalidatePath("/showings");
  redirect("/showings");
}
