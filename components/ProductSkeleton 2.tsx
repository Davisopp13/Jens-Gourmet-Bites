export default function ProductSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-primary-100" />

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="h-6 bg-primary-100 rounded w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-primary-50 rounded" />
          <div className="h-4 bg-primary-50 rounded w-5/6" />
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 bg-primary-50 rounded-full w-24" />
          <div className="h-6 bg-primary-50 rounded-full w-20" />
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-primary-100">
          <div className="h-8 bg-primary-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {[...Array(6)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
