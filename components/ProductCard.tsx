import Image from "next/image";
import { Snowflake, Flame, Star, Nut } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice, truncateText } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  return (
    <div
      className={`card group ${
        featured ? "ring-2 ring-accent ring-offset-2" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-primary-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100">
            <span className="text-6xl">🍪</span>
          </div>
        )}

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-accent text-white px-3 py-1 rounded-full text-sm font-medium">
            <Star className="w-4 h-4 fill-current" />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl text-primary mb-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>

        <p className="text-primary-600 text-sm mb-4 leading-relaxed">
          {truncateText(product.description, 100)}
        </p>

        {/* Format Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {product.available_frozen && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              <Snowflake className="w-3 h-3" />
              Frozen Dough
            </span>
          )}
          {product.available_baked && (
            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              Fresh Baked
            </span>
          )}
          {product.has_pecan_option && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              <Nut className="w-3 h-3" />
              Pecan Option
            </span>
          )}
        </div>

        {/* Price and Batch Size */}
        <div className="flex items-end justify-between pt-3 border-t border-primary-100">
          <div>
            <span className="text-2xl font-display text-primary">
              {formatPrice(product.price_cents)}
            </span>
            <span className="text-sm text-primary-500 ml-1">
              / batch of {product.batch_size}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
