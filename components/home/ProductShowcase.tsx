import Image from "next/image";
import Link from "next/link";
import HeadingRotator from "./ProductShowcase/HeadingRotator";
import ProductTrack from "./ProductShowcase/ProductTrack";

type Product = {
  id: string;
  name: string;
  price: number;
  tag?: string;
  category?: string;
  slug?: string;
  description?: string;
  image?: string;
  product_images?: { image_url: string }[];
  product_variants?: { size?: string; stock?: number }[];
};

const fallbackProducts: Product[] = [
  {
    id: "fb-1",
    name: "Player Edition Tee",
    price: 199000,
    tag: "Newest Drop",
    slug: "player-edition-tee",
    description: "Sablon DTF premium dengan detail player edition.",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-2",
    name: "Regular Logo Tee",
    price: 159000,
    tag: "Essential",
    slug: "regular-logo-tee",
    description: "Logo reguler warna solid, basic essential untuk daily wear.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-3",
    name: "Vintage Stage Series",
    price: 0,
    tag: "Limited",
    category: "Coming Soon",
    description: "Coming soon. Pantau terus drop selanjutnya.",
    image: "https://images.unsplash.com/photo-1506629905607-d9f297d7fbc4?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-4",
    name: "Stage Hoodie Blackout",
    price: 349000,
    tag: "Player Edition",
    slug: "stage-hoodie-blackout",
    description: "Hoodie heavyweight 400gsm dengan detail bordir punggung.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-5",
    name: "Tour Cap Snapback",
    price: 129000,
    tag: "Accessories",
    slug: "tour-cap-snapback",
    description: "Topi snapback dengan bordur logo tour resmi.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "fb-6",
    name: "Stage Crew Long Sleeve",
    price: 229000,
    tag: "Stage Crew",
    slug: "stage-crew-long-sleeve",
    description: "Long sleeve dengan print stage crew official.",
    image: "https://images.unsplash.com/photo-162244527576-721325763afe?q=80&w=600&auto=format&fit=crop",
  },
];

export default function ProductShowcase({
  products,
  description,
  ctaLabel = "Lihat semua",
  ctaUrl = "/products",
  backgroundColor = "#0b0b0b",
}: {
  products?: Product[];
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundColor?: string;
}) {
  const items = (products && products.length > 0 ? products : fallbackProducts).slice(0, 24);

  if (items.length === 0) return null;

  return (
    <section
      id="section-products"
      className="relative pt-20 pb-28 md:pt-28 md:pb-36"
      style={{ backgroundColor }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b0b0b] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b0b] to-transparent" />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes heading-pop {
          from { opacity: 0; transform: translateY(24px) scale(0.96); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* — Section header — */}
        <div className="mb-8 md:mb-12">
          {description && (
            <p className="text-[11px] text-white/40 md:text-sm">{description}</p>
          )}
          <HeadingRotator />
        </div>

        {/* — Scrollable track — */}
        <ProductTrack items={items} />

        {/* — View All CTA — */}
        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={ctaUrl}
            className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 backdrop-blur transition-all duration-300 hover:border-[#d7ff53]/40 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}