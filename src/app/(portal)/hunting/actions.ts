"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/notify";
import { HUNT_STATUSES, HUNT_STATUS_LABELS } from "@/lib/format";

async function requireHuntAccess(huntId: string) {
  const user = await getSession();
  if (!user) redirect("/login");
  const hunt = await prisma.hunt.findUnique({ where: { id: huntId } });
  if (!hunt) throw new Error("Hunt not found");
  if (user.role !== "ADMIN" && hunt.agentId !== user.id && hunt.createdById !== user.id) {
    throw new Error("Not your hunt");
  }
  return { user, hunt };
}

export async function createHunt(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const address = String(formData.get("address") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerPhone = String(formData.get("ownerPhone") ?? "").trim() || null;
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim() || null;
  if (!address || !ownerName) return { error: "Property address and owner name are required." };
  if (!ownerPhone && !ownerEmail) {
    return { error: "Add at least one way to reach the owner (phone or email)." };
  }

  const agentId = String(formData.get("agentId") ?? "") || null;

  const hunt = await prisma.hunt.create({
    data: {
      address,
      suburb: String(formData.get("suburb") ?? "").trim() || null,
      ownerName,
      ownerPhone,
      ownerEmail,
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || null,
      askingPrice: formData.get("askingPrice")
        ? Math.round(Number(formData.get("askingPrice")))
        : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: agentId ? "ASSIGNED" : "NEW",
      createdById: user.id,
      agentId,
    },
  });

  if (agentId) await notifyAssignedAgent(hunt.id, agentId, user.name);

  revalidatePath("/hunting");
  redirect(`/hunting/${hunt.id}`);
}

export async function assignHunt(huntId: string, formData: FormData) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return;
  const agentId = String(formData.get("agentId") ?? "") || null;

  const hunt = await prisma.hunt.findUnique({ where: { id: huntId } });
  if (!hunt) return;

  await prisma.hunt.update({
    where: { id: huntId },
    data: {
      agentId,
      // Move a fresh hunt into ASSIGNED; never regress a hunt already in progress.
      ...(agentId && (hunt.status === "NEW" || hunt.status === "ASSIGNED")
        ? { status: "ASSIGNED" }
        : {}),
    },
  });

  if (agentId && agentId !== hunt.agentId) {
    await prisma.huntUpdate.create({
      data: { huntId, userId: user.id, body: "Hunt assigned." },
    });
    await notifyAssignedAgent(huntId, agentId, user.name);
  }

  revalidatePath("/hunting");
  revalidatePath(`/hunting/${huntId}`);
}

async function notifyAssignedAgent(huntId: string, agentId: string, byName: string) {
  const [agent, hunt] = await Promise.all([
    prisma.user.findUnique({ where: { id: agentId } }),
    prisma.hunt.findUnique({ where: { id: huntId } }),
  ]);
  if (!agent || !hunt) return;
  await sendEmail(
    agent,
    `New property hunt assigned: ${hunt.address}`,
    `${byName} assigned you a property hunt.\n\nProperty: ${hunt.address}${
      hunt.suburb ? `, ${hunt.suburb}` : ""
    }\nOwner: ${hunt.ownerName}${hunt.ownerPhone ? ` · ${hunt.ownerPhone}` : ""}${
      hunt.ownerEmail ? ` · ${hunt.ownerEmail}` : ""
    }\n\nOpen the portal to see the details and log your progress.`
  );
}

export async function updateHuntStatus(huntId: string, status: string) {
  if (!HUNT_STATUSES.includes(status as (typeof HUNT_STATUSES)[number])) return;
  const { user } = await requireHuntAccess(huntId);
  await prisma.hunt.update({ where: { id: huntId }, data: { status } });
  await prisma.huntUpdate.create({
    data: {
      huntId,
      userId: user.id,
      body: `Status changed to ${(HUNT_STATUS_LABELS[status] ?? status).toLowerCase()}.`,
    },
  });
  revalidatePath("/hunting");
  revalidatePath(`/hunting/${huntId}`);
}

export async function addHuntUpdate(huntId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const { user } = await requireHuntAccess(huntId);
  await prisma.huntUpdate.create({ data: { huntId, userId: user.id, body } });
  revalidatePath(`/hunting/${huntId}`);
}
