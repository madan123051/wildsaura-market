import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ClientProviders from "@/components/ClientProviders";
import MarketChatbot from "@/components/MarketChatbot";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WildSaura Market | Nepal's Stock Photography Marketplace",
  description:
    "Discover and buy stunning stock photography from Nepal's finest photographers. Nature, wildlife, landscape, culture and more.",
  keywords: [
    "stock photography",
    "Nepal photos",
    "nature photography",
    "wildlife images",
    "buy photos online",
    "WildSaura",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-brand-light text-brand-dark min-h-screen flex flex-col">
        <ClientProviders>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <MarketChatbot />
        </ClientProviders>
      </body>
    </html>
  );
}
