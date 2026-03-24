import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <span className="text-[120px] font-heading font-bold text-brand-primary/10 leading-none select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl">🌿</span>
        </div>
      </div>

      <h1 className="font-heading text-3xl font-bold text-brand-dark mb-3">
        Page Not Found
      </h1>
      <p className="text-gray-500 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="border border-surface-border text-brand-dark px-6 py-3 rounded-xl font-semibold hover:bg-surface-muted transition-colors"
        >
          Explore Photos
        </Link>
      </div>
    </div>
  );
}
