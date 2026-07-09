"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/notify";

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
  const agentId = listing.agentId ?? user.id;
  // Booking your own showing confirms it; booking on behalf of another agent
  // opens a request and emails them.
  const isOwn = agentId === user.id;

  const showing = await prisma.showing.create({
    data: {
      listingId,
      leadId: leadId || null,
      agentId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + minutes * 60 * 1000),
      kind,
      status: isOwn ? "CONFIRMED" : "REQUESTED",
    },
    include: { agent: true, lead: { select: { name: true } } },
  });

  if (!isOwn) {
    const when = startsAt.toLocaleString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    await sendEmail(
      showing.agent,
      `Showing request: ${listing.title} — ${when}`,
      `Hi ${showing.agent.name.split(" ")[0]}, you have been requested for a ${
        kind === "OPEN_HOUSE" ? "open house" : "showing"
      }: ${listing.title}, ${listing.suburb} — ${when}${
        showing.lead ? ` (buyer: ${showing.lead.name})` : ""
      }. Open the portal to confirm or decline.`
    );
  }

  revalidatePath("/showings");
  redirect("/showings");
}
