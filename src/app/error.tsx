"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <span className="text-[100px] font-heading font-bold text-brand-accent/10 leading-none select-none">
          Oops
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl">⚠️</span>
        </div>
      </div>

      <h1 className="font-heading text-3xl font-bold text-brand-dark mb-3">
        Something Went Wrong
      </h1>
      <p className="text-gray-500 max-w-md mb-8">
        An unexpected error occurred. Don’t worry, your data is safe.
        Try refreshing the page.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="border border-surface-border text-brand-dark px-6 py-3 rounded-xl font-semibold hover:bg-surface-muted transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
