"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  kind: "listing" | "lead" | "hunt";
  id: string;
  title: string;
  sub: string;
  href: string;
  badge?: string;
};

const KIND_META: Record<SearchResult["kind"], { icon: string; label: string }> = {
  listing: { icon: "⌂", label: "Listing" },
  lead: { icon: "☎", label: "Lead" },
  hunt: { icon: "⌖", label: "Hunt" },
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K / Cmd+K opens, Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      // Wait a tick for the dialog to mount before focusing.
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSelected(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
  }, []);

  function go(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      e.preventDefault();
      go(results[selected]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 w-48 lg:w-56"
        aria-label="Search the portal"
      >
        <span aria-hidden>⌕</span>
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-stone-400 dark:text-stone-500">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
        aria-label="Search the portal"
      >
        <span aria-hidden className="text-lg leading-none">⌕</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-stone-200 dark:border-stone-800">
              <span aria-hidden className="text-stone-400">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  search(e.target.value);
                }}
                onKeyDown={onInputKey}
                placeholder="Search listings, leads, hunts…"
                className="flex-1 py-3.5 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
              />
              <kbd className="text-[10px] border border-stone-300 dark:border-stone-600 rounded px-1 py-0.5 text-stone-400 dark:text-stone-500">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.map((r, i) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  type="button"
                  onClick={() => go(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                    i === selected
                      ? "bg-stone-100 dark:bg-stone-800"
                      : "hover:bg-stone-50 dark:hover:bg-stone-800/60"
                  }`}
                >
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-base shrink-0"
                  >
                    {KIND_META[r.kind].icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {r.title}
                    </span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400 truncate">
                      {KIND_META[r.kind].label} · {r.sub}
                    </span>
                  </span>
                  {i === selected && (
                    <span aria-hidden className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                      ↵
                    </span>
                  )}
                </button>
              ))}

              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                  No matches for “{query.trim()}”.
                </p>
              )}
              {query.trim().length < 2 && (
                <p className="px-3 py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                  Type to search across listings, leads and hunts.
                </p>
              )}
              {loading && (
                <p className="px-3 py-2 text-center text-xs text-stone-400 dark:text-stone-500">
                  Searching…
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>Esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
