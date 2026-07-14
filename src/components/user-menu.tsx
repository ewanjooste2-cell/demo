"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui";

type Theme = "light" | "dark";

// The cookie lets the server render the right class on the next request;
// the class toggle applies it instantly on this one.
function applyTheme(next: Theme) {
  document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.classList.toggle("dark", next === "dark");
}

export function UserMenu({
  name,
  roleLabel,
  initialTheme,
}: {
  name: string;
  roleLabel: string;
  initialTheme: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀" },
    { value: "dark", label: "Dark", icon: "☾" },
  ];

  return (
    <div className="relative group hidden sm:block">
      <div className="flex items-center gap-2 cursor-default px-2 py-1 rounded-lg group-hover:bg-stone-100 dark:group-hover:bg-stone-800">
        <Avatar name={name} />
        <div className="text-right">
          <div className="text-sm font-medium text-stone-800 dark:text-stone-200 leading-tight">
            {name}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{roleLabel}</div>
        </div>
      </div>

      <div className="absolute right-0 top-full pt-1 w-40 hidden group-hover:block z-30">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg p-1.5">
          <div className="px-2 pt-1 pb-1.5 text-xs text-stone-500 dark:text-stone-400">Theme</div>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(o.value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left ${
                theme === o.value
                  ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                  : "text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
              }`}
            >
              <span aria-hidden className="w-4 text-center">
                {o.icon}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
