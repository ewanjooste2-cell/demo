import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatDate, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/format";
import { Card, LeadStatusBadge, SourceBadge, inputClass, buttonClass } from "@/components/ui";
import { addLeadNote, assignLead, updateLeadStatus } from "../actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserOrRedirect();

  const lead = await prisma.lead.findFirst({
    where: { id, ...(user.role === "ADMIN" ? {} : { agentId: user.id }) },
    include: {
      listing: true,
      agent: true,
      notes: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) notFound();

  const agents =
    user.role === "ADMIN"
      ? await prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } })
      : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-stone-900">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
          </div>
          <p className="text-sm text-stone-500 mt-1">Received {formatDate(lead.receivedAt)}</p>
        </div>
        <Link href="/leads" className="text-sm text-blue-700 hover:underline">
          ← Back to leads
        </Link>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-stone-700">Move through pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {LEAD_STATUSES.map((s) => {
            const action = updateLeadStatus.bind(null, lead.id, s);
            const current = lead.status === s;
            return (
              <form key={s} action={action}>
                <button
                  type="submit"
                  disabled={current}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    current
                      ? "bg-blue-600 text-white border-blue-600 cursor-default"
                      : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {LEAD_STATUS_LABELS[s]}
                </button>
              </form>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Contact details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-stone-500">Email</dt>
              <dd className="text-stone-900">
                {lead.email ? <a className="text-blue-700 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Phone</dt>
              <dd className="text-stone-900">
                {lead.phone ? <a className="text-blue-700 hover:underline" href={`tel:${lead.phone.replace(/\s/g, "")}`}>{lead.phone}</a> : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Listing</dt>
              <dd className="text-stone-900">
                {lead.listing ? (
                  <Link href={`/listings/${lead.listing.id}`} className="text-blue-700 hover:underline">
                    {lead.listing.title}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Agent</dt>
              <dd className="text-stone-900">{lead.agent?.name ?? "Unassigned"}</dd>
            </div>
          </dl>
          {user.role === "ADMIN" && (
            <form action={assignLead.bind(null, lead.id)} className="mt-4 flex gap-2">
              <select name="agentId" defaultValue={lead.agentId ?? ""} className={inputClass}>
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
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-stone-700 mb-3">Enquiry message</h2>
          <p className="text-sm text-stone-700 whitespace-pre-wrap">
            {lead.message ?? "No message captured."}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-stone-700 mb-3">Notes &amp; activity</h2>
        <form action={addLeadNote.bind(null, lead.id)} className="flex gap-2 mb-4">
          <input name="body" placeholder="Add a note — call made, viewing booked…" className={inputClass} />
          <button type="submit" className={buttonClass}>
            Add
          </button>
        </form>
        <ul className="space-y-3">
          {lead.notes.map((note) => (
            <li key={note.id} className="text-sm border-l-2 border-stone-200 pl-3">
              <p className="text-stone-800">{note.body}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {note.user?.name ?? "System"} · {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
          {lead.notes.length === 0 && <li className="text-sm text-stone-500">No notes yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
