import Link from "next/link";
import { getUserOrRedirect } from "@/lib/session";
import { logout } from "@/app/login/actions";
import { NavLinks } from "@/components/nav-links";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserOrRedirect();

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold">
                  E
                </span>
                <span className="font-semibold text-stone-900 hidden sm:block">Estate Portal</span>
              </Link>
              <NavLinks isAdmin={user.role === "ADMIN"} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-stone-800 leading-tight">{user.name}</div>
                <div className="text-xs text-stone-500 leading-tight">
                  {user.role === "ADMIN" ? "Principal" : "Agent"}
                </div>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-stone-500 hover:text-stone-900 border border-stone-300 rounded-lg px-3 py-1.5"
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
