import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImageGallery from "@/components/ProductImageGallery";
import AddToCartBox from "@/components/AddToCart";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  product_id: string;
  color: string | null;
  size: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  fit: string | null;
  status: string | null;
  is_active: boolean | null;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeStatus(status?: string | null) {
  if (!status) return "READY";
  return status.replaceAll("_", " ").toUpperCase();
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `
      *,
      product_images (
        id,
        product_id,
        image_url,
        sort_order
      ),
      product_variants (
        id,
        product_id,
        color,
        size,
        stock
      )
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("PRODUCT DETAIL ERROR:", error);
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const product = data as Product;

  const variants = (product.product_variants || []).filter(
    (variant) => Number(variant.stock || 0) > 0
  );

  const totalStock = variants.reduce(
    (total, variant) => total + Number(variant.stock || 0),
    0
  );

  const galleryImages =
    product.product_images && product.product_images.length > 0
      ? product.product_images
      : product.image_url
        ? [
            {
              id: "main-image",
              product_id: product.id,
              image_url: product.image_url,
              sort_order: 0,
            },
          ]
        : [];

  const sortedGalleryImages = [...galleryImages].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Cinematic ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#d7ff53]/8 blur-[140px] animate-aurora-1" />
        <div className="absolute -right-32 top-2/3 h-96 w-96 rounded-full bg-[#5e8bff]/8 blur-[140px] animate-aurora-2" />
        <div className="absolute inset-0 bg-grid-fade [background-size:64px_64px] opacity-[0.18]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505]" />
      </div>

      {/* Top action bar */}
      <section className="relative border-b border-white/10 bg-gradient-to-b from-[#10150a] via-[#0a0a0a] to-[#050505]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-[#d7ff53] hover:text-[#d7ff53]"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
              ←
            </span>
            <span>Back</span>
          </Link>

          <Link
            href="/cart"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-black transition-transform duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Cart</span>
          </Link>
        </div>
      </section>

      {/* Detail grid */}
      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <ProductImageGallery
            productName={product.name}
            images={sortedGalleryImages}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.35em] text-[#d7ff53] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] animate-pulse-soft" />
            Product Detail
          </div>

          <h1 className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-5xl font-black uppercase leading-[0.95] tracking-tight text-transparent md:text-6xl">
            {product.name}
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#d7ff53] px-5 py-3 text-xl font-black text-black shadow-[0_0_24px_-6px_rgba(215,255,83,0.5)]">
              {rupiah(Number(product.price || 0))}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase text-white backdrop-blur-sm">
              Stock: {totalStock} PCS
            </span>
          </div>

          {product.description && (
            <p className="mt-8 text-lg leading-relaxed text-white/70">
              {product.description}
            </p>
          )}

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Category
              </p>
              <p className="mt-3 text-sm font-black uppercase text-white">
                {product.category || "Merch"}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[#d7ff53] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Fit
              </p>
              <p className="mt-3 text-sm font-black uppercase text-white">
                {product.fit || "Regular"}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[#d7ff53] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Status
              </p>
              <p className="mt-3 text-sm font-black uppercase text-[#d7ff53]">
                {normalizeStatus(product.status)}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[#d7ff53] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          </div>

          <div className="mt-8">
            <AddToCartBox
              productId={product.id}
              name={product.name}
              slug={product.slug}
              price={Number(product.price || 0)}
              image={sortedGalleryImages[0]?.image_url || product.image_url || ""}
              variants={variants.map((variant) => ({
                id: variant.id,
                color: variant.color || "Default",
                size: variant.size,
                stock: Number(variant.stock || 0),
              }))}
            />
          </div>
        </div>
      </section>
    </main>
  );
}