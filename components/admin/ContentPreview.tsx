"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import HomePanel from "@/components/catalog/HomePanel";
import OrderPanel from "@/components/catalog/OrderPanel";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import type { WebsiteContent } from "@/lib/website-content";

export default function ContentPreview({ content, desktop = false }: { content: WebsiteContent; desktop?: boolean }) {
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [section, setSection] = useState("home");
  const frame = useRef<HTMLIFrameElement>(null);
  const prepareFrame = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    doc.documentElement.className = document.documentElement.className;
    doc.head.querySelectorAll('[data-content-preview-style]').forEach(node => node.remove());
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      const copy = node.cloneNode(true) as HTMLElement;
      copy.setAttribute("data-content-preview-style", "");
      doc.head.appendChild(copy);
    });
    setBody(doc.body);
  }, []);
  // srcDoc can finish loading before hydration attaches its load listener.
  useEffect(prepareFrame, [prepareFrame]);
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Preview section">
        {[['home', 'Home'], ['order', 'Ordering'], ['confirmation', 'Confirmation'], ['footer', 'Footer'], ['search', 'Search & sharing']].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)} className={`min-h-11 rounded-lg border px-3 text-sm ${section === id ? "border-cat-sage bg-cat-sage text-white" : "border-cat-ink/30 bg-white"}`}>{label}</button>
        ))}
      </div>
      <iframe
        ref={frame}
        title={desktop ? "Desktop website content preview" : "Mobile website content preview"}
        className={`mx-auto block h-[720px] max-w-full rounded-xl border-2 border-cat-ink/30 bg-cat-paper ${desktop ? "w-[1100px]" : "w-[390px]"}`}
        srcDoc={'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"></body></html>'}
        onLoad={prepareFrame}
      />
      {body && createPortal(
        <div className="min-h-screen bg-cat-wood font-cat-body text-cat-ink [overflow-wrap:anywhere]" onClickCapture={event => {
          if ((event.target as HTMLElement).closest("a")) event.preventDefault();
        }}>
          <div className="px-5 py-4 font-cat-display text-xl text-white">Jen&apos;s Gourmet Bites</div>
          {section === "footer" ? <CatalogFooter content={content} onNavigate={() => setSection("home")} /> : (
            <div className="bg-cat-paper p-5 md:p-14">
              {section === "home" && <HomePanel content={content} onBrowse={() => setSection("order")} onOrder={() => setSection("order")} />}
              {(section === "order" || section === "confirmation") && <OrderPanel content={content} picked={[]} onRemove={() => {}} onBrowse={() => setSection("home")} preview previewSuccess={section === "confirmation"} />}
              {section === "search" && (
                <div className="space-y-8 break-words">
                  <div><h3 className="mb-3 text-sm font-semibold">Search result preview</h3><p className="text-xl text-blue-800">{content.siteTitle}</p><p className="mt-2">{content.siteDescription}</p></div>
                  <div className="rounded-lg border border-cat-ink/30 p-4"><h3 className="mb-3 text-sm font-semibold">Shared link preview</h3><p className="text-xl font-semibold">{content.shareTitle}</p><p className="mt-2">{content.shareDescription}</p></div>
                  <p className="text-sm">Search engines and social apps may shorten or rewrite these snippets.</p>
                </div>
              )}
            </div>
          )}
        </div>, body,
      )}
    </div>
  );
}
