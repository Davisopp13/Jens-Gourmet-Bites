import Image from "next/image";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center bg-primary-900 overflow-hidden py-16 lg:py-0 px-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-800/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-accent/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="container-custom grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        {/* Content Side */}
        <div className="text-white order-2 lg:order-1 text-center lg:text-left">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1] text-balance">
            Handcrafted <br />
            <span className="text-cream-300 italic font-medium">with Love</span>
          </h1>
          <p className="text-lg md:text-xl text-cream-100/90 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Gourmet cookies made fresh in Johns Creek, Georgia. Choose from our
            selection of artisan cookies, available as fresh-baked treats or
            convenient frozen dough.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="#products"
              className="px-8 py-4 bg-accent text-white font-medium rounded-lg hover:bg-accent-600 transition-all duration-300 hover:scale-105 text-center shadow-lg shadow-accent/20"
            >
              Explore Our Cookies
            </a>
            <a
              href="#contact"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 text-center"
            >
              Place an Order
            </a>
          </div>
        </div>

        {/* Image Side - Fixed to show whole square image */}
        <div className="relative order-1 lg:order-2 w-full max-w-[500px] lg:max-w-none mx-auto">
          {/* Decorative frame elements to make it 'fit cleanly' */}
          <div className="absolute -inset-4 border-2 border-cream-300/10 rounded-3xl -rotate-1 hidden sm:block" />
          <div className="absolute -inset-4 border-2 border-accent/10 rounded-3xl rotate-2 hidden sm:block" />

          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <Image
              src="/images/hero-jen-cookies.jpg"
              alt="Jen with freshly baked cookies"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <a
          href="#featured"
          aria-label="Scroll to featured products"
          className="text-white/40 hover:text-white transition-colors"
        >
          <ArrowDown className="w-6 h-6" />
        </a>
      </div>
    </section>
  );
}
