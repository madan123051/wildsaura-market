"use client";

import Link from "next/link";
import { Search, ArrowRight, Camera } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";

const CATEGORIES = [
  { name: "Nature",       icon: "🌿", slug: "nature" },
  { name: "Wildlife",     icon: "🦅", slug: "wildlife" },
  { name: "Culture",      icon: "🏛️", slug: "culture" },
  { name: "Food",         icon: "🍜", slug: "food" },
  { name: "Adventure",    icon: "🧗", slug: "adventure" },
  { name: "Architecture", icon: "🕌", slug: "architecture" },
];

const STATS = [
  { value: "12,000+", label: "Photos" },
  { value: "500+",    label: "Photographers" },
  { value: "NPR 5M+", label: "Paid to Creators" },
  { value: "50+",     label: "Countries" },
];

export default function HomePage() {
  const { count } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={count} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-primary/80 to-brand-dark py-28 px-4 text-center text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-brand-secondary/20 px-4 py-1 text-sm font-medium text-brand-secondary mb-4">
            🇳🇵 Made in Nepal
          </span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight mb-5">
            Nepal's Most Beautiful<br />Photos, Licensed.
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
            Discover breathtaking stock photos from Nepal's top photographers.
            License instantly, pay securely with eSewa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore">
              <Button size="lg" leftIcon={<Search size={18} />}>
                Browse Photos
              </Button>
            </Link>
            <Link href="/(auth)/login">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Sell Your Photos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-secondary/10 py-10">
        <div className="mx-auto max-w-4xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold font-heading text-brand-primary">{s.value}</p>
              <p className="text-sm text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl font-bold text-brand-dark">Browse Categories</h2>
          <Link href="/explore" className="flex items-center gap-1 text-brand-primary text-sm font-medium hover:underline">
            See all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl2 bg-white border border-surface-border p-5 shadow-card hover:shadow-card-hover hover:border-brand-primary/30 transition-all"
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-brand-dark group-hover:text-brand-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA for creators */}
      <section className="bg-brand-primary text-white py-16 px-4 text-center">
        <Camera className="mx-auto mb-4 text-brand-secondary" size={40} />
        <h2 className="font-heading text-3xl font-bold mb-3">Are You a Photographer?</h2>
        <p className="text-white/80 max-w-md mx-auto mb-7">
          Upload your best shots, let Gemini AI tag them automatically,
          and start earning in Nepali Rupees via eSewa.
        </p>
        <Link href="/(auth)/login">
          <Button size="lg" variant="secondary">Start Selling Today</Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
