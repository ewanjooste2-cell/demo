function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-stone-200/80 dark:bg-stone-800/80 ${className}`}
    />
  );
}

/** Skeleton shown while any portal page loads — mirrors the common page shape. */
export default function PortalLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Shimmer className="h-6 w-52" />
        <Shimmer className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Shimmer className="h-72 rounded-2xl" />
        <Shimmer className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
