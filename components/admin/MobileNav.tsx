"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DollarSign, Home, Inbox, LogOut, MoreHorizontal, Package, StickyNote, X } from "lucide-react";
import { disableDevicePush } from "./PushSettings";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/inquiries", label: "Inquiries", Icon: Inbox },
  { href: "/admin/content", label: "Content", Icon: StickyNote },
  { href: "/admin/pricing", label: "Pricing", Icon: DollarSign },
];

export default function MobileNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    try {
      await disableDevicePush();
    } catch {
      window.alert("Notifications could not be disabled. Please try signing out again while online.");
      return;
    }
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const tab =
    "flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-cat-paper p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(40,22,10,.3)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-cat-hand text-2xl text-primary-700">{userEmail ?? "More"}</p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex min-h-[56px] items-center gap-3 rounded-xl px-3 text-base font-semibold"
            >
              <Home className="h-5 w-5" /> View site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 text-base font-semibold text-cat-stamp"
            >
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </div>
        </div>
      )}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 bg-cat-ink pb-[env(safe-area-inset-bottom)] text-[#FFF8E8] shadow-[0_-4px_0_rgba(74,46,31,.25)] lg:hidden"
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${tab} ${active ? "text-cat-tape" : ""}`}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className={tab} aria-haspopup="dialog">
          <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
          More
        </button>
      </nav>
    </>
  );
}
