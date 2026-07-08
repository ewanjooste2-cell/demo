"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function fields(formData: FormData) {
  const coord = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  return {
    webRef: String(formData.get("webRef") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    suburb: String(formData.get("suburb") ?? "").trim(),
    price: Math.round(Number(formData.get("price") ?? 0)),
    propertyType: String(formData.get("propertyType") ?? "House"),
    bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
    status: String(formData.get("status") ?? "ACTIVE"),
    url: String(formData.get("url") ?? "").trim() || null,
    agentId: String(formData.get("agentId") ?? "") || null,
    latitude: coord("latitude"),
    longitude: coord("longitude"),
  };
}

export async function createListing(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");
  const data = fields(formData);
  if (!data.webRef || !data.title || !data.suburb || !data.price) {
    return { error: "Web ref, title, suburb and price are required." };
  }
  if (user.role !== "ADMIN") data.agentId = user.id;

  const existing = await prisma.listing.findUnique({ where: { webRef: data.webRef } });
  if (existing) return { error: `A listing with web ref ${data.webRef} already exists.` };

  const listing = await prisma.listing.create({
    data: { ...data, soldDate: data.status === "SOLD" ? new Date() : null },
  });
  revalidatePath("/listings");
  revalidatePath("/");
  redirect(`/listings/${listing.id}`);
}

export async function updateListing(
  listingId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");
  const data = fields(formData);
  if (!data.webRef || !data.title || !data.suburb || !data.price) {
    return { error: "Web ref, title, suburb and price are required." };
  }

  const current = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!current) return { error: "Listing not found." };
  if (user.role !== "ADMIN") {
    if (current.agentId !== user.id) return { error: "You can only edit your own listings." };
    data.agentId = user.id;
  }

  // Track the sale date: stamp it when the listing moves to SOLD, clear it when
  // it moves back to a live status.
  const soldDate =
    data.status === "SOLD" ? (current.soldDate ?? new Date()) : null;

  await prisma.listing.update({ where: { id: listingId }, data: { ...data, soldDate } });
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/");
  redirect(`/listings/${listingId}`);
}
