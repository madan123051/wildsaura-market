import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Contact WildSaura Market",
  description: "Contact WildSaura Market support for buying, selling, and account help.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">Contact</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-brand-dark">
          Need help with WildSaura?
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          For purchase issues, downloads, seller verification, equipment orders,
          or points questions, contact the WildSaura team with your account email
          and order ID if you have one.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <Mail className="h-7 w-7 text-brand-primary" />
            <h2 className="mt-4 font-semibold text-brand-dark">Email support</h2>
            <p className="mt-2 text-sm text-gray-500">help@wildsaura.com</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <MessageCircle className="h-7 w-7 text-brand-primary" />
            <h2 className="mt-4 font-semibold text-brand-dark">Order help</h2>
            <p className="mt-2 text-sm text-gray-500">Share your order ID from the dashboard.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <ShieldCheck className="h-7 w-7 text-brand-primary" />
            <h2 className="mt-4 font-semibold text-brand-dark">Account help</h2>
            <p className="mt-2 text-sm text-gray-500">Login, verification, and points support.</p>
          </div>
        </div>

        <Link href="/dashboard" className="mt-10 inline-flex rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90">
          Open Dashboard
        </Link>
      </section>
    </main>
  );
}
