import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950 px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold mb-4">
          E
        </div>
        <p className="text-5xl font-bold text-stone-900 dark:text-stone-100">404</p>
        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-2">
          Page not found
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          That page doesn&apos;t exist — it may have been moved, or the link is out of date.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 mt-5"
        >
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
