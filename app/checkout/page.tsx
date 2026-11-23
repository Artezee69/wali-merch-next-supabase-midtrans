"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rupiah } from "@/lib/format";
import { useCartContext } from "@/components/CartProvider";
import { useAuth } from "@/hooks/useAuth";
import { supabasePublic } from "@/lib/supabasePublic";

type CheckoutCartItem = {
  cartItemId: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  color?: string;
  price: number;
  quantity: number;
  image?: string;
  stock?: number;
};

type ShippingService = {
  service: string;
  name: string;
  description: string;
  cost: number;
  etd: string;
  isRecommended?: boolean;
  note?: string;
};

type ShippingResponse = {
  success: boolean;
  origin: { city: string; province: string; postalCode: string };
  destination: { city: string | null; postal_code: string | null };
  weight_kg: number;
  billable_kg: number;
  options: ShippingService[];
  recommended_service?: string;
  currency: string;
};

function cartToCheckout(cartItem: ReturnType<typeof useCartContext>["items"][number]): CheckoutCartItem {
  return {
    cartItemId: cartItem.id ?? "",
    productId: cartItem.product_id,
    variantId: cartItem.variant_id,
    name: cartItem.name || "Produk",
    slug: cartItem.slug,
    size: cartItem.size || "",
    price: Number(cartItem.price),
    quantity: cartItem.quantity,
    image: cartItem.image_url,
  };
}

