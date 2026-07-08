import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { ListingForm } from "@/components/listing-form";
import { createListing } from "../actions";
import { Card } from "@/components/ui";

export default async function NewListingPage() {
  const user = await getUserOrRedirect();
  const agents = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Add listing</h1>
      <Card className="p-6">
        <ListingForm
          action={createListing}
          agents={agents}
          isAdmin={user.role === "ADMIN"}
          initial={{ agentId: user.id }}
          submitLabel="Create listing"
        />
      </Card>
    </div>
  );
}
