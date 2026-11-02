import { Mail, MapPin } from "lucide-react";
import Image from "next/image";
import type { WebsiteContent } from "@/lib/website-content";
import type { TabId } from "./CatalogSite";

interface CatalogFooterProps {
  onNavigate: (tab: TabId) => void;
  content: WebsiteContent;
}

export default function CatalogFooter({ onNavigate, content }: CatalogFooterProps) {
  const linkClass =
    "min-h-[44px] cursor-pointer text-left underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cat-tape";

  return (
    <footer className="bg-cat-ink px-6 py-10 text-[#FFF3D6]">
      <div className="mx-auto grid max-w-[1160px] gap-8 md:grid-cols-3">
        <div>
          <div className="font-cat-display text-2xl">Jen&apos;s Gourmet Bites</div>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed">
            {content.footerDescription}
          </p>
        </div>
        <div>
          <h2 className="font-cat-hand text-3xl font-bold text-cat-tape">Find Jen</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {content.serviceArea}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${content.publicEmail}`} className="break-all underline-offset-4 hover:underline">
                {content.publicEmail}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-cat-hand text-3xl font-bold text-cat-tape">Flip to…</h2>
          <ul className="mt-1 flex flex-col text-sm">
            <li><button onClick={() => onNavigate("home")} className={linkClass}>Home &amp; about Jen</button></li>
            <li><button onClick={() => onNavigate("cookies")} className={linkClass}>Our cookies</button></li>
            <li><button onClick={() => onNavigate("order")} className={linkClass}>Place an order</button></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1160px] flex-col items-center justify-between gap-3 border-t border-[#FFF3D6]/30 pt-6 text-sm md:flex-row">
        <p>&copy; {new Date().getFullYear()} Jen&apos;s Gourmet Bites. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Website by</span>
          <a
            href="https://docodelab.com"
            aria-label="DO Code Lab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm text-white opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cat-tape"
          >
            <Image
              src="/images/do-code-lab-mark.png"
              alt=""
              width={322}
              height={190}
              className="h-5 w-auto shrink-0"
            />
            <span className="whitespace-nowrap font-sans text-base font-semibold leading-none tracking-[0.08em]">CODE LAB</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
