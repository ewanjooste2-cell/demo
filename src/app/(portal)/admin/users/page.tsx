import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { toggleUserActive } from "./actions";

export default async function UsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    include: { _count: { select: { listings: true, leads: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Users</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Agents and principals with access to the portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Listings</th>
                <th className="px-4 py-3 font-medium text-right">Leads</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                  <td className="px-4 py-3">
                    <div className={`font-medium ${u.active ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-600 line-through"}`}>
                      {u.name}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{u.email}</div>
                    {u.phone && (
                      <div className="text-xs text-stone-400 dark:text-stone-500">{u.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        u.role === "ADMIN"
                          ? "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-400/30"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 ring-stone-500/20 dark:ring-stone-500/30"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Principal" : "Agent"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u._count.listings}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u._count.leads}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== admin.id && (
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1"
                        >
                          {u.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="font-medium text-stone-900 dark:text-stone-100 mb-4">Add user</h2>
          <UserForm />
        </Card>
      </div>
    </div>
  );
}
