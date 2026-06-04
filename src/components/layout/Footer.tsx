"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { ChevronDown, Leaf, Facebook, Instagram, Twitter, Youtube, Package, Camera } from "lucide-react";

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
  { label: "Pricing", href: "#" },
  { label: "FAQ", href: "#" },
];

const MARKETPLACE_LINKS = [
  { label: "Shop Equipment", href: "/shopping" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Twitter", icon: Twitter, href: "#" },
  { label: "YouTube", icon: Youtube, href: "#" },
];

type FooterLink = {
  label: string;
  href: string;
};

type MobileAccordionSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function MobileAccordionSection({ id, title, children }: MobileAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = `${id}-content`;

  return (
    <div className="border-t border-white/10 last:border-b">
      <button
        type="button"
        id={id}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:text-brand-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
      >
        <span>{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={id}
        aria-hidden={!isOpen}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out ${
          isOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FooterLinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-14 lg:px-8">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="mb-4">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <Leaf className="h-6 w-6 text-brand-secondary" />
              <span className="font-heading text-xl font-bold text-white">WildSaura</span>
            </Link>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Nepal&apos;s premier stock photography marketplace.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-gray-400 transition-colors hover:bg-brand-primary hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Footer navigation">
            <MobileAccordionSection id="footer-explore" title="Explore">
              <FooterLinkList links={EXPLORE_LINKS} />
            </MobileAccordionSection>

            <MobileAccordionSection id="footer-company" title="Company">
              <FooterLinkList links={COMPANY_LINKS} />
            </MobileAccordionSection>

            <MobileAccordionSection id="footer-photographers" title="For Photographers">
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/upload"
                    className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                  >
                    Sell Photos
                  </Link>
                </li>
                {PHOTOGRAPHER_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </MobileAccordionSection>

            <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-t border-white/10 py-3">
              <Link
                href="/shopping/sell"
                className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-brand-secondary"
              >
                <Package className="h-4 w-4" />
                Sell Equipment
              </Link>
              {MARKETPLACE_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Desktop Layout */}
        <div className="hidden grid-cols-1 gap-10 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Leaf className="h-6 w-6 text-brand-secondary" />
              <span className="font-heading text-xl font-bold text-white">WildSaura</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-gray-400 transition-colors hover:bg-brand-primary hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <FooterLinkList links={EXPLORE_LINKS} />
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For Photographers Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              For Photographers
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/upload"
                  className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                >
                  Sell Photos
                </Link>
              </li>
              {PHOTOGRAPHER_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Marketplace
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/shopping/sell"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                >
                  <Package className="h-4 w-4" />
                  Sell Equipment
                </Link>
              </li>
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-brand-secondary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-3">
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
