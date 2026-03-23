import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "WildSaura Market – Nepal's Stock Photo Marketplace",
    template: "%s | WildSaura Market",
  },
  description: "Discover and license stunning photography from Nepal's best photographers. Nature, wildlife, culture & more.",
  keywords: ["Nepal photography", "stock photos", "buy photos", "nature photography Nepal"],
  openGraph: {
    type: "website",
    locale: "en_NP",
    url: "https://wildsaura.com",
    siteName: "WildSaura Market",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface-light text-brand-dark antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: "12px", background: "#0D1B2A", color: "#fff" },
          }}
        />
      </body>
    </html>
  );
}
