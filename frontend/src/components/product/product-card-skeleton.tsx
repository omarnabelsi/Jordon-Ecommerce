export function ProductCardSkeleton() {
  return (
    <article className="card-surface overflow-hidden border border-white/10">
      <div className="skeleton-shimmer h-52 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        <div className="skeleton-shimmer h-6 w-4/5 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-6 w-24 rounded-lg" />
          <div className="skeleton-shimmer h-5 w-16 rounded-lg" />
        </div>
      </div>
    </article>
  );
}
