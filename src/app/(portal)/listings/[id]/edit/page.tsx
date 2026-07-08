import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { ListingForm } from "@/components/listing-form";
import { updateListing } from "../../actions";
import { Card } from "@/components/ui";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserOrRedirect();

  const listing = await prisma.listing.findFirst({ where: { id, ...agentScope(user) } });
  if (!listing) notFound();

  const agents = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const action = updateListing.bind(null, listing.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-stone-900">Edit listing</h1>
      <Card className="p-6">
        <ListingForm
          action={action}
          agents={agents}
          isAdmin={user.role === "ADMIN"}
          initial={{
            webRef: listing.webRef,
            title: listing.title,
            address: listing.address,
            suburb: listing.suburb,
            price: listing.price,
            propertyType: listing.propertyType,
            bedrooms: listing.bedrooms,
            status: listing.status,
            url: listing.url,
            agentId: listing.agentId,
          }}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
