import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type SearchResult = {
  kind: "listing" | "lead" | "hunt";
  id: string;
  title: string;
  sub: string;
  href: string;
  badge?: string;
};

/** Global search across listings, leads and hunts, scoped by role. */
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const isAdmin = user.role === "ADMIN";
  const listingScope = isAdmin ? {} : { agentId: user.id };
  const ownScope = isAdmin ? {} : { OR: [{ agentId: user.id }, { createdById: user.id }] };

  const [listings, leads, hunts] = await Promise.all([
    prisma.listing.findMany({
      where: {
        ...listingScope,
        OR: [
          { title: { contains: q } },
          { address: { contains: q } },
          { suburb: { contains: q } },
          { webRef: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { listedDate: "desc" },
    }),
    prisma.lead.findMany({
      where: {
        ...(isAdmin ? {} : { agentId: user.id }),
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      include: { listing: true },
      take: 5,
      orderBy: { receivedAt: "desc" },
    }),
    prisma.hunt.findMany({
      where: {
        ...ownScope,
        OR: [
          { address: { contains: q } },
          { suburb: { contains: q } },
          { ownerName: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...listings.map((l) => ({
      kind: "listing" as const,
      id: l.id,
      title: l.title,
      sub: `${l.suburb} · ${l.webRef}`,
      href: `/listings/${l.id}`,
      badge: l.status,
    })),
    ...leads.map((l) => ({
      kind: "lead" as const,
      id: l.id,
      title: l.name,
      sub: l.listing?.title ?? l.email ?? l.phone ?? "Lead",
      href: `/leads/${l.id}`,
      badge: l.status,
    })),
    ...hunts.map((h) => ({
      kind: "hunt" as const,
      id: h.id,
      title: h.address,
      sub: `Owner: ${h.ownerName}`,
      href: `/hunting/${h.id}`,
      badge: h.status,
    })),
  ];

  return NextResponse.json({ results });
}
