import Link from "next/link";
import { prisma } from "@/lib/db";
import { getUserOrRedirect } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { Card, buttonClass, inputClass } from "@/components/ui";
import { setTaskStatus, createTask } from "./actions";

const COLUMNS: { key: string; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "DOING", label: "In progress" },
  { key: "DONE", label: "Done" },
];

export default async function TeamPage() {
  await getUserOrRedirect();

  const [tasks, agents] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: { select: { name: true } },
        deal: { select: { id: true, listing: { select: { title: true, suburb: true } } } },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const now = new Date();
  const overdue = tasks.filter((t) => t.status !== "DONE" && t.dueAt && t.dueAt < now).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Team board</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {tasks.filter((t) => t.status !== "DONE").length} open task
          {tasks.filter((t) => t.status !== "DONE").length === 1 ? "" : "s"}
          {overdue > 0 && ` · ${overdue} overdue`}
        </p>
      </div>

      <Card className="p-4">
        <form action={createTask} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="title" className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
              New task
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Collect FICA docs from seller"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="assigneeId" className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
              Assign to
            </label>
            <select id="assigneeId" name="assigneeId" className={inputClass}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dueAt" className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
              Due
            </label>
            <input
              id="dueAt"
              name="dueAt"
              type="date"
              className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Add task
          </button>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col, ci) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {col.label}
                </h2>
                <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                  {items.length}
                </span>
              </div>
              {items.map((t) => {
                const isOverdue = t.status !== "DONE" && t.dueAt && t.dueAt < now;
                return (
                  <Card key={t.id} className="p-3">
                    <div
                      className={`text-sm font-medium ${
                        t.status === "DONE"
                          ? "line-through text-stone-400 dark:text-stone-500"
                          : "text-stone-900 dark:text-stone-100"
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      {t.assignee?.name ?? "Unassigned"}
                      {t.dueAt && (
                        <span className={isOverdue ? "text-red-600 dark:text-red-400" : ""}>
                          {" "}
                          · due {formatDate(t.dueAt)}
                        </span>
                      )}
                    </div>
                    {t.deal && (
                      <Link
                        href={`/deals/${t.deal.id}`}
                        className="block text-xs text-blue-700 dark:text-blue-400 hover:underline mt-1 truncate"
                      >
                        {t.deal.listing.title}, {t.deal.listing.suburb}
                      </Link>
                    )}
                    <div className="flex gap-2 mt-2">
                      {ci > 0 && (
                        <form action={setTaskStatus.bind(null, t.id, COLUMNS[ci - 1].key)}>
                          <button
                            type="submit"
                            className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                          >
                            ← {COLUMNS[ci - 1].label}
                          </button>
                        </form>
                      )}
                      {ci < COLUMNS.length - 1 && (
                        <form action={setTaskStatus.bind(null, t.id, COLUMNS[ci + 1].key)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline"
                          >
                            {COLUMNS[ci + 1].label} →
                          </button>
                        </form>
                      )}
                    </div>
                  </Card>
                );
              })}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-800 px-3 py-6 text-center text-xs text-stone-400 dark:text-stone-500">
                  Nothing here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
