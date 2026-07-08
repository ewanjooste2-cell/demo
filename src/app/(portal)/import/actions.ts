"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseLeadEmail, parseListingReport } from "@/lib/parsers";

export type ImportResult = { error?: string; success?: string };

/** Paste a Private Property enquiry email → create a lead. */
export async function importLeadEmail(
  _prev: ImportResult | undefined,
  formData: FormData
): Promise<ImportResult> {
  const user = await getSession();
  if (!user) redirect("/login");

  const text = String(formData.get("emailText") ?? "").trim();
  if (text.length < 10) return { error: "Paste the full enquiry email text first." };

  const parsed = parseLeadEmail(text);
  if (!parsed.name && !parsed.email && !parsed.phone) {
    return { error: "Couldn't find a name, email or phone number in that text." };
  }

  const listing = parsed.webRef
    ? await prisma.listing.findFirst({ where: { webRef: { equals: parsed.webRef } } })
    : null;

  const lead = await prisma.lead.create({
    data: {
      name: parsed.name ?? parsed.email ?? "Unknown enquirer",
      email: parsed.email,
      phone: parsed.phone,
      message: parsed.message ?? text.slice(0, 500),
      source: "EMAIL",
      listingId: listing?.id ?? null,
      agentId: listing?.agentId ?? (user.role === "ADMIN" ? null : user.id),
    },
  });

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

/** Upload the listing report exported from the Private Property agent portal. */
export async function importReport(
  _prev: ImportResult | undefined,
  formData: FormData
): Promise<ImportResult> {
  const user = await getSession();
  if (!user) redirect("/login");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose the report file (CSV or XLSX) first." };
  if (file.size > 10 * 1024 * 1024) return { error: "File is too large (max 10 MB)." };

  const capturedAtRaw = String(formData.get("capturedAt") ?? "");
  const capturedAt = capturedAtRaw ? new Date(capturedAtRaw) : new Date();
  capturedAt.setHours(12, 0, 0, 0);
  const createMissing = formData.get("createMissing") === "on";

  let rows;
  try {
    rows = parseListingReport(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "Couldn't read that file — export the report as CSV or XLSX and try again." };
  }
  if (rows.length === 0) {
    return { error: "No rows with a web reference found in that file. Check it's the listing report export." };
  }

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    let listing = await prisma.listing.findUnique({ where: { webRef: row.webRef } });
    if (!listing && createMissing) {
      listing = await prisma.listing.create({
        data: {
          webRef: row.webRef,
          title: row.title ?? `Listing ${row.webRef}`,
          address: row.address ?? "",
          suburb: row.address?.split(",").at(-1)?.trim() ?? "Unknown",
          price: row.price ?? 0,
          agentId: user.role === "ADMIN" ? null : user.id,
        },
      });
      created++;
    }
    if (!listing) {
      skipped++;
      continue;
    }
    await prisma.viewSnapshot.upsert({
      where: { listingId_capturedAt: { listingId: listing.id, capturedAt } },
      update: { views: row.views, alertsSent: row.alertsSent, leadsCount: row.leadsCount },
      create: {
        listingId: listing.id,
        capturedAt,
        views: row.views,
        alertsSent: row.alertsSent,
        leadsCount: row.leadsCount,
      },
    });
    updated++;
  }

  revalidatePath("/");
  revalidatePath("/listings");
  return {
    success: `Report imported: stats recorded for ${updated} listing${updated === 1 ? "" : "s"}${
      created ? `, ${created} new listing${created === 1 ? "" : "s"} created` : ""
    }${skipped ? `, ${skipped} unknown web ref${skipped === 1 ? "" : "s"} skipped` : ""}.`,
  };
}
