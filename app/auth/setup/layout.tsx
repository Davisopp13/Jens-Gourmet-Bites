import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set your password | Jen's Gourmet Bites",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
