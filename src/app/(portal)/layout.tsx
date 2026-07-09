import Link from "next/link";
import { getUserOrRedirect } from "@/lib/session";
import { logout } from "@/app/login/actions";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserOrRedirect();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 h-14">
            <div className="flex items-center gap-3 sm:gap-8 min-w-0">
              <Link href="/" className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold">
                  E
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 hidden sm:block">
                  Estate Portal
                </span>
              </Link>
              <NavLinks isAdmin={user.role === "ADMIN"} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <UserMenu name={user.name} roleLabel={user.role === "ADMIN" ? "Principal" : "Agent"} />
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 whitespace-nowrap"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
