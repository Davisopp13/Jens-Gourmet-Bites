import { Mail, MapPin } from "lucide-react";
import type { TabId } from "./CatalogSite";

interface CatalogFooterProps {
  onNavigate: (tab: TabId) => void;
}

export default function CatalogFooter({ onNavigate }: CatalogFooterProps) {
  const linkClass =
    "min-h-[44px] cursor-pointer text-left underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cat-tape";

  return (
    <footer className="bg-cat-ink px-6 py-10 text-[#FFF3D6]">
      <div className="mx-auto grid max-w-[1160px] gap-8 md:grid-cols-3">
        <div>
          <div className="font-cat-display text-2xl">Jen&apos;s Gourmet Bites</div>
          <p className="mt-3 text-sm leading-relaxed">
            Handcrafted gourmet cookies made with love. Available as fresh-baked or frozen dough.
          </p>
        </div>
        <div>
          <h2 className="font-cat-hand text-3xl font-bold text-cat-tape">Find Jen</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              Johns Creek, GA · Serving Metro Atlanta
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href="mailto:jensgourmetbites@gmail.com" className="underline-offset-4 hover:underline">
                jensgourmetbites@gmail.com
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
        <p>
          Website by{" "}
          <a
            href="https://docodelab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-cat-tape"
          >
            DO Code Lab
          </a>
        </p>
      </div>
    </footer>
  );
}
