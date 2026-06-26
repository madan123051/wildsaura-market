import Link from "next/link";
import { Coins, Gift, ShieldCheck, ShoppingBag } from "lucide-react";
import { MAX_WILDSAURA_POINTS } from "@/lib/rewards";

export const metadata = {
  title: "WildSaura Points & Rewards",
  description: "How WildSaura points work for login rewards, referrals, and purchases.",
};

const earnRules = [
  ["First login", "+30 points"],
  ["Full verification", "+10 points"],
  ["Daily login", "+2 points per day for 30 days"],
  ["Referral join", "+10 points"],
  ["Referral verification", "+5 points"],
];

export default function PointsPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
          Points & Rewards
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-brand-dark">
          Earn WildSaura points and use them on eligible purchases.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
          WildSaura points reward real activity in the ecosystem. Points are
          stored in your dashboard, capped at {MAX_WILDSAURA_POINTS} points per
          user, and can be used where wallet point payment is available.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-6">
            <Coins className="h-8 w-8 text-amber-700" />
            <h2 className="mt-4 text-lg font-semibold text-brand-dark">Point value</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              1 WildSaura point equals NPR 1 during wallet point checkout.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
            <ShoppingBag className="h-8 w-8 text-brand-primary" />
            <h2 className="mt-4 text-lg font-semibold text-brand-dark">Using points</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              If your balance covers the checkout total, points are deducted and
              the purchase appears in your dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-card">
            <ShieldCheck className="h-8 w-8 text-brand-primary" />
            <h2 className="mt-4 text-lg font-semibold text-brand-dark">History</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Rewards and deductions are listed in Dashboard &gt; Points with the
              remaining balance after each event.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-gray-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-brand-dark">How to earn</h2>
          </div>
          <div className="mt-5 divide-y divide-gray-100">
            {earnRules.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-semibold text-emerald-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/dashboard?tab=points" className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:bg-brand-primary/90">
            View My Points
          </Link>
          <Link href="/explore" className="rounded-xl border border-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10">
            Browse Photos
          </Link>
        </div>
      </section>
    </main>
  );
}
