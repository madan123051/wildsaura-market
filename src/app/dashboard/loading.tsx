export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-surface-muted rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-surface-muted rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-9 w-24 bg-surface-muted rounded-lg animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl2 border border-surface-border p-5 shadow-card"
          >
            <div className="h-6 w-6 bg-surface-muted rounded animate-pulse mb-2" />
            <div className="h-7 w-20 bg-surface-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-surface-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 w-32 bg-surface-muted rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-surface-muted rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
