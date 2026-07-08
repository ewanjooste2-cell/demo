import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLeadEmail } from "@/lib/parsers";

/**
 * Automatic lead capture. Point an email-forwarding service (Power Automate,
 * Mailparser, Zapier…) at this endpoint for Private Property enquiry emails.
 *
 * POST /api/webhooks/lead
 * Header: x-webhook-token: <LEAD_WEBHOOK_TOKEN>
 * Body: { name, email, phone, message, webRef } — pre-parsed fields
 *   or: { subject, body } — the raw email; the portal parses it.
 */
export async function POST(req: NextRequest) {
  const token = process.env.LEAD_WEBHOOK_TOKEN;
  if (!token || req.headers.get("x-webhook-token") !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let name = typeof payload.name === "string" ? payload.name.trim() : "";
  let email = typeof payload.email === "string" ? payload.email.trim() : "";
  let phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  let message = typeof payload.message === "string" ? payload.message.trim() : "";
  let webRef = typeof payload.webRef === "string" ? payload.webRef.trim() : "";

  // Raw email mode: parse subject + body.
  const rawText = [payload.subject, payload.body]
    .filter((v): v is string => typeof v === "string")
    .join("\n");
  if (rawText && (!name || (!email && !phone))) {
    const parsed = parseLeadEmail(rawText);
    name = name || parsed.name || "";
    email = email || parsed.email || "";
    phone = phone || parsed.phone || "";
    message = message || parsed.message || "";
    webRef = webRef || parsed.webRef || "";
  }

  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: "No lead details found (need at least a name, email or phone)" },
      { status: 422 }
    );
  }

  const listing = webRef ? await prisma.listing.findUnique({ where: { webRef } }) : null;

  const lead = await prisma.lead.create({
    data: {
      name: name || email || "Unknown enquirer",
      email: email || null,
      phone: phone || null,
      message: message || (rawText ? rawText.slice(0, 500) : null),
      source: "WEBHOOK",
      listingId: listing?.id ?? null,
      agentId: listing?.agentId ?? null,
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id, matchedListing: listing?.webRef ?? null });
}
