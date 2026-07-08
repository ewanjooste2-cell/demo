import { prisma } from "@/lib/db";
import { getUserOrRedirect, agentScope } from "@/lib/session";
import { Card } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";

export default async function NewLeadPage() {
  const user = await getUserOrRedirect();
  const listings = await prisma.listing.findMany({
    where: agentScope(user),
    select: { id: true, title: true, webRef: true },
    orderBy: { listedDate: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Add lead</h1>
      <Card className="p-6">
        <LeadForm listings={listings} />
      </Card>
    </div>
  );
}
