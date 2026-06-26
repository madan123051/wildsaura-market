import Link from "next/link";
import { Camera, Download, Package, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About WildSaura Market",
  description: "Learn about WildSaura Market, Nepal's photography marketplace.",
};

const features = [
  {
    icon: Camera,
    title: "Photos from local creators",
    text: "Buyers can discover licensed photos from photographers who understand Nepal's places, people, wildlife, and culture.",
  },
  {
    icon: Download,
    title: "Secure downloads",
    text: "Purchased photos stay available in the buyer dashboard so users can download them again later.",
  },
  {
    icon: Package,
    title: "Equipment marketplace",
    text: "Creators can list cameras, lenses, drones, and other gear for direct buyer-seller orders.",
  },
  {
    icon: ShieldCheck,
    title: "Built for trust",
    text: "Orders, payment status, tracking, and point history are kept visible from the dashboard.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
          About WildSaura
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-brand-dark">
          Nepal&apos;s marketplace for photos, creators, buyers, and camera gear.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
          WildSaura Market connects photographers with people who need authentic
          Nepali visuals. Buyers can license photos, track purchases, download
          files from their dashboard, and use WildSaura points where available.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
                <Icon className="h-7 w-7 text-brand-primary" />
                <h2 className="mt-4 text-lg font-semibold text-brand-dark">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{feature.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/explore" className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90">
            Browse Photos
          </Link>
          <Link href="/upload" className="rounded-xl border border-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10">
            Sell Photos
          </Link>
        </div>
      </section>
    </main>
  );
}
