export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-brand-primary/20 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-gray-400 font-medium animate-pulse">
        Loading WildSaura…
      </p>
    </div>
  );
}
