import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { Card, buttonClass, inputClass, labelClass } from "@/components/ui";
import { createShowing } from "../actions";

export default async function NewShowingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const defaultDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  await getUserOrRedirect();

  const [listings, leads] = await Promise.all([
    prisma.listing.findMany({
      where: { status: { in: ["ACTIVE", "UNDER_OFFER"] } },
      select: { id: true, title: true, suburb: true },
      orderBy: { title: "asc" },
    }),
    prisma.lead.findMany({
      where: { status: { in: ["NEW", "CONTACTED", "VIEWING"] } },
      select: { id: true, name: true },
      orderBy: { receivedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Book a showing</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          The listing agent is assigned automatically.
        </p>
      </div>

      <Card className="p-6">
        <form action={createShowing} className="space-y-4">
          <div>
            <label htmlFor="listingId" className={labelClass}>
              Listing
            </label>
            <select id="listingId" name="listingId" required className={inputClass}>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} — {l.suburb}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="leadId" className={labelClass}>
              Buyer (optional for open houses)
            </label>
            <select id="leadId" name="leadId" className={inputClass}>
              <option value="">— No specific buyer —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className={labelClass}>
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={defaultDate}
                className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <div>
              <label htmlFor="time" className={labelClass}>
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                required
                className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="kind" className={labelClass}>
              Type
            </label>
            <select id="kind" name="kind" className={inputClass}>
              <option value="PRIVATE">Private viewing (45 min)</option>
              <option value="OPEN_HOUSE">Open house (2 hours)</option>
            </select>
          </div>
          <button type="submit" className={buttonClass}>
            Book showing
          </button>
        </form>
      </Card>
    </div>
  );
}
