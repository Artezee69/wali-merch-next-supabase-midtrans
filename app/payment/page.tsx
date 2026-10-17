"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { rupiah } from "@/lib/format";
import { useCartContext } from "@/components/CartProvider";
import { useAuth } from "@/hooks/useAuth";

/* ─── Types ──────────────────────────────────────────────────── */

type PaymentOrderItem = {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type PaymentOrder = {
  order_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  address: string;
  province: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  notes: string | null;
  subtotal: number;
  shipping_cost: number;
  shipping_service: string | null;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_method?: string;
};

type BankInfo = {
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
};

type UploadState = "idle" | "uploading" | "done" | "error";

/* ─── Main Page Component ───────────────────────────────────── */

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
          <div className="text-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#d7ff53] border-t-transparent" />
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/50">Memuat...</p>
          </div>
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order") || "";

  const { profile } = useAuth();
  const { clearCart } = useCartContext();

  /* fetched data */
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PaymentOrderItem[]>([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState("");

  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
  });
  const [whatsappAdmin, setWhatsappAdmin] = useState("");

  /* payment method state */
  const [activeMethod, setActiveMethod] = useState<"transfer" | "gateway">("transfer");
  const [showGatewayPopup, setShowGatewayPopup] = useState(false);

  /* upload state */
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Load order data from the GET API ─────────────────────── */
  useEffect(() => {
    if (!orderParam) {
      setOrderError("Nomor order tidak ditemukan. Silakan checkout ulang.");
      setOrderLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setOrderLoading(true);
        const res = await fetch(
          `/api/payment/order?order_code=${encodeURIComponent(orderParam)}`,
          { method: "GET" }
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setOrderError(data?.error || "Gagal memuat data order.");
          setOrderLoading(false);
          return;
        }

        if (data.order) {
          const o = data.order;
          setOrder({
            order_code: o.order_code,
            customer_name: o.customer_name || "",
            customer_email: o.customer_email,
            customer_phone: o.customer_phone || "",
            address: o.address || "",
            province: o.province,
            city: o.city,
            district: o.district,
            postal_code: o.postal_code,
            notes: o.notes,
            subtotal: Number(o.subtotal || 0),
            shipping_cost: Number(o.shipping_cost || 0),
            shipping_service: o.shipping_service,
            total_amount: Number(o.total_amount || 0),
            payment_status: o.payment_status || "pending",
            order_status: o.order_status || "waiting_payment",
            payment_method: o.payment_method,
          });
        }

        if (Array.isArray(data.items)) {
          setOrderItems(
            data.items.map((it: any) => ({
              id: it.id,
              product_id: it.product_id,
              variant_id: it.variant_id,
              product_name: it.product_name || "",
              size: it.size || "",
              price: Number(it.price || 0),
              quantity: Number(it.quantity || 1),
              subtotal: Number(it.subtotal || 0),
            }))
          );
        }

        if (data.bank_info) {
          setBankInfo({
            bank_name: data.bank_info.bank_name || "",
            bank_account_number: data.bank_info.bank_account_number || "",
            bank_account_holder: data.bank_info.bank_account_holder || "",
          });
        }
        if (data.whatsapp_admin) {
          setWhatsappAdmin(data.whatsapp_admin);
        }

        setOrderLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setOrderError(err.message || "Gagal memuat data order.");
          setOrderLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderParam]);

  /* ── Handlers ──────────────────────────────────────────────── */

  function handleSelectTransfer() {
    setActiveMethod("transfer");
  }

  function handleSelectGateway() {
    setShowGatewayPopup(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;

    if (file) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        setUploadError("Format file harus JPG, PNG, atau WEBP.");
        setUploadState("error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Ukuran file maksimal 5MB.");
        setUploadState("error");
        return;
      }
    }

    setProofFile(file);
    setUploadState("idle");
    setUploadError("");

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProofPreview(ev.target?.result as string || null);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  }

  async function handleUploadProof() {
    if (!proofFile || !order) return;

    setSubmitting(true);
    setUploadState("uploading");
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("order_code", order.order_code);
      formData.append("proof", proofFile);

      const res = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah bukti transfer.");
      }

      // Clear the cart on successful proof submission
      try {
        await clearCart();
      } catch {
        // non-blocking
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cart-updated"));
      }

      setUploadState("done");
      setShowSuccessModal(true);
    } catch (err: any) {
      setUploadState("error");
      setUploadError(err.message || "Gagal mengunggah. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Computed values ───────────────────────────────────────── */
  const totalItems = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.quantity, 0),
    [orderItems]
  );

  const waLink = useMemo(() => {
    if (!order) return "";
    const buyerName = order.customer_name || profile?.full_name || "Customer";
    const totalAmount = rupiah(order.total_amount);
    const msg = `Halo admin saya ${buyerName} Saya sudah Checkout dengan no pesanan ${order.order_code} Dan sudah Transfer sejumlah ${totalAmount} , dan bukti Tf nya sudah dikirim ya Admin, Tolong segera Di proses pesanan saya, Terimakasih`;
    const number = whatsappAdmin.replace(/[^0-9]/g, "");
    if (!number) return "";
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  }, [order, whatsappAdmin, profile?.full_name]);

  /* ── Render ──────────────────────────────────────────── */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gray-900 text-gray-100 dark:bg-[#060606] dark:text-white">
      {/* Cinematic global background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[120vh] w-[140vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,_rgba(215,255,83,0.10),_transparent_55%)]" />
        <div className="absolute -left-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-[#1a1a1a]/20 blur-[140px] animate-aurora-2" />
        <div className="absolute -right-40 bottom-1/4 h-[36rem] w-[36rem] rounded-full bg-[#1a1a1a]/10 blur-[140px] animate-aurora-1" />
        <div className="absolute left-1/2 top-2/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#d7ff53]/10 blur-[160px] animate-aurora-3" />
        <div className="absolute inset-0 bg-grid-fade [background-size:56px_56px] opacity-[0.22]" />
        <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,#060606_5%,transparent_70%)]" />
      </div>

      <Navbar activeKey="cart" />

      <PageHeader
        badge="Secure Payment"
        title="Pembayaran"
        highlight="Order"
        description="Lakukan pembayaran dengan transfer bank dan upload bukti transfer untuk memverifikasi pesanan kamu."
      />

      <section className="relative mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        {orderLoading ? (
          <LoadingCard />
        ) : orderError ? (
          <ErrorCard
            message={orderError}
            onHome={() => router.push("/")}
            onCheckout={() => router.push("/checkout")}
          />
        ) : order ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
            {/* LEFT: Payment flow */}
            <div className="space-y-5 sm:space-y-6">
              <PaymentSteps step={3} />

              {/* Order Summary Card */}
              <PaymentCard index="01" badge="Order Summary" title="Ringkasan Pesanan">
                <div className="rounded-2xl border border-[#d7ff53]/20 bg-[#d7ff53]/[0.04] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7ff53] text-sm font-black text-black sm:h-12 sm:w-12 sm:text-base">
                      {order.order_code.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/45 sm:text-xs">
                        Invoice No
                      </p>
                      <p className="text-sm font-black text-white sm:text-base">
                        {order.order_code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-4 space-y-2.5 sm:space-y-3">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, i) => (
                      <div
                        key={item.id || `${item.product_id}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:gap-4 sm:p-4"
                      >
                        <div className="min-w-0">
                          <h3 className="text-xs font-black uppercase sm:text-sm">
                            {item.product_name || "Produk"}
                          </h3>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/45 sm:mt-1 sm:text-[11px]">
                            {item.size || "Default"} &bull; Qty {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-black sm:text-base">
                          {rupiah(item.subtotal || item.price * item.quantity)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">Detail item tidak tersedia.</p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4 sm:mt-5 sm:space-y-3 sm:pt-5">
                  <SummaryRow label="Total Item" value={`${totalItems} pcs`} />
                  <SummaryRow label="Subtotal" value={rupiah(order.subtotal)} />
                  <SummaryRow
                    label={order.shipping_service ? `Ongkir ${order.shipping_service}` : "Ongkir"}
                    value={order.shipping_cost > 0 ? rupiah(order.shipping_cost) : "Gratis"}
                  />
                  <div className="relative overflow-hidden rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-4 sm:p-5">
                    <div className="pointer-events-none absolute inset-0 -z-0 holographic opacity-30" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#d7ff53]/80 sm:text-xs">
                          Total Bayar
                        </p>
                        <p className="text-[10px] font-bold text-white/50 sm:text-[11px]">
                          Subtotal + Ongkir
                        </p>
                      </div>
                      <p className="bg-gradient-to-r from-white via-[#d7ff53] to-white bg-clip-text text-xl font-black text-transparent sm:text-2xl md:text-3xl animate-number-flip">
                        {rupiah(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </PaymentCard>

              {/* Payment Method Card */}
              <PaymentCard index="02" badge="Payment Method" title="Metode Pembayaran">
                <div className="grid gap-3 sm:gap-4">
                  {/* Transfer Bank - Active */}
                  <button
                    type="button"
                    onClick={handleSelectTransfer}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 ${
                      activeMethod === "transfer"
                        ? "border-[#d7ff53] bg-[#d7ff53]/10 shadow-[0_0_30px_-10px_rgba(215,255,83,0.4)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
                    }`}
                  >
                    {activeMethod === "transfer" && (
                      <span className="pointer-events-none absolute inset-0 -z-10 holographic opacity-30" />
                    )}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black sm:h-12 sm:w-12 sm:text-sm ${
                        activeMethod === "transfer"
                          ? "bg-[#d7ff53] text-black"
                          : "bg-white/5 text-white/55"
                      }`}
                    >
                      {activeMethod === "transfer" ? "✓" : "TB"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase sm:text-base">
                        Transfer Bank
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-white/55 sm:text-xs">
                        Transfer manual ke rekening bank
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#d7ff53]/40 bg-[#d7ff53]/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#d7ff53] sm:text-[10px]">
                      Aktif
                    </span>
                  </button>

                  {/* Gateway Payment - Disabled */}
                  <button
                    type="button"
                    onClick={handleSelectGateway}
                    className="group relative flex cursor-not-allowed items-center gap-3 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 opacity-60 sm:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs font-black text-white/30 sm:h-12 sm:w-12 sm:text-sm">
                      GW
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase text-white/40 sm:text-base">
                        Gateway Payment
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-white/30 sm:text-xs">
                        Midtrans / e-Wallet
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40 sm:text-[10px]">
                      Maintenance
                    </span>
                  </button>
                </div>
              </PaymentCard>

              {/* Transfer Details Card - only when transfer is active */}
              {activeMethod === "transfer" && (
                <PaymentCard index="03" badge="Transfer Details" title="Detail Transfer">
                  <div className="space-y-4">
                    {/* Bank info box */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/45 sm:text-xs">
                        Rekening Tujuan
                      </p>
                      {bankInfo.bank_name ? (
                        <div className="mt-3 space-y-2">
                          <InfoRow label="Nama Bank" value={bankInfo.bank_name} />
                          <InfoRow
                            label="No. Rekening"
                            value={bankInfo.bank_account_number}
                            mono
                            copyable
                          />
                          <InfoRow label="Atas Nama" value={bankInfo.bank_account_holder} />
                        </div>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-amber-300/80">
                          Detail rekening sedang diupdate. Hubungi admin untuk info transfer.
                        </p>
                      )}
                    </div>

                    {/* Transfer amount hint */}
                    <div className="rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/5 p-3 text-[11px] font-semibold leading-5 text-white/65 sm:text-xs">
                      Transfer nominal{" "}
                      <strong className="text-[#d7ff53]">{rupiah(order.total_amount)}</strong>{" "}
                      ke rekening di atas. Setelah transfer,{" "}
                      <strong>unggah bukti transfer</strong> di bawah untuk mempercepat
                      proses verifikasi.
                    </div>

                    {/* Upload proof */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/45 sm:text-xs">
                        Unggah Bukti Transfer
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-white/55 sm:text-sm">
                        Screenshot transfer bank (JPG, PNG, atau WEBP - maks 5MB)
                      </p>

                      <div className="mt-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          id="proof-upload-input"
                        />

                        {!proofFile ? (
                          <div
                            className="group/upload flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-black/30 px-4 py-8 text-center transition hover:border-[#d7ff53]/40 hover:bg-black/50 sm:py-10"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl sm:h-14 sm:w-14 sm:text-2xl">
                              📎
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-white/60 sm:text-sm">
                              Klik atau tarik foto ke sini
                            </span>
                            <span className="text-[10px] font-semibold text-white/35 sm:text-[11px]">
                              Format: JPG, PNG, WEBP
                            </span>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="mt-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:border-[#d7ff53]/50 hover:bg-[#d7ff53]/10 hover:text-[#d7ff53] sm:text-xs"
                            >
                              Pilih File
                            </button>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5">
                            {proofPreview && (
                              <div className="relative h-40 w-full overflow-hidden sm:h-48">
                                <Image
                                  src={proofPreview}
                                  alt="Bukti transfer"
                                  fill
                                  sizes="(max-width: 640px) 100vw, 480px"
                                  className="object-contain bg-black"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3 border-t border-white/10 p-3 sm:p-4">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-white/70 sm:text-sm">
                                  {proofFile.name}
                                </p>
                                <p className="text-[10px] font-semibold text-white/40 sm:text-[11px]">
                                  {(proofFile.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProofFile(null);
                                  setProofPreview(null);
                                  setUploadState("idle");
                                  setUploadError("");
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-xs"
                              >
                                Ganti
                              </button>
                            </div>
                          </div>
                        )}

                        {uploadState === "error" && (
                          <p className="mt-2 text-xs font-bold text-red-300 sm:text-sm">
                            {uploadError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="button"
                      disabled={!proofFile || submitting || uploadState === "done"}
                      onClick={handleUploadProof}
                      className="group/submit relative w-full overflow-hidden rounded-full bg-white px-6 py-3.5 text-center text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-[#d7ff53] disabled:cursor-not-allowed disabled:opacity-40 sm:px-7 sm:py-4"
                    >
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                            Mengirim...
                          </>
                        ) : uploadState === "done" ? (
                          <>
                            ✓ Terkirim
                          </>
                        ) : (
                          <>
                            Kirim
                            <span className="transition-transform group-hover/submit:translate-x-1">
                              →
                            </span>
                          </>
                        )}
                      </span>
                      <span className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition group-hover/submit:opacity-100" />
                    </button>
                  </div>
                </PaymentCard>
              )}
            </div>

            {/* RIGHT: Shipping info + Status */}
            <aside className="h-fit space-y-4 lg:sticky lg:top-28">
              {/* Shipping info card */}
              <div className="relative animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:rounded-[2rem] sm:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/70 to-transparent" />
                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d7ff53] sm:text-xs sm:tracking-[0.3em]">
                  <span className="h-1 w-1 rounded-full bg-[#d7ff53] shadow-[0_0_8px_rgba(215,255,83,0.8)]" />
                  Shipping
                </p>
                <h3 className="mt-2 text-lg font-black uppercase sm:text-xl">
                  Alamat Pengiriman
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-black text-white">{order.customer_name}</p>
                  <p className="font-semibold text-white/65">{order.customer_phone}</p>
                  {order.customer_email && (
                    <p className="text-white/45">{order.customer_email}</p>
                  )}
                  <p className="leading-6 text-white/70 sm:leading-7">
                    {order.address}
                    {order.district ? `, ${order.district}` : ""}
                    {order.city ? `, ${order.city}` : ""}
                    {order.province ? `, ${order.province}` : ""}
                    {order.postal_code ? ` ${order.postal_code}` : ""}
                  </p>
                  {order.notes && (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/55 sm:text-sm sm:leading-6">
                      {order.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Status card */}
              <div className="relative animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:rounded-[2rem] sm:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/70 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7ff53]/15 text-[#d7ff53] sm:h-12 sm:w-12 sm:text-xl">
                    ⏳
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45 sm:text-xs">
                      Status
                    </p>
                    <p className="text-sm font-black uppercase sm:text-base">
                      Menunggu Pembayaran
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-white/50 sm:mt-4 sm:text-sm sm:leading-6">
                  Pesanan akan diproses setelah admin memverifikasi bukti
                  transfer yang kamu kirim. Estimasi verifikasi 1-2 jam kerja.
                </p>
              </div>

              {/* Track order link */}
              <Link
                href={`/track-order?q=${encodeURIComponent(order.order_code)}`}
                className="flex rounded-full border border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-wider text-white/70 transition hover:bg-white hover:text-black sm:py-3.5 sm:text-sm"
              >
                Track Pesanan Ini
              </Link>
            </aside>
          </div>
        ) : null}
      </section>

      <Footer />

      {/* Gateway Maintenance Popup */}
      {showGatewayPopup && (
        <GatewayMaintenancePopup onClose={() => setShowGatewayPopup(false)} />
      )}

      {/* Success Modal (after upload) */}
      {showSuccessModal && order && (
        <SuccessModal
          order={order}
          waLink={waLink}
          buyerName={order.customer_name || profile?.full_name || "Customer"}
          whatsappAdmin={whatsappAdmin}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </main>
  );
}

/* ─── Sub Components ─────────────────────────────────────────── */

function PaymentSteps({ step }: { step: number }) {
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

function PaymentCard({
  index,
  badge,
  title,
  children,
}: {
  index: string;
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:rounded-[2rem] sm:p-5 md:p-7">
      <div className="pointer-events-none absolute -right-3 -top-3 font-display text-[5rem] font-black leading-none text-white/[0.04] sm:-right-4 sm:-top-4 sm:text-[7rem]">
        {index}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7ff53]/60 to-transparent opacity-60" />
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

function InfoRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (!copyable || !value || value === "-") return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-white/50 sm:text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-right text-xs font-black sm:text-sm ${
            mono ? "font-mono text-[#d7ff53]" : "text-white"
          }`}
        >
          {value}
        </span>
        {copyable && value && value !== "-" && (
          <button
            type="button"
            onClick={copyValue}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] transition ${
              copied
                ? "border-[#d7ff53] bg-[#d7ff53]/20 text-[#d7ff53]"
                : "border-white/15 bg-white/5 text-white/50 hover:border-[#d7ff53]/50 hover:text-[#d7ff53]"
            }`}
            title={copied ? "Tersalin!" : "Salin"}
          >
            {copied ? "✓" : "⧉"}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="group relative animate-blur-in overflow-hidden rounded-[2rem] border border-gray-700 dark:border-white/10 bg-gray-200 dark:bg-white/[0.04] p-6 text-center backdrop-blur-md sm:p-8 md:rounded-[2.5rem] md:p-14">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,83,0.18),transparent_60%)] opacity-60" />
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gray-700 dark:border-white/10 bg-gradient-to-br from-gray-300 dark:from-white/10 to-gray-100 dark:to-white/0 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] sm:mb-6 sm:h-20 sm:w-20 sm:text-3xl animate-float-y">
        ⏳
      </div>
      <h2 className="text-2xl font-black uppercase text-gray-800 dark:text-white sm:text-3xl md:text-5xl">
        Memuat Order
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600 dark:text-gray-300 sm:mt-4 sm:text-base sm:leading-8">
        Sedang mengambil data pesanan kamu...
      </p>
    </div>
  );
}

function ErrorCard({
  message,
  onHome,
  onCheckout,
}: {
  message: string;
  onHome: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="group relative animate-blur-in overflow-hidden rounded-[2rem] border border-red-500/20 bg-red-500/[0.04] p-6 text-center backdrop-blur-md sm:p-8 md:rounded-[2.5rem] md:p-14">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-2xl sm:mb-6 sm:h-20 sm:w-20 sm:text-3xl">
        ✕
      </div>
      <h2 className="text-2xl font-black uppercase text-red-300 sm:text-3xl md:text-4xl">
        Order Tidak Ditemukan
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-red-200/70 sm:mt-4 sm:text-base sm:leading-8">
        {message}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={onCheckout}
          className="rounded-full bg-white px-7 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-[#d7ff53] sm:px-8 sm:py-4"
        >
          Kembali ke Checkout
        </button>
        <button
          type="button"
          onClick={onHome}
          className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white/70 transition hover:bg-white/10 sm:px-8 sm:py-4"
        >
          Halaman Beranda
        </button>
      </div>
    </div>
  );
}

function GatewayMaintenancePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 bg-gray-900 dark:bg-black shadow-2xl sm:rounded-[2rem] animate-blur-in">
        <div className="relative border-b border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.10),transparent_50%)]" />
          <p className="relative inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 sm:text-xs sm:tracking-[0.3em]">
            <span className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            Gateway Maintenance
          </p>
          <h2 className="relative mt-2 text-2xl font-black uppercase leading-tight text-white sm:mt-3 sm:text-3xl">
            Sedang Maintenance
          </h2>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm leading-7 text-white/70 sm:leading-8">
            Pembayaran gateway (Midtrans / e-Wallet) sedang dalam
            pemeliharaan. Silakan gunakan metode{" "}
            <span className="font-black text-[#d7ff53]">Transfer Bank</span>{" "}
            untuk menyelesaikan pesanan kamu.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-full border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10 sm:mt-6 sm:px-7 sm:py-4"
          >
            Pahami
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({
  order,
  waLink,
  buyerName,
  whatsappAdmin,
  onClose,
}: {
  order: PaymentOrder;
  waLink: string;
  buyerName: string;
  whatsappAdmin: string;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#d7ff53]/20 bg-gray-900 dark:bg-black shadow-2xl sm:rounded-[2rem] animate-blur-in">
        {/* Top accent */}
        <div className="relative border-b border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(215,255,83,0.15),transparent_50%)]" />

          {/* Success icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d7ff53] text-2xl text-black shadow-[0_0_30px_-5px_rgba(215,255,83,0.5)] sm:h-16 sm:w-16 sm:text-3xl">
            ✓
          </div>

          <p className="relative text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53] sm:text-xs">
            Bukti Transfer Terkirim
          </p>

          {/* Order number - prominent */}
          <div className="relative mt-4 rounded-2xl border border-[#d7ff53]/30 bg-[#d7ff53]/5 p-4 sm:p-5">
            <div className="pointer-events-none absolute inset-0 -z-0 holographic opacity-20" />
            <p className="relative text-center text-[10px] font-black uppercase tracking-widest text-white/45 sm:text-xs">
              No. Order
            </p>
            <p className="relative mt-1 text-center text-2xl font-black tracking-wider text-[#d7ff53] sm:text-3xl">
              {order.order_code}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-center text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
            Tolong disimpan no order ini untuk melacak pesanan kamu di website kami
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/");
              }}
              className="group/home flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-[#d7ff53] sm:px-7 sm:py-4"
            >
              Kembali ke Halaman Utama
              <span className="transition-transform group-hover/home:translate-x-1">→</span>
            </button>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/wa flex w-full items-center justify-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-green-400 transition hover:scale-[1.02] hover:bg-green-500/20 sm:px-7 sm:py-4"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.199.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.882-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.586-.916-2.181-.242-.579-.487-.5-.669-.51-.174-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.855 1.213 3.054.149.198 2.096 3.21 5.077 4.479.709.302 1.262.483 1.694.617.709.226 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.096 5.489c-.272 0-.571-.01-.872-.029-.391-.014-.79-.063-1.212-.107-.436-.045-.854-.118-1.289-.223-.478-.117-.937-.274-1.372-.465-.427-.187-.825-.412-1.196-.668-.354-.243-.681-.517-.982-.813-.306-.3-.565-.631-.777-.988-.211-.358-.383-.737-.515-1.13-.135-.399-.233-.816-.293-1.238-.061-.434-.084-.877-.072-1.33.014-.454.056-.909.125-1.35.07-.44.176-.869.317-1.28.146-.414.327-.81.54-1.186.215-.377.465-.734.748-1.068.3-.345.632-.655.997-.93.365-.275.759-.503 1.176-.682.417-.178.854-.308 1.302-.386.45-.078.914-.113 1.384-.108.469.005.933.047 1.383.125.45.078.884.194 1.302.347.417.154.815.345 1.186.571.37.226.713.484 1.022.775.309.292.581.615.814.962.232.346.426.718.577 1.105.15.387.259.79.324 1.201.065.412.088.833.067 1.254-.021.421-.085.84-.191 1.245-.106.406-.253.795-.44 1.158-.187.363-.416.702-.685 1.012-.269.311-.572.584-.91.818-.338.235-.705.425-1.098.57-.393.144-.808.244-1.235.3-.427.055-.865.068-1.31.059z" />
                </svg>
                Percepat Pemrosesan
                <span className="transition-transform group-hover/wa:translate-x-1">→</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-full border border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-wider text-white/40 transition hover:bg-white/5 hover:text-white/60 sm:py-3.5 sm:text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
