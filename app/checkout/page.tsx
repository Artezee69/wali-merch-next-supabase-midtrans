"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import MidtransScript from "@/components/MidtransScript";
import { rupiah } from "@/lib/format";

type CartItem = {
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

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const mobileExtras = (
  <Link
    href="/cart"
    className="rounded-2xl border border-white/10 px-4 py-4 text-center text-sm font-black uppercase tracking-wider text-white/80 transition hover:bg-white hover:text-black"
  >
    Kembali ke Cart
  </Link>
);

const desktopCta = (
  <Link
    href="/cart"
    className="rounded-full bg-white px-5 py-2 text-sm font-black text-black transition hover:scale-105 hover:bg-[#d7ff53]"
  >
    Back Cart
  </Link>
);

const formatWeight = (grams: number) => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1).replace(/\.0$/, "")} kg`;
  return `${grams} g`;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
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

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingResponse | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [originCityName, setOriginCityName] = useState<string>("Tangerang Selatan");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(getCart());
  }, []);

  // Default origin city from config
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/shipping/origin");
        const data = await res.json();
        if (mounted && data?.origin?.city) {
          if (data.origin.city) setOriginCityName(data.origin.city);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0
    );
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + Number(item.quantity), 0);
  }, [items]);

  // Weight: 1000g default per item unless product has weight info, simple estimate
  const totalWeight = useMemo(() => {
    return Math.max(1000, totalItems * 500);
  }, [totalItems]);

  const selectedShippingCost = useMemo(() => {
    if (!shippingOptions || !selectedService) return 0;
    const svc = shippingOptions.options.find((s) => s.service === selectedService);
    return svc?.cost ?? 0;
  }, [shippingOptions, selectedService]);

  const total = subtotal + selectedShippingCost;

  // Trigger shipping cost calc with debounce on city/postal change
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
          body: JSON.stringify({
            city: cityName,
            postal_code: postal,
            item_count: totalItems,
          }),
        });
        const data: ShippingResponse = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error((data as any)?.error || "Gagal cek ongkir");
        }
        setShippingOptions(data);
        // Auto-select recommended service (default to JNE REG)
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
      setErrorMessage("Cart masih kosong. Tambahkan produk dulu.");
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
      setErrorMessage("Cart masih kosong. Tambahkan produk dulu.");
      return;
    }

    if (!form.customer_name || !form.customer_phone || !form.address) {
      setErrorMessage("Nama, nomor WhatsApp, dan alamat wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: form,
          items,
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

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cart-updated"));

      // Jika API mengembalikan snap_token, buka popup Midtrans Snap.
      // onSuccess/onPending/onClose tetap redirect ke track-order supaya
      // user bisa lanjut memantau / coba bayar lagi.
      if (result.snap_token && typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(result.snap_token, {
          onSuccess: () => {
            router.push(`/track-order?q=${encodeURIComponent(result.order_code)}`);
          },
          onPending: () => {
            router.push(`/track-order?q=${encodeURIComponent(result.order_code)}`);
          },
          onError: () => {
            router.push(`/track-order?q=${encodeURIComponent(result.order_code)}`);
          },
          onClose: () => {
            router.push(`/track-order?q=${encodeURIComponent(result.order_code)}`);
          },
        });
        return;
      }

      router.push(`/track-order?q=${encodeURIComponent(result.order_code)}`);
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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#060606] text-white">
      <MidtransScript />
      {/* Cinematic global background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[120vh] w-[140vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.10),_transparent_55%)]" />
        <div className="absolute -left-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-[#5e8bff]/10 blur-[140px] animate-aurora-2" />
        <div className="absolute -right-40 bottom-1/4 h-[36rem] w-[36rem] rounded-full bg-[#ff5edb]/10 blur-[140px] animate-aurora-1" />
        <div className="absolute left-1/2 top-2/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#d7ff53]/10 blur-[160px] animate-aurora-3" />
        <div className="absolute inset-0 bg-grid-fade [background-size:56px_56px] opacity-[0.22]" />
        <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,#060606_5%,transparent_70%)]" />
      </div>

      <Navbar activeKey="cart" desktopCta={desktopCta} mobileExtras={mobileExtras} />

      <PageHeader
        badge="Secure Checkout"
        title="Checkout"
        highlight="Order"
        description="Isi data pengiriman dengan benar. Setelah checkout berhasil, kamu bisa cek status pesanan melalui halaman Track Order."
      />

      <section className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {items.length === 0 ? (
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-md sm:p-8 md:rounded-[2.5rem] md:p-14 animate-blur-in">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,83,0.18),transparent_60%)] opacity-60" />
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/0 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:mb-6 sm:h-20 sm:w-20 sm:text-3xl animate-float-y">
              🛒
            </div>

            <h2 className="text-2xl font-black uppercase sm:text-3xl md:text-5xl">
              Cart Masih Kosong
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/55 sm:mt-4 sm:text-base sm:leading-8">
              Checkout belum bisa dilanjutkan karena belum ada produk di
              keranjang.
            </p>

            <Link
              href="/products"
              className="group/btn relative mt-6 inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-105 hover:bg-white sm:mt-8 sm:px-8 sm:py-4"
            >
              <span className="relative z-10">Belanja Sekarang</span>
              <span className="absolute inset-0 -z-0 holographic opacity-0 transition group-hover/btn:opacity-100" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">
            {/* LEFT: FORM */}
            <div className="space-y-4 sm:space-y-6">
              {/* Step indicator */}
              <CheckoutSteps step={2} />

              {/* CUSTOMER */}
              <CheckoutCard
                index="01"
                badge="Customer Detail"
                title="Data Pembeli"
                delayMs={0}
              >
                <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
                  <FieldText
                    label="Nama Lengkap"
                    required
                    name="customer_name"
                    value={form.customer_name}
                    onChange={updateField}
                    placeholder="Nama kamu"
                    icon="user"
                  />
                  <FieldText
                    label="Nomor WhatsApp"
                    required
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={updateField}
                    placeholder="628xxxxxxxxxx"
                    icon="phone"
                  />
                  <div className="md:col-span-2">
                    <FieldText
                      label="Email"
                      name="customer_email"
                      value={form.customer_email}
                      onChange={updateField}
                      type="email"
                      placeholder="email@email.com"
                      icon="mail"
                    />
                  </div>
                </div>
              </CheckoutCard>

              {/* ADDRESS */}
              <CheckoutCard
                index="02"
                badge="Shipping Address"
                title="Alamat Pengiriman"
                delayMs={80}
              >
                <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldTextarea
                      label="Alamat Lengkap"
                      required
                      name="address"
                      value={form.address}
                      onChange={updateField}
                      rows={3}
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                    />
                  </div>
                  <FieldText
                    label="Provinsi"
                    name="province"
                    value={form.province}
                    onChange={updateField}
                    placeholder="Banten"
                  />
                  <FieldText
                    label="Kota / Kabupaten"
                    required
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    placeholder="Tangerang Selatan"
                    icon="city"
                  />
                  <FieldText
                    label="Kecamatan"
                    name="district"
                    value={form.district}
                    onChange={updateField}
                    placeholder="Setu"
                  />
                  <FieldText
                    label="Kode Pos"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={updateField}
                    placeholder="15314"
                    inputMode="numeric"
                  />
                  <div className="md:col-span-2">
                    <FieldTextarea
                      label="Catatan Order"
                      name="notes"
                      value={form.notes}
                      onChange={updateField}
                      rows={2}
                      placeholder="Contoh: jangan dilipat terlalu kecil, kirim sore..."
                    />
                  </div>
                </div>

                {/* Shipping info card appears once city is filled */}
                {form.city && (
                  <ShippingStatus
                    loading={shippingLoading}
                    error={shippingError}
                    options={shippingOptions}
                    originName={originCityName}
                  />
                )}
              </CheckoutCard>

              {/* SHIPPING SERVICE PICKER */}
              {shippingOptions && shippingOptions.options.length > 0 && (
                <CheckoutCard
                  index="03"
                  badge="Shipping Service"
                  title="Layanan Pengiriman JNE"
                  delayMs={120}
                >
                  <ShippingServicePicker
                    services={shippingOptions.options}
                    selected={selectedService}
                    onSelect={setSelectedService}
                  />
                </CheckoutCard>
              )}

              {errorMessage && (
                <div className="animate-slide-up rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300 backdrop-blur-md sm:rounded-[1.5rem] sm:p-5">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* RIGHT: SUMMARY */}
            <aside className="h-fit lg:sticky lg:top-28">
              <CheckoutSummary
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

/* ---------- Sub Components ---------- */

function CheckoutSteps({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Cart" },
    { n: 2, label: "Checkout" },
    { n: 3, label: "Payment" },
  ];
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md sm:gap-3 sm:rounded-[1.5rem] sm:p-4 animate-fade-in">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <div key={s.n} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black sm:h-9 sm:w-9 sm:text-sm transition-all duration-500 ${
                active
                  ? "border-[#d7ff53] bg-[#d7ff53] text-black shadow-[0_0_20px_-2px_rgba(215,255,83,0.6)]"
                  : done
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/40"
              }`}
            >
              {done ? "✓" : s.n}
              {active && (
                <span className="absolute inset-0 rounded-full ring-1 ring-[#d7ff53]/60 animate-pulse-soft" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={`text-[10px] font-black uppercase tracking-widest sm:text-xs ${
                  active ? "text-white" : "text-white/40"
                }`}
              >
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="relative h-px flex-1 overflow-hidden bg-white/10">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#d7ff53] to-[#d7ff53]/40 transition-all duration-700 ${
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

function CheckoutCard({
  index,
  badge,
  title,
  children,
  delayMs = 0,
}: {
  index: string;
  badge: string;
  title: string;
  children: React.ReactNode;
  delayMs?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className="group relative animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:rounded-[2rem] sm:p-5 md:p-7"
    >
      {/* corner index */}
      <div className="pointer-events-none absolute -right-3 -top-3 font-display text-[5rem] font-black leading-none text-white/[0.04] sm:-right-4 sm:-top-4 sm:text-[7rem]">
        {index}
      </div>
      {/* top accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/60 to-transparent opacity-60" />
      {/* hover gradient */}
      <div className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_0%_0%,rgba(215,255,83,0.06),transparent_40%)]" />

      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs sm:tracking-[0.3em]">
          <span className="h-1 w-1 rounded-full bg-[#d7ff53] shadow-[0_0_8px_rgba(215,255,83,0.8)]" />
          {badge}
        </p>

        <h2 className="mt-2 text-2xl font-black uppercase sm:mt-3 sm:text-3xl">
          {title}
        </h2>

        <div className="mt-5 sm:mt-6">{children}</div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  rows?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  icon?: "user" | "phone" | "mail" | "city";
};

function FieldIcon({ name }: { name: NonNullable<FieldProps["icon"]> }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "city":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M3 21h18M5 21V8l5-3 5 3v13M9 21v-6h4v6M15 21V11l4 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
  }
}

