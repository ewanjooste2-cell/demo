"use client";

export type BellItem = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  timeAgo: string;
};

const STATUS_DOT: Record<string, string> = {
  SENT: "bg-green-500",
  SIMULATED: "bg-amber-400",
  FAILED: "bg-red-500",
};

export function NotificationBell({ items, recentCount }: { items: BellItem[]; recentCount: number }) {
  return (
    <div className="relative group">
      <button
        type="button"
        aria-label={`Notifications${recentCount ? ` (${recentCount} in the last day)` : ""}`}
        className="relative p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 group-hover:bg-stone-100 dark:group-hover:bg-stone-800"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {recentCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold leading-none">
            {recentCount > 9 ? "9+" : recentCount}
          </span>
        )}
      </button>

      <div className="absolute right-0 top-full pt-1 w-80 hidden group-hover:block z-30">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 text-sm font-medium text-stone-900 dark:text-stone-100">
            Notifications
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.map((n) => (
              <li
                key={n.id}
                className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[n.status] ?? "bg-stone-400"}`}
                    title={n.status.toLowerCase()}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-stone-800 dark:text-stone-200 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{n.timeAgo}</p>
                  </div>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                Nothing yet — assignment and booking alerts will show up here.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