const formatWeight = (grams: number) => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1).replace(/\.0$/, "")} kg`;
  return `${grams} g`;
};

/* ────────────────────────────────────────────── */
/*  Shared style tokens (CSS-variable driven)     */
/* ────────────────────────────────────────────── */

/* 12px uppercase form labels */
const labelCls =
  "mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/40";

/* Inputs: subtle glass fill, accent focus ring */
const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none transition-colors duration-200 focus:border-[#d7ff53]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#d7ff53]/15";

const requiredMark = <span className="ml-1 text-[#d7ff53]">*</span>;

/* ────────────────────────────────────────────── */
/*  Main Page                                     */
/* ────────────────────────────────────────────── */

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, loading: cartLoading, authReady, clearCart } = useCartContext();
  const { user, profile, profileLoading } = useAuth();

  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    address: "",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    notes: "",
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingResponse | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [originCityName, setOriginCityName] = useState<string>("Tangerang Selatan");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Auto-fill from profile */
  useEffect(() => {
    if (profileLoading || !profile || !user) return;
    setForm((prev) => ({
      ...prev,
      customer_name: profile.full_name || prev.customer_name,
      customer_phone: profile.phone || prev.customer_phone,
      customer_email: profile.email || prev.customer_email,
      address: profile.address || prev.address,
    }));
  }, [profile, profileLoading, user?.id]);

  /* Enrich cart items with product + variant metadata */
  useEffect(() => {
    if (!authReady) return;
    if (cartItems.length === 0) {
      setItems([]);
      return;
    }

    const productIds = Array.from(new Set(cartItems.map((i) => i.product_id)));
    const variantIds = Array.from(new Set(cartItems.map((i) => i.variant_id)));

    let cancelled = false;
    (async () => {
      try {
        const [{ data: prods }, { data: vars }] = await Promise.all([
          supabasePublic
            .from("products")
            .select("id, name, slug, product_images(image_url, sort_order)")
            .in("id", productIds),
          supabasePublic
            .from("product_variants")
            .select("id, size, color, stock, option_1_name, option_1_value, option_2_name, option_2_value")
            .in("id", variantIds),
        ]);

        if (cancelled) return;

        const prodMap = new Map<string, { name: string; slug: string; image_url: string | null }>();
        (prods ?? []).forEach((p: any) => {
          const sortedImages = [...(p.product_images || [])].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          prodMap.set(p.id, {
            name: p.name,
            slug: p.slug,
            image_url: sortedImages[0]?.image_url ?? null,
          });
        });

        const varMap = new Map<string, {
          size: string | null;
          color: string | null;
          stock: number | null;
          option1Name: string | null;
          option1Value: string | null;
          option2Name: string | null;
          option2Value: string | null;
        }>();
        (vars ?? []).forEach((v: any) => {
          varMap.set(v.id, {
            size: v.size ?? null,
            color: v.color ?? null,
            stock: typeof v.stock === "number" ? v.stock : null,
            option1Name: v.option_1_name ?? null,
            option1Value: v.option_1_value ?? null,
            option2Name: v.option_2_name ?? null,
            option2Value: v.option_2_value ?? null,
          });
        });

        const enriched: CheckoutCartItem[] = cartItems.map((ci) => {
          const p = prodMap.get(ci.product_id);
          const v = varMap.get(ci.variant_id);
          const base = cartToCheckout(ci);

          const variantParts: string[] = [];
          if (v?.option1Name && v?.option1Value) {
            variantParts.push(`${v.option1Name}:${v.option1Value}`);
          }
          if (v?.option2Name && v?.option2Value) {
            variantParts.push(`${v.option2Name}:${v.option2Value}`);
          }
          if (variantParts.length === 0) {
            const parts: string[] = [];
            if (v?.color) parts.push(`Color:${v.color}`);
            if (v?.size) parts.push(`Size:${v.size}`);
            if (parts.length > 0) variantParts.push(parts.join(", "));
          }

          const variantDisplay = variantParts.length > 0 ? variantParts.join(", ") : "";
          const finalSize = variantDisplay || base.size || "Default";

          return {
            ...base,
            name: base.name && base.name !== "Produk" ? base.name : (p?.name ?? "Produk"),
            slug: base.slug || p?.slug || "",
            size: finalSize,
            color: v?.color ?? undefined,
            image: base.image || (p?.image_url ?? undefined),
            stock: v?.stock ?? undefined,
          };
        });
        setItems(enriched);
      } catch (err) {
        console.error("checkout enrich error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, cartItems]);

  /* Default origin city */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/shipping/origin");
        const data = await res.json();
        if (mounted && data?.origin?.city) {
          setOriginCityName(data.origin.city);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* Derived totals */
  const subtotal = useMemo(
    () => items.reduce((t, i) => t + Number(i.price) * Number(i.quantity), 0),
    [items]
  );
  const totalItems = useMemo(
    () => items.reduce((t, i) => t + Number(i.quantity), 0),
    [items]
  );
  const totalWeight = useMemo(() => Math.max(1000, totalItems * 500), [totalItems]);

  const selectedShippingCost = useMemo(() => {
    if (!shippingOptions || !selectedService) return 0;
    return shippingOptions.options.find((s) => s.service === selectedService)?.cost ?? 0;
  }, [shippingOptions, selectedService]);

  const total = subtotal + selectedShippingCost;

  /* Shipping cost check (debounced) */
  function checkShipping(cityOverride?: string, postalOverride?: string) {
    const cityName = (cityOverride ?? form.city).trim();
    const postal = (postalOverride ?? form.postal_code).trim();
    if (!cityName && !postal) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setShippingLoading(true);
        setShippingError("");
        const res = await fetch("/api/shipping/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: cityName, postal_code: postal, item_count: totalItems }),
        });
        const data: ShippingResponse = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error((data as any)?.error || "Gagal cek ongkir");
        }
        setShippingOptions(data);
        if (data.options && data.options.length > 0) {
          const recommended = data.options.find((s) => s.isRecommended);
          setSelectedService(
            recommended?.service || data.recommended_service || data.options[0].service
          );
        } else {
          setSelectedService(null);
        }
      } catch (err: any) {
        setShippingError(err.message || "Gagal cek ongkir");
        setShippingOptions(null);
        setSelectedService(null);
      } finally {
        setShippingLoading(false);
      }
    }, 800);
  }

  function updateField(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "city" || name === "postal_code") {
      checkShipping(
        name === "city" ? value : undefined,
        name === "postal_code" ? value : undefined
      );
    }
  }

  function openConfirmModal() {
    setErrorMessage("");
    if (items.length === 0) {
      setErrorMessage("Keranjang masih kosong. Tambahkan produk dulu.");
      return;
    }
    if (!form.customer_name || !form.customer_phone || !form.address) {
      setErrorMessage("Nama, nomor WhatsApp, dan alamat wajib diisi.");
      return;
    }
    if (!form.city) {
      setErrorMessage("Kota tujuan wajib diisi untuk cek ongkir.");
      return;
    }
    if (shippingOptions && !selectedService) {
      setErrorMessage("Pilih layanan pengiriman JNE terlebih dahulu.");
      return;
    }
    setShowConfirmModal(true);
  }

  async function submitCheckout() {
    setErrorMessage("");
    if (items.length === 0) {
      setErrorMessage("Keranjang masih kosong. Tambahkan produk dulu.");
      return;
    }
    if (!form.customer_name || !form.customer_phone || !form.address) {
      setErrorMessage("Nama, nomor WhatsApp, dan alamat wajib diisi.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          user_id: user?.id || null,
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            name: it.name,
            slug: it.slug,
            size: it.size,
            color: it.color,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
          })),
          shipping_cost: selectedShippingCost,
          shipping_service: selectedService ?? "JNE REG",
          shipping_destination: shippingOptions?.destination
            ? `${shippingOptions.destination.city || form.city}${
                shippingOptions.destination.postal_code
                  ? " " + shippingOptions.destination.postal_code
                  : ""
              }`
            : `${form.city}${form.postal_code ? " " + form.postal_code : ""}`,
          total,
          subtotal,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Checkout gagal.");
      }

      try {
        await clearCart();
      } catch (e) {
        console.warn("clearCart after checkout failed:", e);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cart-updated"));
      }

      router.push(`/payment?order=${encodeURIComponent(result.order_code)}`);
    } catch (error: any) {
      setErrorMessage(error.message || "Checkout gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndSubmitCheckout() {
    setShowConfirmModal(false);
    await submitCheckout();
  }

  /* ────────────────────────────────────────── */
  /*  Render                                     */
  /* ────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar activeKey="cart" />

      {/* ── Page header: bold title + trust badge ── */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-[#d7ff53]/[0.04] to-transparent">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ff53]/25 bg-[#d7ff53]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#d7ff53]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Checkout Aman
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Selesaikan <span className="text-[#d7ff53]">Pesananmu</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/40">
              Isi data pengiriman dengan benar. Setelah checkout, pantau status
              pesananmu lewat halaman Lacak Pesanan.
            </p>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {!authReady || cartLoading ? (
          <StatePanel
            icon="⏳"
            title="Memuat Keranjang"
            subtitle="Sedang mengambil data keranjang kamu..."
          />
        ) : items.length === 0 ? (
          <StatePanel
            icon=""
            title="Keranjang Masih Kosong"
            subtitle="Checkout belum bisa dilanjutkan karena belum ada produk di keranjang."
            cta={
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-[#d7ff53] px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
              >
                Belanja Sekarang
                <span aria-hidden>→</span>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
            {/* ── LEFT: Form ──────────────────── */}
            <div className="space-y-6">
              {/* Step indicator */}
              <StepIndicator currentStep={2} />

              {/* Buyer info */}
              <FormCard
                step="01"
                title="Data Pembeli"
                delay={0}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Nama Lengkap"
                    required
                    name="customer_name"
                    value={form.customer_name}
                    onChange={updateField}
                    placeholder="Nama kamu"
                  />
                  <TextField
                    label="Nomor WhatsApp"
                    required
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={updateField}
                    placeholder="628xxxxxxxxxx"
                    inputMode="tel"
                  />
                  <TextField
                    label="Email"
                    name="customer_email"
                    value={form.customer_email}
                    onChange={updateField}
                    type="email"
                    placeholder="email@email.com"
                    className="sm:col-span-2"
                  />
                </div>
              </FormCard>

              {/* Shipping address */}
              <FormCard
                step="02"
                title="Alamat Pengiriman"
                delay={60}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextareaField
                    label="Alamat Lengkap"
                    required
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    rows={3}
                    placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                    className="sm:col-span-2"
                  />
                  <TextField
                    label="Provinsi"
                    name="province"
                    value={form.province}
                    onChange={updateField}
                    placeholder="Banten"
                  />
                  <TextField
                    label="Kota / Kabupaten"
                    required
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    placeholder="Tangerang Selatan"
                  />
                  <TextField
                    label="Kecamatan"
                    name="district"
                    value={form.district}
                    onChange={updateField}
                    placeholder="Setu"
                  />
                  <TextField
                    label="Kode Pos"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={updateField}
                    placeholder="15314"
                    inputMode="numeric"
                  />
                  <TextareaField
                    label="Catatan Order"
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={2}
                    placeholder="Contoh: jangan dilipat terlalu kecil, kirim sore..."
                    className="sm:col-span-2"
                  />
                </div>

                {/* Shipping status */}
                {form.city && (
                  <ShippingStatus
                    loading={shippingLoading}
                    error={shippingError}
                    options={shippingOptions}
                    originName={originCityName}
                  />
                )}
              </FormCard>

              {/* JNE service picker */}
              {shippingOptions && shippingOptions.options.length > 0 && (
                <FormCard step="03" title="Layanan Pengiriman JNE" delay={120}>
                  <ShippingServicePicker
                    services={shippingOptions.options}
                    selected={selectedService}
                    onSelect={setSelectedService}
                  />
                </FormCard>
              )}

              {/* Error message */}
              {errorMessage && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* ── RIGHT: Summary ──────────────── */}
            <aside className="h-fit lg:sticky lg:top-24">
              <OrderSummary
                items={items}
                totalItems={totalItems}
                subtotal={subtotal}
                shippingOptions={shippingOptions}
                selectedService={selectedService}
                selectedShippingCost={selectedShippingCost}
                total={total}
                totalWeight={totalWeight}
                loading={loading}
                onCheckout={openConfirmModal}
              />
            </aside>
          </div>
        )}
      </section>

      <Footer />

      {showConfirmModal && (
        <ConfirmModal
          form={form}
          items={items}
          totalItems={totalItems}
          subtotal={subtotal}
          shippingOptions={shippingOptions}
          selectedService={selectedService}
          selectedShippingCost={selectedShippingCost}
          total={total}
          loading={loading}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={confirmAndSubmitCheckout}
        />
      )}
    </main>
  );
}

/* ════════════════════════════════════════════ */
/*  Sub Components                               */
/* ════════════════════════════════════════════ */

/* ── Step Indicator ── */
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { n: 1, label: "Keranjang" },
    { n: 2, label: "Checkout" },
    { n: 3, label: "Pembayaran" },
  ];

  return (
    <div className="flex items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5">
      {steps.map((s, i) => {
        const active = s.n === currentStep;
        const done = s.n < currentStep;
        return (
          <div key={s.n} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                  active
                    ? "bg-[#d7ff53] text-black shadow-[0_0_16px_rgba(215,255,83,0.4)]"
                    : done
                    ? "bg-white/10 text-white/80"
                    : "bg-white/[0.04] text-white/25"
                }`}
              >
                {done ? "✓" : s.n}
              </div>
              <span
                className={`hidden text-xs font-bold sm:block ${
                  active ? "text-white" : done ? "text-white/50" : "text-white/25"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative h-px flex-1 overflow-hidden bg-white/[0.08]">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#d7ff53] to-[#d7ff53]/50 transition-all duration-500 ${
                    done ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Empty / Loading State Panel ── */
function StatePanel({
  icon,
  title,
  subtitle,
  cta,
}: {
  icon: string;
  title: string;
  subtitle: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-20 text-center backdrop-blur-sm sm:py-28">
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-2xl">
          {icon}
        </div>
      ) : (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#d7ff53]/[0.08] ring-1 ring-[#d7ff53]/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d7ff53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d7ff53]">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
            <path d="M3 4h2l2.5 12.5a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 9H6" />
          </svg>
        </div>
      )}
      <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/40">{subtitle}</p>
      {cta && <div className="mt-7">{cta}</div>}
    </div>
  );
}

/* ── Form Card ── */
function FormCard({
  step,
  title,
  children,
  delay = 0,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm sm:p-7"
    >
      {/* Subtle top accent */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/30 to-transparent" />

      <header className="mb-5 flex items-baseline gap-3 sm:mb-6">
        <span className="font-mono text-[11px] font-black tracking-widest text-[#d7ff53]/60">
          {step}
        </span>
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

/* ── Text Input ── */
type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email";
  className?: string;
};

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  inputMode,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && requiredMark}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        className={inputCls}
      />
    </div>
  );
}

/* ── Textarea ── */
function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  className,
}: FieldProps & { rows?: number }) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && requiredMark}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        required={required}
        placeholder={placeholder}
        className={`${inputCls} resize-none`}
      />
    </div>
  );
}

/* ── Shipping Status Banner ── */
function ShippingStatus({
  loading,
  error,
  options,
  originName,
}: {
  loading: boolean;
  error: string;
  options: ShippingResponse | null;
  originName: string;
}) {
  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-3.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d7ff53] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d7ff53]" />
        </span>
        <p className="text-xs font-semibold text-[#d7ff53]">
          Mengecek ongkir JNE dari {originName}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs font-medium text-red-300">
        {error}
      </div>
    );
  }

  if (!options) return null;

  if (options.options.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3.5 text-xs font-medium text-amber-300">
        Kota tujuan belum dapat layanan JNE. Coba cek lagi nama kota/kabupaten.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-3.5">
      <span className="text-xs font-semibold text-[#d7ff53]">
        {options.options.length} layanan tersedia
      </span>
      <span className="text-xs text-white/50">
        Berat {formatWeight(options.weight_kg * 1000)} · Tujuan {options.destination.city || "kota ini"}
      </span>
    </div>
  );
}

/* ── JNE Service Picker ── */
function ShippingServicePicker({
  services,
  selected,
  onSelect,
}: {
  services: ShippingService[];
  selected: string | null;
  onSelect: (service: string) => void;
}) {
  return (
    <div className="space-y-2.5" role="radiogroup" aria-label="Layanan JNE">
      {services.map((svc) => {
        const isSelected = selected === svc.service;
        return (
          <button
            key={svc.service}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(svc.service)}
            className={`group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
              isSelected
                ? "border-[#d7ff53]/60 bg-[#d7ff53]/[0.06] shadow-[0_0_20px_rgba(215,255,83,0.08)]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
            }`}
          >
            {/* Radio dot */}
            <span
              className={`relative flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-[#d7ff53]" : "border-white/20"
              }`}
              style={{ height: "1.125rem", width: "1.125rem" }}
            >
              {isSelected && (
                <span className="h-2 w-2 rounded-full bg-[#d7ff53]" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${isSelected ? "text-white" : "text-white/80"}`}>
                  {svc.service}
                </p>
                {svc.isRecommended && (
                  <span className="rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#d7ff53]">
                    Pilihan
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-white/35">
                {svc.name}
                {svc.etd ? ` · Estimasi ${svc.etd}` : ""}
              </p>
            </div>

            <p
              className={`shrink-0 text-sm font-black tracking-tight ${
                isSelected ? "text-[#d7ff53]" : "text-white/50 group-hover:text-white/70"
              }`}
            >
              {rupiah(svc.cost)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ── Order Summary ── */
function OrderSummary({
  items,
  totalItems,
  subtotal,
  shippingOptions,
  selectedService,
  selectedShippingCost,
  total,
  totalWeight,
  loading,
  onCheckout,
}: {
  items: CheckoutCartItem[];
  totalItems: number;
  subtotal: number;
  shippingOptions: ShippingResponse | null;
  selectedService: string | null;
  selectedShippingCost: number;
  total: number;
  totalWeight: number;
  loading: boolean;
  onCheckout: () => void;
}) {
  const selectedSvc = shippingOptions?.options.find(
    (s) => s.service === selectedService
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
      {/* Glass glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#d7ff53]/[0.06] to-transparent" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/35">
            Ringkasan
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
            Pesanan Kamu
          </h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d7ff53]/[0.08] border border-[#d7ff53]/20 text-sm font-black text-[#d7ff53]">
          {totalItems}
        </div>
      </div>

      {/* Items list */}
      <div className="relative max-h-64 space-y-1.5 overflow-y-auto py-4 sm:py-5">
        {items.map((item, idx) => (
          <div
            key={`${item.productId}-${item.variantId}-${idx}`}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.05] ring-1 ring-white/[0.06]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] font-bold text-white/25">
                  IMG
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-bold text-white sm:text-sm">
                {item.name}
              </h3>
              <p className="text-[11px] font-medium text-white/35">
                {item.size} · {item.quantity} pcs
              </p>
            </div>
            <p className="text-xs font-black text-white/80 sm:text-sm">
              {rupiah(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="relative space-y-3 border-t border-white/[0.08] pt-4">
        <SummaryRow label="Subtotal" value={rupiah(subtotal)} />
        <SummaryRow label="Berat Total" value={formatWeight(totalWeight)} muted />

        {/* Shipping row */}
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-3 ring-1 ring-white/[0.05]">
          <div>
            <p className="text-xs font-bold text-white/55">Ongkir JNE</p>
            <p className="mt-0.5 text-[11px] font-medium text-white/30">
              {selectedSvc
                ? `${selectedSvc.service}${selectedSvc.etd ? ` · ${selectedSvc.etd}` : ""}`
                : shippingOptions
                ? "Pilih layanan di atas"
                : "Isi kota untuk cek ongkir"}
            </p>
          </div>
          <p
            className={`text-sm font-black tracking-tight ${
              selectedShippingCost > 0 ? "text-[#d7ff53]" : "text-white/25"
            }`}
          >
            {selectedShippingCost > 0
              ? rupiah(selectedShippingCost)
              : shippingOptions
              ? "—"
              : "..."}
          </p>
        </div>

        {/* Grand total */}
        <div className="flex items-end justify-between border-t border-dashed border-white/[0.1] pt-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/35">
              Total Bayar
            </p>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#d7ff53] sm:text-3xl">
            {rupiah(total)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={loading}
        onClick={onCheckout}
        className="mt-6 w-full rounded-xl bg-[#d7ff53] py-4 text-sm font-black tracking-wide text-black shadow-[0_8px_30px_rgba(215,255,83,0.2)] transition-all duration-200 hover:scale-[1.02] hover:bg-white hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:py-4"
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            Memproses...
          </span>
        ) : (
          "Buat Pesanan →"
        )}
      </button>

      <Link
        href="/cart"
        className="mt-3 block w-full rounded-xl border border-white/[0.08] py-3.5 text-center text-xs font-bold text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        Kembali ke Keranjang
      </Link>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-white/25">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Checkout aman &amp; terenkripsi
      </p>
    </div>
  );
}

/* ── Summary Row ── */
function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-semibold ${muted ? "text-white/30" : "text-white/50"}`}>
        {label}
      </span>
      <span className={`text-sm font-black tracking-tight ${muted ? "text-white/35" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({
  form,
  items,
  totalItems,
  subtotal,
  shippingOptions,
  selectedService,
  selectedShippingCost,
  total,
  loading,
  onCancel,
  onConfirm,
}: {
  form: any;
  items: CheckoutCartItem[];
  totalItems: number;
  subtotal: number;
  shippingOptions: ShippingResponse | null;
  selectedService: string | null;
  selectedShippingCost: number;
  total: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const selectedSvc = shippingOptions?.options.find(
    (s) => s.service === selectedService
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/80 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0d0d0d] shadow-2xl ring-1 ring-white/[0.04] sm:max-w-xl">
        {/* Header */}
        <div className="relative border-b border-white/[0.06] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#d7ff53]/[0.05] to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#d7ff53]">
              Konfirmasi Data
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
              Pastikan Data Sudah Benar
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm leading-relaxed text-white/60">
              Cek kembali nama, WhatsApp, alamat, dan layanan pengiriman
              sebelum membuat order.
            </p>
            <p className="mt-2.5 text-[11px] leading-relaxed text-white/30">
              Kesalahan penulisan alamat, nomor WhatsApp, atau detail pengiriman
              menjadi tanggung jawab customer.
            </p>
          </div>

          {/* Data recap */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/35">
              Data Checkout
            </h3>

            <div className="mt-3 space-y-2.5 text-sm">
              <ConfirmRow label="Nama" value={form.customer_name} />
              <ConfirmRow label="WhatsApp" value={form.customer_phone} />
              {form.customer_email && (
                <ConfirmRow label="Email" value={form.customer_email} />
              )}
              <ConfirmRow label="Kota" value={form.city} />

              <div className="border-t border-white/[0.06] pt-2.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/30">Alamat</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  {form.address || "-"}
                  {form.district ? `, ${form.district}` : ""}
                  {form.city ? `, ${form.city}` : ""}
                  {form.province ? `, ${form.province}` : ""}
                  {form.postal_code ? ` ${form.postal_code}` : ""}
                </p>
              </div>

              {form.notes && (
                <div className="border-t border-white/[0.06] pt-2.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-white/30">Catatan</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">{form.notes}</p>
                </div>
              )}

              <div className="border-t border-white/[0.06] pt-2.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/30">
                  Item ({totalItems})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((it, i) => (
                    <li
                      key={`${it.productId}-${it.variantId}-${i}`}
                      className="flex justify-between gap-3 text-xs sm:text-sm"
                    >
                      <span className="line-clamp-1 font-semibold text-white/60">
                        {it.name} · {it.size} ×{it.quantity}
                      </span>
                      <span className="font-black text-white/80">
                        {rupiah(it.price * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
                <ConfirmRow label="Subtotal" value={rupiah(subtotal)} />
                {selectedSvc && (
                  <ConfirmRow
                    label={`Ongkir ${selectedSvc.service}`}
                    value={selectedSvc.etd
                      ? `${rupiah(selectedShippingCost)} · ${selectedSvc.etd}`
                      : rupiah(selectedShippingCost)}
                  />
                )}
                <div className="flex items-end justify-between border-t border-dashed border-white/[0.1] pt-2.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/35">Total</span>
                  <span className="text-2xl font-black tracking-tight text-[#d7ff53]">
                    {rupiah(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-xl border border-white/[0.1] bg-white/[0.02] py-3.5 text-sm font-black text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
            >
              Cek Kembali
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="rounded-xl bg-[#d7ff53] py-3.5 text-sm font-black text-black shadow-[0_4px_20px_rgba(215,255,83,0.15)] transition-all duration-200 hover:scale-[1.02] hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Memproses
                </span>
              ) : (
                "Sudah Sesuai →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Row ── */
function ConfirmRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-white/35">{label}</span>
      <span className="max-w-[240px] text-right text-sm font-bold text-white sm:max-w-[280px]">
        {value || "-"}
      </span>
    </div>
  );
}
