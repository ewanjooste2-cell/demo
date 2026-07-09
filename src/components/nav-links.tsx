"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/leads", label: "Leads" },
  { href: "/showings", label: "Showings" },
  { href: "/cma", label: "CMA" },
  { href: "/team", label: "Team" },
  { href: "/import", label: "Import" },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin/users", label: "Users" }] : LINKS;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              active
                ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/60"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
