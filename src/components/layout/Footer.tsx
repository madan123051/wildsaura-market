"use client";

import Link from "next/link";
import { Leaf, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { DRISHYA_APP_URL } from "@/types";

const EXPLORE_LINKS = [
  { label: "Nature", href: "/explore?category=nature" },
  { label: "Wildlife", href: "/explore?category=wildlife" },
  { label: "Landscape", href: "/explore?category=landscape" },
  { label: "Culture", href: "/explore?category=culture" },
  { label: "Adventure", href: "/explore?category=adventure" },
  { label: "Street", href: "/explore?category=street" },
  { label: "Aerial", href: "/explore?category=aerial" },
  { label: "Macro", href: "/explore?category=macro" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const PHOTOGRAPHER_LINKS = [
  { label: "Sell on Drishya", href: DRISHYA_APP_URL, external: true },
  { label: "Pricing", href: "#" },
  { label: "FAQ", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Twitter", icon: Twitter, href: "#" },
  { label: "YouTube", icon: Youtube, href: "#" },
];

function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6 text-brand-secondary" />
              <span className="font-heading text-xl font-bold text-white">WildSaura</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Nepal&apos;s premier stock photography marketplace. Discover stunning visuals captured
              by talented local photographers.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-gray-400 hover:bg-brand-primary hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-secondary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Photographers Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              For Photographers
            </h3>
            <ul className="space-y-2.5">
              {PHOTOGRAPHER_LINKS.map((link) => (
                <li key={link.label}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-brand-secondary transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-brand-secondary transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={DRISHYA_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-brand-secondary text-brand-dark text-sm font-semibold rounded-lg hover:bg-brand-secondary/90 transition-colors"
            >
              Start Selling
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} WildSaura. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Made with <span className="text-red-500">❤️</span> in Nepal
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
export { Footer };
