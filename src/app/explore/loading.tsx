export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Search bar skeleton */}
      <div className="h-12 w-full max-w-xl mx-auto bg-surface-muted rounded-xl animate-pulse mb-8" />

      {/* Categories skeleton */}
      <div className="flex gap-3 justify-center mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Photo grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-surface-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
