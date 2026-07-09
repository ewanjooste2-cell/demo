import { prisma } from "@/lib/db";

/** Escape per RFC 5545 TEXT rules. */
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Personal ICS feed — subscribe from Google Calendar / Outlook / Apple
 * Calendar so an agent's showings appear in their own calendar. The token is
 * the secret; anyone with the URL sees only that agent's diary.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");
  const user = await prisma.user.findUnique({ where: { calendarToken: token } });
  if (!user) return new Response("Not found", { status: 404 });

  const showings = await prisma.showing.findMany({
    where: { agentId: user.id, status: { not: "CANCELLED" } },
    include: {
      listing: { select: { title: true, address: true, suburb: true } },
      lead: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Estate Portal//Showings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Showings — ${user.name}`)}`,
    ...showings.flatMap((s) => [
      "BEGIN:VEVENT",
      `UID:${s.id}@estate-portal`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(s.startsAt)}`,
      `DTEND:${icsDate(s.endsAt)}`,
      `SUMMARY:${esc(`${s.kind === "OPEN_HOUSE" ? "Open house" : "Showing"}: ${s.listing.title}`)}`,
      `LOCATION:${esc(`${s.listing.address}, ${s.listing.suburb}`)}`,
      `DESCRIPTION:${esc(`${s.lead ? `Buyer: ${s.lead.name}. ` : ""}Status: ${s.status}.`)}`,
      `STATUS:${s.status === "REQUESTED" ? "TENTATIVE" : "CONFIRMED"}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="showings.ics"`,
    },
  });
}
