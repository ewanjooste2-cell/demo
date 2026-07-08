"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/leads", label: "Leads" },
  { href: "/import", label: "Import" },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin/users", label: "Users" }] : LINKS;

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              active
                ? "bg-stone-100 text-stone-900"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
