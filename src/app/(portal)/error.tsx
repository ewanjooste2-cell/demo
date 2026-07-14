"use client";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3" aria-hidden>
          ⚠
        </p>
        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Something went wrong
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          The page hit an unexpected error. Try again — if it keeps happening, note what you were
          doing and let the office know.
        </p>
        {error.digest && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 mt-5"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
