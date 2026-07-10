import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatDate, formatRand, HUNT_STATUSES, HUNT_STATUS_LABELS } from "@/lib/format";
import { Card, HuntStatusBadge, inputClass, buttonClass } from "@/components/ui";
import { addHuntUpdate, assignHunt, updateHuntStatus } from "../actions";

export default async function HuntDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserOrRedirect();

  const hunt = await prisma.hunt.findFirst({
    where: {
      id,
      ...(user.role === "ADMIN"
        ? {}
        : { OR: [{ agentId: user.id }, { createdById: user.id }] }),
    },
    include: {
      agent: true,
      createdBy: true,
      updates: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!hunt) notFound();

  const agents =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { active: true, role: "AGENT" },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              {hunt.address}
            </h1>
            <HuntStatusBadge status={hunt.status} />
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {hunt.suburb && `${hunt.suburb} · `}
            Added {formatDate(hunt.createdAt)}
            {hunt.createdBy && ` by ${hunt.createdBy.name}`}
          </p>
        </div>
        <Link
          href="/hunting"
          className="text-sm text-blue-700 dark:text-blue-400 hover:underline"
        >
          ← Back to hunting
        </Link>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">Progress</h2>
        <div className="flex flex-wrap gap-2">
          {HUNT_STATUSES.map((s) => {
            const action = updateHuntStatus.bind(null, hunt.id, s);
            const current = hunt.status === s;
            return (
              <form key={s} action={action}>
                <button
                  type="submit"
                  disabled={current}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    current
                      ? "bg-blue-600 text-white border-blue-600 cursor-default"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                  }`}
                >
                  {HUNT_STATUS_LABELS[s]}
                </button>
              </form>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Home owner
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-stone-500 dark:text-stone-400">Name</dt>
              <dd className="text-stone-900 dark:text-stone-100">{hunt.ownerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500 dark:text-stone-400">Phone</dt>
              <dd className="text-stone-900 dark:text-stone-100">
                {hunt.ownerPhone ? (
                  <a
                    className="text-blue-700 dark:text-blue-400 hover:underline"
                    href={`tel:${hunt.ownerPhone.replace(/\s/g, "")}`}
                  >
                    {hunt.ownerPhone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500 dark:text-stone-400">Email</dt>
              <dd className="text-stone-900 dark:text-stone-100">
                {hunt.ownerEmail ? (
                  <a
                    className="text-blue-700 dark:text-blue-400 hover:underline"
                    href={`mailto:${hunt.ownerEmail}`}
                  >
                    {hunt.ownerEmail}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500 dark:text-stone-400">Asking price</dt>
              <dd className="text-stone-900 dark:text-stone-100">
                {hunt.askingPrice ? formatRand(hunt.askingPrice) : "Not captured"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500 dark:text-stone-400">Posting</dt>
              <dd className="text-stone-900 dark:text-stone-100">
                {hunt.sourceUrl ? (
                  <a
                    className="text-blue-700 dark:text-blue-400 hover:underline break-all"
                    href={hunt.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original posting ↗
                  </a>
                ) : (
                  "No link"
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Assigned agent
          </h2>
          <p className="text-sm text-stone-900 dark:text-stone-100">
            {hunt.agent?.name ?? "Unassigned"}
          </p>
          {user.role === "ADMIN" && (
            <form action={assignHunt.bind(null, hunt.id)} className="mt-4 flex gap-2">
              <select name="agentId" defaultValue={hunt.agentId ?? ""} className={inputClass}>
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={buttonClass}>
                Assign
              </button>
            </form>
          )}
          {user.role === "ADMIN" && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
              The agent gets an email notification when you assign them.
            </p>
          )}
          {hunt.notes && (
            <>
              <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mt-5 mb-2">
                Notes from the hunter
              </h2>
              <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                {hunt.notes}
              </p>
            </>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Progress updates
        </h2>
        <form action={addHuntUpdate.bind(null, hunt.id)} className="flex gap-2 mb-4">
          <input
            name="body"
            placeholder="Log an update — called the owner, meeting booked…"
            className={inputClass}
          />
          <button type="submit" className={buttonClass}>
            Add
          </button>
        </form>
        <ul className="space-y-3">
          {hunt.updates.map((u) => (
            <li
              key={u.id}
              className="text-sm border-l-2 border-stone-200 dark:border-stone-700 pl-3"
            >
              <p className="text-stone-800 dark:text-stone-200">{u.body}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {u.user?.name ?? "System"} · {formatDate(u.createdAt)}
              </p>
            </li>
          ))}
          {hunt.updates.length === 0 && (
            <li className="text-sm text-stone-500 dark:text-stone-400">No updates yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
