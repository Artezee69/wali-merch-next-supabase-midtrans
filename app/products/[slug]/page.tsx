import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck, Shield, Package } from "lucide-react";
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
  base_price?: number | null;
  sale_price?: number | null;
  image_url: string | null;
  category: string | null;
  fit: string | null;
  status: string | null;
  is_active: boolean | null;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
  soldCount?: number;
  rating?: { avg: number; count: number };
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
  const map: Record<string, string> = {
    READY: "Siap Kirim",
    COMING_SOON: "Segera Hadir",
    SOLD_OUT: "Stok Habis",
    PRE_ORDER: "Pre-order",
  };
  if (!status) return map.READY;
  const key = status.toUpperCase();
  return map[key] || status.replaceAll("_", " ").toUpperCase();
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

  // Fetch related products (limit 8 to keep the page light)
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
    .neq("id", product.id)
    .limit(8);
  if (!relatedError && related) {
    relatedProducts = (related as Product[]).map((p) => ({
      ...p,
      product_images: [...(p.product_images || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  }

  // Status color logic
  const statusColor =
    normalizeStatus(product.status) === "Stok Habis"
      ? "text-red-400"
      : normalizeStatus(product.status) === "Segera Hadir"
      ? "text-amber-400"
      : "text-[#d7ff53]";

  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.base_price) - Number(product.sale_price)) /
          Number(product.base_price)) *
          100
      )
    : 0;

  return (
    <div
      className="min-h-screen bg-[#050505] text-white"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* ── Breadcrumb / back link ────────────────────────────── */}
      <nav
        className="border-b border-white/5"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3 sm:py-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40 transition-colors duration-300 hover:text-white/80"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              <span>Produk</span>
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
              {product.name}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main product grid ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-2 py-6 sm:py-8 lg:py-12">

          {/* Left: Image gallery */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div
              style={{ animation: "fade-up 600ms cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <ProductImageGallery
                productName={product.name}
                images={sortedGalleryImages}
              />
            </div>
          </div>

          {/* Right: Product details */}
          <div
            className="flex flex-col justify-center"
            style={{ animation: "fade-up 600ms cubic-bezier(0.16,1,0.3,1) 120ms both" }}
          >
            {/* Category tag */}
            <div className="mb-4 sm:mb-5 flex items-center gap-2">
              <span
                className="inline-flex items-center rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--accent-color)",
                }}
              >
                {product.category || "Merch"}
              </span>
              {product.fit && (
                <span
                  className="inline-flex items-center rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Fit: {product.fit}
                </span>
              )}
            </div>

            {/* Product name */}
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.1]">
              {product.name}
            </h1>

            {/* Price row */}
            <div className="mt-5 sm:mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              {hasDiscount ? (
                <>
                  <span className="text-sm font-semibold text-white/35 line-through">
                    {rupiah(product.base_price!)}
                  </span>
                  <span
                    className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
                    style={{ color: "var(--accent-color)" }}
                  >
                    {rupiah(product.sale_price!)}
                  </span>
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}
                  >
                    −{discountPercent}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {rupiah(effectivePrice)}
                </span>
              )}
            </div>

            {/* Stock + status */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    totalStock > 10
                      ? "bg-[#d7ff53]"
                      : totalStock > 0
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
                <span className="font-medium text-white/50">
                  {totalStock > 0 ? `${totalStock} pcs tersedia` : "Stok habis"}
                </span>
              </div>
              <span className={`font-semibold ${statusColor}`}>
                {normalizeStatus(product.status)}
              </span>
            </div>

            {/* Divider */}
            <div
              className="my-6 sm:my-7 h-px w-full"
              style={{ backgroundColor: "var(--border-color)" }}
            />

            {/* Description */}
            {product.description && (
              <div className="mb-6 sm:mb-8">
                <p className="text-sm leading-[1.7] text-white/55 sm:text-[0.925rem] sm:leading-[1.7]">
                  {product.description}
                </p>
              </div>
            )}

            {/* Trust signals */}
            <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { icon: Truck, label: "Gratis Ongkir*", sub: "min. Rp 1.000.000" },
                { icon: Package, label: "Stok Ready", sub: "Kirim 1–2 hari" },
                { icon: Shield, label: "100% Original", sub: "Garansi resmi" },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 sm:px-3 sm:py-4 text-center"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                  }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80">
                    {label}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-white/30">{sub}</p>
                </div>
              ))}
            </div>

            {/* Add to cart */}
            <div className="mb-4 sm:mb-6">
              {(() => {
                const sampleVariant = variants[0];
                return (
                  <AddToCartBox
                    productId={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={effectivePrice}
                    image={sortedGalleryImages[0]?.image_url || product.image_url || ""}
                    option1Label={sampleVariant?.option_1_name || "Warna"}
                    option2Label={sampleVariant?.option_2_name || "Ukuran"}
                    variants={variants.map((variant) => {
                      const opt1Value =
                        variant.option_1_value !== null ? variant.option_1_value : null;
                      const opt2Value =
                        variant.option_2_value !== null ? variant.option_2_value : null;
                      return {
                        id: variant.id,
                        option1: opt1Value,
                        option2: opt2Value,
                        legacyColor: variant.color || null,
                        stock: Number(variant.stock || 0),
                        price: Number(
                          variant.sale_price ?? variant.price ?? effectivePrice
                        ),
                      };
                    })}
                  />
                );
              })()}
            </div>

          </div>
        </div>
      </div>

      {/* ── Related products ───────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section
          className="border-t border-white/5"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
            <div className="mb-6 sm:mb-8 flex items-end justify-between">
              <div>
                <p
                  className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent-color)" }}
                >
                  Jelajahi
                </p>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Produk Lain
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-white/40 transition-colors duration-300 hover:text-white/80"
              >
                Lihat semua →
              </Link>
            </div>

            {/* Desktop: 4-col grid · Mobile: horizontal scroll */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p, i) => (
                <div key={p.id} className="min-w-0">
                  <ProductCard product={p as any} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
