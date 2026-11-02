"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from "@/lib/website-content";
import HomePanel from "./HomePanel";
import CookiesPanel from "./CookiesPanel";
import OrderPanel from "./OrderPanel";
import CatalogFooter from "./CatalogFooter";

export type TabId = "home" | "cookies" | "order";

const TABS: { id: TabId; label: string; bg: string; delay: string }[] = [
  { id: "home", label: "Home", bg: "bg-cat-paper", delay: "0.15s" },
  { id: "cookies", label: "Cookies", bg: "bg-cat-butter", delay: "0.25s" },
  { id: "order", label: "Order", bg: "bg-cat-blush", delay: "0.35s" },
];

interface CatalogSiteProps {
  products: Product[];
  content?: WebsiteContent;
}

export default function CatalogSite({ products, content = DEFAULT_WEBSITE_CONTENT }: CatalogSiteProps) {
  const [tab, setTab] = useState<TabId>("home");
  const [picks, setPicks] = useState<string[]>([]);
  const [bump, setBump] = useState(false);
  const [stamped, setStamped] = useState<string | null>(null);
  const stampTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the tab in the URL hash so links like /#cookies and /#order work.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "cookies" || h === "order" || h === "home") setTab(h);
      if (h === "products") setTab("cookies");
      if (h === "contact") setTab("order");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    return () => {
      if (stampTimer.current) clearTimeout(stampTimer.current);
    };
  }, []);

  const goTo = useCallback((next: TabId) => {
    setTab(next);
    window.history.replaceState(null, "", next === "home" ? " " : `#${next}`);
  }, []);

  const togglePick = useCallback(
    (id: string) => {
      if (picks.includes(id)) {
        setPicks(picks.filter((p) => p !== id));
        return;
      }
      setPicks([...picks, id]);
      setBump((b) => !b);
      setStamped(id);
      if (stampTimer.current) clearTimeout(stampTimer.current);
      stampTimer.current = setTimeout(() => setStamped(null), 1400);
    },
    [picks]
  );

  const pickedProducts = picks
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  return (
    <div className="min-h-screen overflow-hidden bg-cat-wood font-cat-body text-cat-ink [overflow-wrap:anywhere] [background-image:repeating-linear-gradient(90deg,rgba(74,46,31,.08)_0_2px,transparent_2px_38px)]">
      <header className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-4 py-4 text-[#FFF8E8] sm:px-6 sm:py-6">
        <Link href="/" className="font-cat-display text-xl sm:text-2xl md:text-[28px]">
          Jen&apos;s Gourmet Bites
        </Link>
        <div className="flex items-center gap-3" aria-live="polite">
          <span className="hidden font-cat-hand text-2xl font-bold sm:inline">on your order card:</span>
          <span
            key={picks.length}
            aria-label={`${picks.length} on your order card`}
            className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-full bg-[#FFF8E8] font-cat-display text-[22px] text-cat-ink ${
              bump ? "cat-bump-a" : "cat-bump-b"
            }`}
          >
            {picks.length}
          </span>
        </div>
      </header>

      <main id="main" className="cat-drawer mx-auto max-w-[1160px] px-4 pb-10 md:px-6">
        <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1.5 pl-4 md:pl-7">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                onClick={() => goTo(t.id)}
                style={{ animationDelay: t.delay }}
                className={`cat-tab min-h-[44px] cursor-pointer rounded-t-[14px] font-cat-hand text-[26px] font-bold text-cat-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cat-sage ${t.bg} ${
                  active ? "px-7 pb-3.5 pt-2.5" : "px-6 pb-1.5 pt-1.5"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative min-h-[560px] rounded-xl bg-cat-paper p-5 shadow-[0_14px_30px_rgba(40,22,10,.35)] [background-image:repeating-linear-gradient(transparent_0_39px,#C9DCE8_39px_40px)] md:p-14">
          <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="cat-panel">
            {tab === "home" && <HomePanel content={content} onBrowse={() => goTo("cookies")} onOrder={() => goTo("order")} />}
            {tab === "cookies" && (
              <CookiesPanel
                products={products}
                picks={picks}
                stamped={stamped}
                onToggle={togglePick}
                onOrder={() => goTo("order")}
              />
            )}
            {tab === "order" && (
              <OrderPanel
                content={content}
                picked={pickedProducts}
                onRemove={(id) => setPicks((prev) => prev.filter((p) => p !== id))}
                onBrowse={() => goTo("cookies")}
              />
            )}
          </div>
        </div>
      </main>

      <CatalogFooter onNavigate={goTo} content={content} />
    </div>
  );
}
