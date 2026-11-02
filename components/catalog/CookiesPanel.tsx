import Image from "next/image";
import { Cookie } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice, truncateText } from "@/lib/utils";

interface CookiesPanelProps {
  products: Product[];
  picks: string[];
  stamped: string | null;
  onToggle: (id: string) => void;
  onOrder: () => void;
}

// Each index card gets its own paper colour and a slight resting tilt.
const CARD_STYLES = [
  { bg: "bg-cat-butter", photo: "bg-[#F6E3B6]", r: "-1.5deg" },
  { bg: "bg-cat-mint", photo: "bg-[#EAF0DC]", r: "1.2deg" },
  { bg: "bg-cat-blush", photo: "bg-[#F9DDD1]", r: "-0.8deg" },
  { bg: "bg-cat-sky", photo: "bg-[#E2EEF5]", r: "1.6deg" },
];

export default function CookiesPanel({ products, picks, stamped, onToggle, onOrder }: CookiesPanelProps) {
  return (
    <div>
      <div className="inline-block px-2 font-cat-hand text-3xl font-bold text-cat-rust">
        Recipe No. 2 · the whole drawer
      </div>

      {products.length === 0 ? (
        <p className="mt-6 px-2 text-lg">
          The drawer is empty at the moment. Check back soon!
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            const picked = picks.includes(product.id);
            return (
              <div
                key={product.id}
                className="cat-idx"
                style={{ ["--r" as string]: style.r, animationDelay: `${0.05 + i * 0.12}s` }}
              >
                {stamped === product.id && (
                  <div className="cat-stamp font-cat-display text-[30px]" aria-hidden="true">
                    ADDED!
                  </div>
                )}
                <div className={`flex h-full flex-col rounded-md p-[18px] shadow-[0_6px_14px_rgba(40,22,10,.3)] ${style.bg}`}>
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="font-cat-display text-[22px] leading-tight">{product.name}</h3>
                    {product.is_featured && (
                      <span className="shrink-0 rounded-full border-2 border-cat-ink bg-cat-tape px-2 text-xs font-semibold">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className={`relative aspect-[4/3] overflow-hidden ${style.photo}`}>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-cat-rust">
                        <Cookie className="h-12 w-12" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{truncateText(product.description, 100)}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                    {product.available_baked && <li className="rounded-full bg-cat-paper px-2 py-0.5">Fresh baked</li>}
                    {product.available_frozen && <li className="rounded-full bg-cat-paper px-2 py-0.5">Frozen dough</li>}
                    {product.has_pecan_option && <li className="rounded-full bg-cat-paper px-2 py-0.5">Pecan option</li>}
                  </ul>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div>
                      <span className="font-cat-hand text-[28px] font-bold leading-none">
                        {formatPrice(product.price_cents)}
                      </span>
                      <span className="ml-1 text-xs">/ batch of {product.batch_size}</span>
                    </div>
                    <button
                      onClick={() => onToggle(product.id)}
                      aria-pressed={picked}
                      aria-label={`${picked ? "Remove" : "Add"} ${product.name} ${picked ? "from" : "to"} order card`}
                      className="min-h-[44px] cursor-pointer px-1.5 font-cat-hand text-[26px] font-bold text-cat-sage transition-transform hover:-rotate-3 hover:scale-110 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cat-sage"
                    >
                      {picked ? "added ✓" : "add +"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {picks.length > 0 && (
        <div className="mt-8">
          <button
            onClick={onOrder}
            className="cat-btn min-h-[48px] cursor-pointer rounded-lg bg-cat-sage px-7 py-3.5 text-lg font-semibold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cat-sage"
          >
            Send my order card ({picks.length})
          </button>
        </div>
      )}
    </div>
  );
}
