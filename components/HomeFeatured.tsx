import Image from "next/image";
import Link from "next/link";

export default function HomeFeatured({ products }: { products?: any[] }) {
  const fallbackProducts = [
    {
      id: "fallback-1",
      name: "Player Edition T-Shirt",
      price: 199000,
      tag: "Newest Drop",
      image:
        "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fallback-2",
      name: "Regular Logo T-Shirt",
      price: 159000,
      tag: "Essential",
      image:
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fallback-3",
      name: "Vintage Stage Series",
      price: 0,
      tag: "Limited",
      image:
        "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const displayProducts =
    products && products.length > 0 ? products : fallbackProducts;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d7ff53]">
            Featured Collection
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-[0.95] md:text-6xl">
            Latest Drop
          </h2>
        </div>
        <Link
          href="/products"
          className="text-sm font-black uppercase tracking-widest text-white/60 transition hover:text-[#d7ff53]"
        >
          View All →
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {displayProducts.map((product: any) => {
          const isComingSoon =
            product.price === 0 || product.category === "Coming Soon";

          return (
            <Link
              key={product.id}
              href={isComingSoon ? "/products" : `/products/${product.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5">
                <Image
                  src={
                    product.image ||
                    product.product_images?.[0]?.image_url ||
                    fallbackProducts[0].image
                  }
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-[#d7ff53] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                    {product.tag || product.category || "Merch"}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="line-clamp-2 text-lg font-black uppercase leading-tight">
                    {product.name}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 min-h-[3rem] text-sm text-white/55">
                  {product.description ||
                    "Official merchandise WALI dengan kualitas premium."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <p className="text-lg font-black">
                    {isComingSoon ? (
                      <span className="text-[#d7ff53]">Coming Soon</span>
                    ) : (
                      `Rp${(product.price || 0).toLocaleString("id-ID")}`
                    )}
                  </p>
                  <span className="text-sm font-black text-[#d7ff53]">→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}