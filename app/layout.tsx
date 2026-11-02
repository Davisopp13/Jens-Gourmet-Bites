import type { Metadata, Viewport } from "next";
import { Young_Serif, Caveat, Lora } from "next/font/google";
import SitePwa from "@/components/SitePwa";
import "./globals.css";

const youngSerif = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-young-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#4a2e1f" };

export const metadata: Metadata = {
  title: "Jen's Gourmet Bites | Artisan Cookies in Johns Creek, GA",
  description:
    "Handcrafted gourmet cookies made with love in Johns Creek, GA. Available as fresh-baked or frozen dough. Serving Metro Atlanta.",
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, title: "Jen's Cookies", statusBarStyle: "default" },
  icons: { apple: "/site-icons/recipe-cookie-apple.png" },
  keywords: ["cookies", "gourmet", "bakery", "Johns Creek", "Atlanta", "frozen dough", "baked cookies"],
  openGraph: {
    title: "Jen's Gourmet Bites | Artisan Cookies",
    description: "Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${youngSerif.variable} ${caveat.variable} ${lora.variable}`}>
      <body className="font-body bg-cream text-espresso antialiased">
        <SitePwa />
        {children}
      </body>
    </html>
  );
}
