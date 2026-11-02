import Image from "next/image";

interface HomePanelProps {
  onBrowse: () => void;
  onOrder: () => void;
}

const crumbs = [
  { left: "12%", size: 7, delay: "0s" },
  { left: "30%", size: 5, delay: "1.1s" },
  { left: "52%", size: 8, delay: "2.2s" },
  { left: "74%", size: 5, delay: "0.6s" },
  { left: "90%", size: 6, delay: "3s" },
];

export default function HomePanel({ onBrowse, onOrder }: HomePanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-10 lg:gap-12">
      <div className="relative min-w-0 flex-[1_1_420px]">
        <div className="inline-block border-b-[3px] border-[#D0584A] bg-cat-paper px-2 font-cat-hand text-3xl font-bold text-cat-rust">
          Recipe No. 1
        </div>
        <h1 className="my-3 inline-block bg-cat-paper px-2 py-1.5 font-cat-display text-5xl font-normal leading-[1.08] md:text-[68px]">
          <span className="cat-w1">Cookies,</span> <span className="cat-w2">from</span>{" "}
          <span className="cat-w3">scratch.</span>
        </h1>
        <p className="mb-5 block max-w-[500px] bg-cat-paper px-2 py-1 text-[19px] leading-[1.7]">
          Gourmet cookies made fresh in Johns Creek, Georgia. Choose from our selection of artisan
          cookies, available as fresh-baked treats or convenient frozen dough.
        </p>
        <div className="flex flex-wrap gap-3.5 pl-2">
          <button
            onClick={onBrowse}
            className="cat-btn min-h-[48px] cursor-pointer rounded-lg bg-cat-sage px-7 py-3.5 text-lg font-semibold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cat-sage"
          >
            Flip through the recipes
          </button>
          <button
            onClick={onOrder}
            className="cat-btn min-h-[48px] cursor-pointer rounded-lg border-2 border-dashed border-cat-ink bg-cat-paper px-6 py-3 text-lg font-semibold text-cat-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cat-sage"
          >
            Place an order
          </button>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-2.5 h-px">
          {crumbs.map((c) => (
            <span
              key={c.left}
              className="cat-crumb"
              style={{ left: c.left, width: c.size, height: c.size, animationDelay: c.delay }}
            />
          ))}
        </div>
      </div>

      <div className="relative mx-auto min-w-0 max-w-[440px] flex-[1_1_360px]">
        <div className="cat-polaroid bg-white px-4 pb-14 pt-4 shadow-[0_8px_20px_rgba(74,46,31,.3)]">
          <div className="relative aspect-square w-full overflow-hidden bg-[#D9B98A]">
            <Image
              src="/images/hero-jen-cookies.jpg"
              alt="Jen with freshly baked cookies"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1023px) min(440px, 90vw), 440px"
            />
          </div>
          <div className="mt-2 text-center font-cat-hand text-[32px] font-bold">Jen, mid-bake</div>
        </div>
        <div
          aria-hidden="true"
          className="cat-tape absolute -top-3.5 left-1/2 -ml-12 h-[30px] w-24 bg-cat-tape/85"
        />
      </div>

      <div className="cat-note relative mt-5 min-w-0 flex-[1_1_100%] bg-cat-note px-6 py-7 shadow-[0_8px_18px_rgba(74,46,31,.25)] md:px-9">
        <div
          aria-hidden="true"
          className="absolute -top-3.5 left-[12%] h-[30px] w-24 bg-[rgba(208,88,74,.55)]"
        />
        <div className="font-cat-hand text-[30px] font-bold text-cat-rust">a note from Jen</div>
        <p className="mt-1 font-cat-display text-2xl leading-[1.4] md:text-[28px]">
          &ldquo;What started as a passion for baking in my Johns Creek kitchen has grown into a
          labor of love that I&apos;m thrilled to share with you. Each cookie is made from scratch
          using family recipes and the finest ingredients, because you deserve nothing less than
          the best.&rdquo;
        </p>
        <p className="mt-3 text-base leading-relaxed">
          Proudly serving Metro Atlanta. Local pickup available, and we can arrange delivery for
          larger orders.
        </p>
      </div>
    </div>
  );
}
