"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
export default function InquiryNav() {
  const [count, setCount] = useState<number | null>(null);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/admin/inquiries?countOnly=1", {
          cache: "no-store",
        });
        if (alive) {
          setAllowed(r.ok);
          if (r.ok) setCount((await r.json()).newCount);
        }
      } catch {}
    }
    void refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("inquiries-updated", refresh);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("inquiries-updated", refresh);
    };
  }, []);
  if (!allowed) return null;
  return (
    <Link
      href="/admin/inquiries"
      aria-label={`Inquiries${count ? `, ${count} new` : ""}`}
      className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-sm text-[#FFF8E8] transition-colors hover:bg-white/10 hover:text-cat-tape"
    >
      <Inbox className="h-4 w-4" />
      <span className="hidden sm:inline">Inquiries</span>
      {!!count && (
        <span className="rounded-full bg-cat-tape px-1.5 text-xs font-bold text-cat-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
