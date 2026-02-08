import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jen's Gourmet Bites | Artisan Cookies in Johns Creek, GA",
  description:
    "Handcrafted gourmet cookies made with love in Johns Creek, GA. Available as fresh-baked or frozen dough. Serving Metro Atlanta.",
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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body bg-cream text-primary-800 antialiased">
        {children}
      </body>
    </html>
  );
}
