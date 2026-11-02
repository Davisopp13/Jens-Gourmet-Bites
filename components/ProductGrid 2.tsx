import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">🍪</span>
        <p className="text-primary-600 text-lg">
          No products available at the moment. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <section id="products" className="py-16 bg-cream">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-heading">Our Cookie Collection</h2>
          <p className="text-primary-600 max-w-2xl mx-auto">
            Each batch is handcrafted with premium ingredients and baked to
            perfection. Available as fresh-baked cookies or convenient frozen dough.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
