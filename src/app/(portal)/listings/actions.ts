"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function fields(formData: FormData) {
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

  const listing = await prisma.listing.create({ data });
  revalidatePath("/listings");
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
  if (user.role !== "ADMIN") {
    const owned = await prisma.listing.findFirst({ where: { id: listingId, agentId: user.id } });
    if (!owned) return { error: "You can only edit your own listings." };
    data.agentId = user.id;
  }
  await prisma.listing.update({ where: { id: listingId }, data });
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  redirect(`/listings/${listingId}`);
}