function FieldText({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  inputMode,
  icon,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/45 sm:mb-2 sm:text-xs">
        {label}
        {required && <span className="text-[#d7ff53]">*</span>}
      </label>
      <div className="group/field relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors group-focus-within/field:text-[#d7ff53] sm:left-4">
            <FieldIcon name={icon} />
          </span>
        )}
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          required={required}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-[#d7ff53]/70 focus:bg-black/60 focus:shadow-[0_0_0_4px_rgba(215,255,83,0.10)] sm:px-5 sm:py-4 ${
            icon ? "pl-10 sm:pl-12" : ""
          }`}
        />
      </div>
    </div>
  );
}

function FieldTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/45 sm:mb-2 sm:text-xs">
        {label}
        {required && <span className="text-[#d7ff53]">*</span>}
      </label>
      <div className="group/field relative">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-[#d7ff53]/70 focus:bg-black/60 focus:shadow-[0_0_0_4px_rgba(215,255,83,0.10)] sm:px-5 sm:py-4"
        />
      </div>
    </div>
  );
}

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
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-4 animate-fade-in">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d7ff53] opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#d7ff53]" />
        </span>
        <p className="text-xs font-black uppercase tracking-widest text-[#d7ff53] sm:text-sm">
          Mengecek ongkir JNE dari {originName}...
        </p>
        <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-[#d7ff53] border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-xs font-bold text-red-300 sm:text-sm animate-fade-in">
        ⚠ {error}
      </div>
    );
  }
  if (!options) return null;
  if (options.options.length === 0) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-xs font-bold text-amber-200 sm:text-sm animate-fade-in">
        ⚠ Kota tujuan belum dapat layanan JNE. Coba cek lagi nama kota/kabupaten.
      </div>
    );
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-4 animate-fade-in">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#d7ff53] sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#d7ff53] shadow-[0_0_8px_rgba(215,255,83,0.8)]" />
        JNE tersedia
      </div>
      <div className="text-xs text-white/65 sm:text-sm">
        {options.options.length} layanan • Berat {formatWeight(options.weight_kg * 1000)} • Tujuan {options.destination.city || "kota ini"}
      </div>
    </div>
  );
}

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
    <div className="grid gap-2.5 sm:gap-3">
      {services.map((svc, i) => {
        const isSelected = selected === svc.service;
        return (
          <button
            key={`${svc.service}-${i}`}
            type="button"
            onClick={() => onSelect(svc.service)}
            className={`group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 animate-slide-in ${
              isSelected
                ? "border-[#d7ff53] bg-[#d7ff53]/10 shadow-[0_0_30px_-10px_rgba(215,255,83,0.4)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* selection ring */}
            {isSelected && (
              <>
                <span className="absolute inset-0 -z-10 holographic opacity-30" />
                <span className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-[#d7ff53]/40" />
              </>
            )}

            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black sm:h-12 sm:w-12 ${
                  isSelected
                    ? "bg-[#d7ff53] text-black"
                    : "bg-white/5 text-white/55"
                }`}
              >
                {isSelected ? "✓" : svc.service}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase sm:text-base">
                  {svc.name}
                </p>
                <p className="truncate text-[11px] font-semibold text-white/55 sm:text-xs">
                  {svc.description}
                </p>
                {svc.etd && (
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#d7ff53]/80 sm:text-[11px]">
                    Estimasi {svc.etd}
                  </p>
                )}
                {svc.isRecommended && (
                  <span className="mt-1 inline-block rounded-full border border-[#d7ff53]/40 bg-[#d7ff53]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#d7ff53] sm:text-[10px]">
                    Rekomendasi
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-black sm:text-base ${
                  isSelected ? "text-[#d7ff53]" : "text-white"
                }`}
              >
                {rupiah(svc.cost)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CheckoutSummary({
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
  items: CartItem[];
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
  const selectedSvc = shippingOptions?.options.find((s) => s.service === selectedService);

  return (
    <div className="relative animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md sm:rounded-[2rem]">
      {/* top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/70 to-transparent" />
      {/* corner glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#d7ff53]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[#5e8bff]/10 blur-3xl" />

      <div className="relative p-4 sm:p-6 md:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs sm:tracking-[0.3em]">
              <span className="h-1 w-1 rounded-full bg-[#d7ff53] shadow-[0_0_8px_rgba(215,255,83,0.8)]" />
              Order Summary
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase sm:mt-3 sm:text-3xl">
              Your Order
            </h2>
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black sm:flex">
            {totalItems}
          </div>
        </div>

        {/* items */}
        <div className="mt-5 max-h-72 space-y-2.5 overflow-y-auto pr-1 sm:mt-6 sm:space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.productId}-${item.variantId}-${index}`}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05] sm:gap-4 sm:p-3.5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:h-16 sm:w-16">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 56px, 64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-black text-white/40">
                    IMG
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-black uppercase sm:text-sm">
                  {item.name}
                </h3>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/45 sm:mt-1 sm:text-[11px]">
                  {item.color ? `${item.color} • ` : ""}Size {item.size} • Qty {item.quantity}
                </p>
                <p className="mt-0.5 text-xs font-black sm:mt-1 sm:text-sm">
                  {rupiah(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* totals */}
        <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 sm:mt-6 sm:space-y-3 sm:pt-5">
          <SummaryRow label="Total Item" value={`${totalItems} pcs`} />
          <SummaryRow label="Subtotal" value={rupiah(subtotal)} />
          <SummaryRow
            label="Berat Total"
            value={formatWeight(totalWeight)}
            muted
          />
          <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-3.5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/55 sm:text-sm">
                Ongkir JNE
              </p>
              {selectedSvc ? (
                <p className="mt-0.5 text-[10px] font-bold text-white/45 sm:text-[11px]">
                  {selectedSvc.service} • {selectedSvc.etd || "estimasi"}
                </p>
              ) : shippingOptions ? (
                <p className="mt-0.5 text-[10px] font-bold text-amber-300/80 sm:text-[11px]">
                  Pilih layanan di step 3
                </p>
              ) : (
                <p className="mt-0.5 text-[10px] font-bold text-white/40 sm:text-[11px]">
                  Otomatis setelah isi kota
                </p>
              )}
            </div>
            <p
              className={`text-right text-sm font-black sm:text-base ${
                selectedShippingCost > 0 ? "text-[#d7ff53]" : "text-white/40"
              }`}
            >
              {selectedShippingCost > 0
                ? rupiah(selectedShippingCost)
                : shippingOptions
                ? "—"
                : "..."}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-0 -z-0 holographic opacity-30" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53]/80 sm:text-xs">
                  Total Bayar
                </p>
                <p className="text-[10px] font-bold text-white/50 sm:text-[11px]">
                  Subtotal + ongkir
                </p>
              </div>
              <p
                key={total}
                className="bg-gradient-to-r from-white via-[#d7ff53] to-white bg-clip-text text-xl font-black text-transparent sm:text-2xl md:text-3xl animate-number-flip"
              >
                {rupiah(total)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onCheckout}
          className="group/cta relative mt-5 w-full overflow-hidden rounded-full bg-white px-6 py-3.5 text-center text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-[#d7ff53] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-7 sm:px-7 sm:py-4"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Processing...
              </>
            ) : (
              <>
                Buat Pesanan
                <span className="transition-transform group-hover/cta:translate-x-1">→</span>
              </>
            )}
          </span>
          <span className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition group-hover/cta:opacity-100" />
        </button>

        <Link
          href="/cart"
          className="mt-3 flex rounded-full border border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-wider text-white/70 transition hover:bg-white hover:text-black sm:py-3.5 sm:text-sm"
        >
          Kembali ke Cart
        </Link>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 sm:text-[11px]">
          <span className="h-1 w-1 rounded-full bg-[#d7ff53]/60" />
          256-bit secure checkout
          <span className="h-1 w-1 rounded-full bg-[#d7ff53]/60" />
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
      <span className={`font-bold ${muted ? "text-white/40" : "text-white/55"}`}>
        {label}
      </span>
      <span className={`font-black ${muted ? "text-white/60" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

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
  items: CartItem[];
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
  const selectedSvc = shippingOptions?.options.find((s) => s.service === selectedService);
  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/80 px-3 py-4 backdrop-blur-md sm:items-center sm:px-4 sm:py-6 animate-fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl sm:rounded-[2rem] animate-blur-in">
        <div className="relative border-b border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(215,255,83,0.10),transparent_50%)]" />
          <p className="relative inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs sm:tracking-[0.3em]">
            <span className="h-1 w-1 rounded-full bg-[#d7ff53] shadow-[0_0_8px_rgba(215,255,83,0.8)]" />
            Konfirmasi Data Checkout
          </p>
          <h2 className="relative mt-2 text-2xl font-black uppercase leading-tight text-white sm:mt-3 sm:text-3xl md:text-4xl">
            Pastikan Data Sudah Benar
          </h2>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          <div className="relative overflow-hidden rounded-xl bg-[#d7ff53] p-4 text-black sm:rounded-[1.5rem] sm:p-5">
            <div className="pointer-events-none absolute inset-0 -z-0 holographic opacity-30" />
            <p className="relative text-sm font-black leading-7 sm:text-base sm:leading-8">
              Mohon cek kembali nama pembeli, nomor WhatsApp, alamat lengkap,
              kota, kecamatan, kode pos, dan layanan pengiriman sebelum
              membuat order.
            </p>
            <p className="relative mt-3 text-xs font-bold leading-6 text-black/70 sm:mt-4 sm:text-sm sm:leading-7">
              Kesalahan penulisan alamat, nomor WhatsApp, atau detail
              pengiriman menjadi tanggung jawab customer. Tim Official
              Merchandise WALI tidak bertanggung jawab atas keterlambatan,
              salah kirim, atau kendala pengiriman akibat data checkout yang
              tidak sesuai.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:mt-6 sm:rounded-[1.5rem] sm:p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/45 sm:text-sm">
              Data Checkout
            </h3>

            <div className="mt-3 space-y-2.5 text-sm sm:mt-4 sm:space-y-3">
              <ConfirmRow label="Nama" value={form.customer_name} />
              <ConfirmRow label="WhatsApp" value={form.customer_phone} />
              <ConfirmRow label="Email" value={form.customer_email} />
              <ConfirmRow label="Kota" value={form.city} />
              <div className="border-t border-white/10 pt-2.5 sm:pt-3">
                <p className="text-white/50">Alamat</p>
                <p className="mt-1.5 text-sm leading-6 text-white sm:mt-2 sm:leading-7">
                  {form.address || "-"}
                  {form.district ? `, ${form.district}` : ""}
                  {form.city ? `, ${form.city}` : ""}
                  {form.province ? `, ${form.province}` : ""}
                  {form.postal_code ? ` ${form.postal_code}` : ""}
                </p>
              </div>
              {form.notes && (
                <div className="border-t border-white/10 pt-2.5 sm:pt-3">
                  <p className="text-white/50">Catatan</p>
                  <p className="mt-1.5 text-sm leading-6 text-white sm:mt-2 sm:leading-7">
                    {form.notes}
                  </p>
                </div>
              )}

              <div className="border-t border-white/10 pt-2.5 sm:pt-3">
                <p className="text-white/50">Items ({totalItems})</p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((it, i) => (
                    <li
                      key={`${it.productId}-${it.variantId}-${i}`}
                      className="flex justify-between gap-3 text-xs sm:text-sm"
                    >
                      <span className="line-clamp-1 font-bold text-white/80">
                        {it.name} • {it.size} ×{it.quantity}
                      </span>
                      <span className="font-black text-white">
                        {rupiah(it.price * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-2.5 sm:pt-3">
                <ConfirmRow label="Subtotal" value={rupiah(subtotal)} highlight />
                {selectedSvc && (
                  <ConfirmRow
                    label={`Ongkir ${selectedSvc.service}`}
                    value={selectedSvc.etd ? `${rupiah(selectedShippingCost)} • ${selectedSvc.etd}` : rupiah(selectedShippingCost)}
                    highlight
                  />
                )}
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-2.5 sm:pt-3">
                  <span className="text-xs font-black uppercase tracking-widest text-white sm:text-sm">
                    Total
                  </span>
                  <span className="bg-gradient-to-r from-white via-[#d7ff53] to-white bg-clip-text text-base font-black text-transparent sm:text-lg">
                    {rupiah(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-full border border-white/10 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:opacity-50 sm:px-7 sm:py-4"
            >
              Cek Kembali
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="group/confirm relative overflow-hidden rounded-full bg-[#d7ff53] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 sm:py-4"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Processing...
                  </>
                ) : (
                  <>
                    Sudah Sesuai
                    <span className="transition-transform group-hover/confirm:translate-x-1">→</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span
        className={`max-w-[260px] text-right font-black sm:max-w-[300px] ${
          highlight ? "text-[#d7ff53]" : "text-white"
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}
