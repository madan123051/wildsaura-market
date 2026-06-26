export const metadata = {
  title: "Privacy Policy | WildSaura Market",
  description: "Privacy policy for WildSaura Market users, buyers, and sellers.",
};

const sections = [
  {
    title: "Information we use",
    text: "WildSaura uses account details, profile information, uploaded listing data, purchase history, downloads, and point history to run the marketplace.",
  },
  {
    title: "How we use it",
    text: "We use this information to authenticate users, show dashboards, process purchases, support downloads, protect listings, and improve marketplace safety.",
  },
  {
    title: "Payments and orders",
    text: "Payment references, order IDs, and purchase records are stored so buyers and sellers can track completed and pending activity.",
  },
  {
    title: "User control",
    text: "Users can update profile details, manage listings, and contact support for account or purchase questions.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">Privacy</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-brand-dark">Privacy Policy</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          This page explains how WildSaura Market handles marketplace data in
          plain language. It is intended for users buying photos, selling photos,
          listing equipment, and earning points.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="text-lg font-semibold text-brand-dark">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{section.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
