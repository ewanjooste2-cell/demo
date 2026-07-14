import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { Card } from "@/components/ui";
import { HuntForm } from "@/components/hunt-form";

export default async function NewHuntPage() {
  const user = await getUserOrRedirect();
  const agents = await prisma.user.findMany({
    where: { active: true, role: "AGENT" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Add hunt</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Capture a property you&apos;ve spotted and the owner&apos;s details so an agent can make
          contact and pitch for the mandate.
        </p>
      </div>
      <Card className="p-6">
        <HuntForm
          agents={agents}
          isAdmin={user.role === "ADMIN"}
          currentUserId={user.id}
        />
      </Card>
    </div>
  );
}
