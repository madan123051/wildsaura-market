import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-brand-dark text-gray-400 py-12 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="font-heading text-xl font-bold text-white mb-2">🌿 WildSaura</p>
            <p className="text-sm leading-relaxed">
              Nepal's premier stock photo marketplace. Empowering local photographers to earn from their craft globally.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-3">Explore</p>
            <ul className="space-y-2 text-sm">
              {["nature", "culture", "wildlife", "food", "adventure"].map((cat) => (
                <li key={cat}>
                  <Link href={`/explore?category=${cat}`} className="capitalize hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-white font-semibold mb-3">Support</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li>
                <a href="mailto:support@wildsaura.com" className="hover:text-white transition-colors">
                  support@wildsaura.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} WildSaura Market. Made with ❤️ in Nepal.
        </div>
      </div>
    </footer>
  );
}
