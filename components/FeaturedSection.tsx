import { Sparkles } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface FeaturedSectionProps {
  products: Product[];
}

export default function FeaturedSection({ products }: FeaturedSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="py-16 bg-primary-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Cookies of the Month</span>
          </div>
          <h2 className="section-heading">Featured Selections</h2>
          <p className="text-primary-600 max-w-2xl mx-auto">
            Our most popular and seasonal favorites, handpicked for your enjoyment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} featured />
          ))}
        </div>
      </div>
    </section>
  );
}
