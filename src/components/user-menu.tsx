"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function UserMenu({ name, roleLabel }: { name: string; roleLabel: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
    applyTheme(next);
  }

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀" },
    { value: "dark", label: "Dark", icon: "☾" },
    { value: "system", label: "System", icon: "◐" },
  ];

  return (
    <div className="relative group hidden sm:block">
      <div className="text-right cursor-default px-2 py-1 rounded-lg group-hover:bg-stone-100 dark:group-hover:bg-stone-800">
        <div className="text-sm font-medium text-stone-800 dark:text-stone-200 leading-tight">
          {name}
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{roleLabel}</div>
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
