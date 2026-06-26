export const metadata = {
  title: "Terms & Conditions | WildSaura Market",
  description: "Terms and conditions for using WildSaura Market.",
};

const terms = [
  {
    title: "Marketplace use",
    text: "Users must provide accurate account and listing information. Photos, equipment listings, and profile details should not mislead buyers.",
  },
  {
    title: "Photo purchases",
    text: "Purchased photos are made available from the buyer dashboard. Buyers may download purchased files again from their account when the download record exists.",
  },
  {
    title: "Seller responsibility",
    text: "Sellers are responsible for uploading work they own or are allowed to sell, setting correct prices, and keeping equipment listing details accurate.",
  },
  {
    title: "Payments and points",
    text: "Orders can be pending, paid, failed, or reserved depending on the payment method. WildSaura points may be used only when the checkout balance is sufficient.",
  },
  {
    title: "Fair use",
    text: "Users should not attempt to bypass protected downloads, misuse referral rewards, or create fake activity to gain points.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary">
          Terms & Conditions
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-brand-dark">
          WildSaura Market terms for buyers and sellers.
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          These terms describe the basic rules for using WildSaura Market. They
          cover buying photos, selling photos, listing equipment, and using
          wallet points.
        </p>

        <div className="mt-10 space-y-5">
          {terms.map((term) => (
            <div key={term.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="text-lg font-semibold text-brand-dark">{term.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{term.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
