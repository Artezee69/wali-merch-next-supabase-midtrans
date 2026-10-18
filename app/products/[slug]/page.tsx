import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import ProductImageGallery from "@/components/ProductImageGallery";
import AddToCartBox from "@/components/AddToCartBox";
import ProductCard from "@/components/ProductCard";
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
  size: string | null;
  option_1_name: string | null;
  option_1_value: string | null;
  option_2_name: string | null;
  option_2_value: string | null;
  stock: number;
  price: number | null;
  sale_price: number | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  base_price?: number | null;    // Harga asli (untuk diskon)
  sale_price?: number | null;   // Harga diskon
  image_url: string | null;
  category: string | null;
  fit: string | null;
  status: string | null;
  is_active: boolean | null;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
  soldCount?: number;           // Jumlah terjual (opsional)
  rating?: {                    // Rating ulasan (opsional)
    avg: number;
    count: number;
  };
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

interface VariantForCart {
  id: string;
  color: string | null;
  size: string | null;
  stock: number;
  option_1_name?: string | null;
  option_2_name?: string | null;
}

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
        option_1_name,
        option_1_value,
        option_2_name,
        option_2_value,
        stock,
        is_active,
        price,
        sale_price
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
    (variant: any) => (variant as any).is_active !== false
  );

  const totalStock = variants.reduce(
    (total, variant) => total + Number(variant.stock || 0),
    0
  );

  // Discount detection - determine effective price and discount info
  const hasDiscount = Boolean(
    product.base_price != null &&
    product.sale_price != null &&
    Number(product.sale_price) < Number(product.base_price)
  );
  const effectivePrice = hasDiscount ? Number(product.sale_price) : Number(product.price);

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

  // Fetch semua product lain (excl current) untuk catalog produk terkait
  let relatedProducts: Product[] = [];
  const { data: related, error: relatedError } = await supabaseAdmin
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
        option_1_name,
        option_1_value,
        option_2_name,
        option_2_value,
        stock
      )
    `
    )
    .neq("id", product.id);
  if (!relatedError && related) {
    relatedProducts = related as Product[];
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Cinematic ambient backdrop — desktop only (mobile: no blur cost) */}
      <div className="hidden pointer-events-none absolute inset-0 -z-10 sm:block">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#d7ff53]/8 blur-[140px] animate-aurora-1" />
        <div className="absolute -right-32 top-2/3 h-96 w-96 rounded-full bg-[#5e8bff]/8 blur-[140px] animate-aurora-2" />
        <div className="absolute inset-0 bg-grid-fade [background-size:64px_64px] opacity-[0.18]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505]" />
      </div>

      {/* Top action bar */}
      <section className="relative border-b border-white/10 bg-gradient-to-b from-[#10150a] via-[#0a0a0a] to-[#050505]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-5 py-4 sm:py-5">
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
      <section className="relative mx-auto grid max-w-7xl gap-6 sm:gap-10 px-4 sm:px-5 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <ProductImageGallery
            productName={product.name}
            images={sortedGalleryImages}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-4 sm:mb-8 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/[0.04] px-3 sm:px-5 py-2 sm:py-3 text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.35em] text-[#d7ff53] sm:backdrop-blur-md">
            <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#d7ff53] animate-pulse-soft" />
            Product Detail
          </div>

          <h1 className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-3xl sm:text-5xl md:text-6xl font-black uppercase leading-[0.95] tracking-tight text-transparent">
            {product.name}
          </h1>

          <div className="mt-4 sm:mt-7 flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Price display with optional discount */}
            {(product.base_price !== undefined && product.base_price != null &&
                product.sale_price !== undefined &&
                product.sale_price != null &&
                Number(product.sale_price) < Number(product.base_price))
              ? (
                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    {/* Original price (strikethrough) */}
                    <span className="font-display text-sm sm:text-base font-black text-gray-400 line-through">
                      {rupiah(product.base_price)}
                    </span>
                    {/* Sale price prominent */}
                    <span className="font-display text-sm sm:text-lg font-black text-[#d7ff53] px-3 sm:px-5 py-1.5 sm:py-3 rounded-full shadow-[0_0_24px_-6px_rgba(215,255,83,0.5)] bg-[#d7ff53] text-black">
                      {rupiah(product.sale_price)}
                    </span>
                    {/* Discount percentage badge */}
                    <span className="text-xs sm:text-sm font-bold bg-red-500/20 text-red-400 px-1.5 sm:px-2 py-0.5 rounded">
                      {Math.round(((Number(product.base_price) - Number(product.sale_price)) / Number(product.base_price)) * 100)}%
                    </span>
                  </div>
              ) : (
                <span className="rounded-full bg-[#d7ff53] px-3 sm:px-5 py-1.5 sm:py-3 text-sm sm:text-xl font-black text-black shadow-[0_0_24px_-6px_rgba(215,255,83,0.5)]">
                  {rupiah(Number(product.price))}
                </span>
              )}

            <span className="rounded-full border border-white/10 bg-white/5 px-3 sm:px-5 py-1.5 sm:py-3 text-xs sm:text-sm font-black uppercase text-white sm:backdrop-blur-sm">
              Stock: {totalStock} PCS
            </span>
          </div>

          {product.description && (
            <p className="mt-8 text-lg leading-relaxed text-white/70">
              {product.description}
            </p>
          )}

          <div className="mt-5 sm:mt-9 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 sm:backdrop-blur-sm transition-all duration-500 sm:hover:border-white/20 sm:hover:bg-white/[0.05]">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
                Category
              </p>
              <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm font-black uppercase text-white">
                {product.category || "Merch"}
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 sm:backdrop-blur-sm transition-all duration-500 sm:hover:border-white/20 sm:hover:bg-white/[0.05]">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
                Fit
              </p>
              <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm font-black uppercase text-white">
                {product.fit || "Regular"}
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 sm:backdrop-blur-sm transition-all duration-500 sm:hover:border-white/20 sm:hover:bg-white/[0.05]">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
                Status
              </p>
              <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm font-black uppercase text-[#d7ff53]">
                {normalizeStatus(product.status)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            {(() => {
              const sampleVariant = variants[0];
              return (
                <AddToCartBox
                  productId={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={effectivePrice}
                  image={sortedGalleryImages[0]?.image_url || product.image_url || ""}
                  option1Label={sampleVariant?.option_1_name || "Color"}
                  option2Label={sampleVariant?.option_2_name || "Size"}
                  variants={variants.map((variant) => {
                    // Only use the actual variant values, don't fall back to color/size fields indiscriminately
                    const opt1Value = variant.option_1_value !== null ? variant.option_1_value : null;
                    const opt2Value = variant.option_2_value !== null ? variant.option_2_value : null;

                    return {
                      id: variant.id,
                      option1: opt1Value,
                      option2: opt2Value,
                      legacyColor: variant.color || null,
                      stock: Number(variant.stock || 0),
                      price: Number(variant.sale_price ?? variant.price ?? effectivePrice),
                    };
                  })}
                />
              );
            })()}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-5">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-8">Produk Terkait</h2>
            {/* Horizontal scroll container - katalog produk (sama seperti di /products) */}
            <div className="flex gap-6 overflow-x-auto pb-4 pr-2">
              {relatedProducts.map((p, i) => (
                <div key={p.id} className="flex-shrink-0 w-72">
                  <ProductCard product={p as any} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}