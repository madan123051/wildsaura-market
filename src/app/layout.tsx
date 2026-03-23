import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-brand-light text-brand-dark min-h-screen flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#0D1B2A",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
