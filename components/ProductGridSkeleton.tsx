export default function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3"
        >
          <div className="aspect-[4/5] animate-pulse rounded-[1.5rem] bg-white/5" />
          <div className="space-y-3 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="flex justify-between">
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-1/4 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="h-10 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
