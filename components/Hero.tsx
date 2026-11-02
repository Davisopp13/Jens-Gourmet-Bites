import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-cream py-12 lg:py-10">
      <div className="container-custom grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Content Side */}
        <div className="text-primary order-2 lg:order-1 text-center lg:text-left">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1] text-balance">
            Handcrafted <br />
            <span className="italic font-medium">with Love</span>
          </h1>
          <p className="text-lg md:text-xl text-espresso mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Gourmet cookies made fresh in Johns Creek, Georgia. Choose from our
            selection of artisan cookies, available as fresh-baked treats or
            convenient frozen dough.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="#products"
              className="btn-primary px-8 py-4 text-center"
            >
              Explore Our Cookies
            </a>
            <a
              href="#contact"
              className="btn-secondary px-8 py-4 text-center"
            >
              Place an Order
            </a>
          </div>
        </div>

        {/* Keep the original square photo intact, with a peach frame. */}
        <div className="relative order-1 lg:order-2 w-full max-w-[500px] lg:max-w-none mx-auto">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-[3px] border-accent">
            <Image
              src="/images/hero-jen-cookies.jpg"
              alt="Jen with freshly baked cookies"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1023px) min(500px, 100vw), 50vw"
            />
          </div>
        </div>
      </div>

    </section>
  );
}
