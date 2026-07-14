import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
}

/** Download listings / leads / hunts as a CSV, scoped to the signed-in user's role. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entity } = await params;
  const isAdmin = user.role === "ADMIN";

  let csv: string;
  if (entity === "listings") {
    const rows = await prisma.listing.findMany({
      where: isAdmin ? {} : { agentId: user.id },
      include: { agent: true, snapshots: { orderBy: { capturedAt: "desc" }, take: 1 }, _count: { select: { leads: true } } },
      orderBy: { listedDate: "desc" },
    });
    csv = toCsv(
      ["Web ref", "Title", "Address", "Suburb", "Price", "Status", "Agent", "Listed", "Views", "Leads"],
      rows.map((l) => [
        l.webRef,
        l.title,
        l.address,
        l.suburb,
        l.price,
        l.status,
        l.agent?.name,
        l.listedDate.toISOString().slice(0, 10),
        l.snapshots[0]?.views ?? 0,
        l._count.leads,
      ])
    );
  } else if (entity === "leads") {
    const rows = await prisma.lead.findMany({
      where: isAdmin ? {} : { agentId: user.id },
      include: { listing: true, agent: true },
      orderBy: { receivedAt: "desc" },
    });
    csv = toCsv(
      ["Name", "Email", "Phone", "Listing", "Web ref", "Agent", "Source", "Status", "Received"],
      rows.map((l) => [
        l.name,
        l.email,
        l.phone,
        l.listing?.title,
        l.listing?.webRef,
        l.agent?.name,
        l.source,
        l.status,
        l.receivedAt.toISOString().slice(0, 10),
      ])
    );
  } else if (entity === "hunts") {
    const rows = await prisma.hunt.findMany({
      where: isAdmin ? {} : { OR: [{ agentId: user.id }, { createdById: user.id }] },
      include: { agent: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv(
      ["Address", "Suburb", "Owner", "Owner phone", "Owner email", "Asking price", "Posting link", "Assigned to", "Added by", "Status", "Added"],
      rows.map((h) => [
        h.address,
        h.suburb,
        h.ownerName,
        h.ownerPhone,
        h.ownerEmail,
        h.askingPrice,
        h.sourceUrl,
        h.agent?.name,
        h.createdBy?.name,
        h.status,
        h.createdAt.toISOString().slice(0, 10),
      ])
    );
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-${stamp}.csv"`,
    },
  });
}
