"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RANGE_PRESETS } from "@/lib/ranges";

/**
 * Date-range control: preset rows first (selection marked with a bold check,
 * hover stays a ghost wash), custom from/to behind a hairline in the footer.
 * Selection is pushed to the URL so the server re-renders everything below
 * against the same slice.
 */
export function DateRangePicker({
  selectedKey,
  label,
  from,
  to,
}: {
  /** Preset key currently active, or "custom". */
  selectedKey: string;
  /** Human label for the trigger button, e.g. "Last 12 months" or "1 Mar – 9 Jul 2026". */
  label: string;
  /** Current custom bounds (YYYY-MM-DD) to prefill the footer inputs. */
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pickPreset(key: string) {
    setOpen(false);
    router.push(key === "365" ? "/" : `/?period=${key}`);
  }

  function applyCustom() {
    if (!customFrom) return;
    setOpen(false);
    const params = new URLSearchParams({ from: customFrom });
    if (customTo) params.set("to", customTo);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" />
          <path d="M1.5 6h13M5 1v3M11 1v3" stroke="currentColor" strokeLinecap="round" />
        </svg>
        {label}
        <span aria-hidden="true" className="text-stone-400 dark:text-stone-500 text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg p-1.5"
        >
          <ul>
            {RANGE_PRESETS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => pickPreset(p.key)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                >
                  {p.label}
                  {selectedKey === p.key && (
                    <span aria-hidden="true" className="text-base font-bold text-stone-900 dark:text-stone-100">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-stone-200 dark:border-stone-700 mt-1.5 pt-2.5 px-3 pb-2 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center justify-between">
              Custom range
              {selectedKey === "custom" && (
                <span aria-hidden="true" className="text-sm font-bold normal-case text-stone-900 dark:text-stone-100">
                  ✓
                </span>
              )}
            </div>
            <label className="block text-xs text-stone-500 dark:text-stone-400">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </label>
            <label className="block text-xs text-stone-500 dark:text-stone-400">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </label>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customFrom}
              className="w-full rounded-lg bg-blue-600 text-white py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
