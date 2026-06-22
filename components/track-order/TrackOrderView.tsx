"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import {
  Package,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Sparkles,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Zap,
  Activity,
  Receipt,
} from "lucide-react";

type Props = {
  q: string;
  order: any | null;
  errorMessage: string;
  orderStatus: string | undefined;
  whatsappAdmin: string;
  whatsappText: string;
};

const statusClass: Record<string, string> = {
  waiting_payment:
    "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.5)]",
  pending:
    "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.5)]",
  paid: "bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]",
  processing:
    "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)]",
  shipped:
    "bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)]",
  completed:
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  failed: "bg-red-500/10 text-red-300 border-red-500/30 shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)]",
};

const statusLabel: Record<string, string> = {
  waiting_payment: "Menunggu Pembayaran",
  pending: "Menunggu Pembayaran",
  paid: "Pembayaran Berhasil",
  processing: "Sedang Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  failed: "Pembayaran Gagal",
};

const statusIcon: Record<string, any> = {
  waiting_payment: Clock,
  pending: Clock,
  paid: CreditCard,
  processing: Activity,
  shipped: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
  failed: AlertCircle,
};

function getStatusLabel(status?: string) {
  if (!status) return "Menunggu Konfirmasi";
  return statusLabel[status] || status.replaceAll("_", " ");
}

function getStatusClass(status?: string) {
  if (!status) return statusClass.waiting_payment;
  return statusClass[status] || "bg-white/10 text-white border-white/20";
}

function getStatusIcon(status?: string) {
  const key = status || "waiting_payment";
  return statusIcon[key] || Package;
}

// Samakan status dari berbagai sumber (status / order_status / payment_status)
// menjadi key kanonik (waiting_payment, paid, dst). Alias 'pending' dan
// null/undefined dipetakan ke 'waiting_payment'.
function normalizeStatus(status?: string) {
  if (!status) return "waiting_payment";
  if (status === "pending") return "waiting_payment";
  return status;
}

function getTimelineSteps(status?: string) {
  const steps = [
    { key: "waiting_payment", label: "Pesanan Dibuat", desc: "Order berhasil tercatat" },
    { key: "paid", label: "Pembayaran", desc: "Pembayaran diterima" },
    { key: "processing", label: "Diproses", desc: "Pesanan sedang disiapkan" },
    { key: "shipped", label: "Dikirim", desc: "Dalam perjalanan" },
    { key: "completed", label: "Selesai", desc: "Pesanan diterima" },
  ];

  const statusOrder = ["waiting_payment", "paid", "processing", "shipped", "completed"];
  const currentIdx = statusOrder.indexOf(status || "waiting_payment");
  const isCancelled = status === "cancelled" || status === "failed";

  return steps.map((s, i) => ({
    ...s,
    state: isCancelled
      ? i === 0
        ? "done"
        : "skipped"
      : i < currentIdx
        ? "done"
        : i === currentIdx
          ? "current"
          : "pending",
  }));
}

function formatDate(d?: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

// Tampilkan nilai persis dari kolom DB yang sudah di-save saat checkout,
// supaya ringkasan di track order selalu match dengan halaman checkout.
// API checkout mengirim: subtotal, shipping_cost, total_amount = subtotal + shipping_cost
function computeOrderBreakdown(order: any) {
  const subtotal = Number(order?.subtotal) || 0;
  const shipping = Number(order?.shipping_cost) || 0;
  const total = Number(order?.total_amount) || subtotal + shipping;

  return { subtotal, shipping, total };
}

export default function TrackOrderView({
  q,
  order,
  errorMessage,
  orderStatus,
  whatsappAdmin,
  whatsappText,
}: Props) {
  return (
    <>
      {/* CINEMATIC BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#d7ff53]/8 blur-[140px] animate-aurora-1" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[140px] animate-aurora-2" />
        <div className="absolute left-1/2 bottom-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-500/6 blur-[140px] animate-aurora-3" />
        <div className="absolute inset-0 bg-grid-fade opacity-30" />
      </div>

      {/* SEARCH FORM */}
      <section className="mx-auto max-w-5xl px-4 pt-6 md:px-8 md:pt-10">
        <div
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-6 md:p-7"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-[#d7ff53]/0 via-[#d7ff53]/10 to-[#d7ff53]/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10">
              <Search className="h-4 w-4 text-[#d7ff53]" />
            </div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53] sm:text-xs sm:tracking-[0.35em]">
              Cek Pesanan
            </label>
          </div>

          <h2 className="mt-3 text-xl font-black uppercase sm:mt-4 sm:text-2xl md:text-3xl">
            Lacak Status Order Kamu
          </h2>

          <form
            method="get"
            className="mt-5 flex flex-col gap-3 sm:mt-6 md:flex-row"
          >
            <div className="relative flex-1">
              <Receipt className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 sm:left-5" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Contoh: WALI-20260526-001 atau 628xxxx"
                className="w-full rounded-full border border-white/10 bg-black/50 py-3.5 pl-11 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition-all placeholder:text-white/30 focus:border-[#d7ff53] focus:bg-black/70 focus:shadow-[0_0_30px_-5px_rgba(215,255,83,0.3)] sm:py-4 sm:pl-13 sm:text-base"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>

            <button
              type="submit"
              className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_40px_-5px_rgba(215,255,83,0.6)] sm:px-8 sm:py-4"
            >
              <span className="relative z-10">Track Order</span>
              <ChevronRight className="relative z-10 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </form>

          <p className="mt-4 text-xs leading-6 text-white/45 sm:mt-5 sm:text-sm sm:leading-7">
            Kode order biasanya muncul setelah checkout berhasil dibuat. Kalau
            lupa kode order, coba masukkan nomor WhatsApp kamu.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
        {!q ? (
          <div className="space-y-5 sm:space-y-6">
            {/* INFO CARDS */}
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {[
                {
                  title: "Waiting Payment",
                  desc: "Pesanan sudah dibuat tapi pembayaran belum berhasil.",
                  icon: Clock,
                  color: "from-yellow-500/20 to-yellow-500/0",
                  delay: "0ms",
                },
                {
                  title: "Processing",
                  desc: "Pembayaran sudah masuk dan pesanan sedang disiapkan.",
                  icon: Activity,
                  color: "from-purple-500/20 to-purple-500/0",
                  delay: "100ms",
                },
                {
                  title: "Shipped",
                  desc: "Pesanan sudah dikirim dan nomor resi akan ditampilkan.",
                  icon: Truck,
                  color: "from-cyan-500/20 to-cyan-500/0",
                  delay: "200ms",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-all hover:border-[#d7ff53]/30 hover:bg-white/[0.06] sm:rounded-[1.5rem] sm:p-6 animate-fade-up"
                  style={{ animationDelay: item.delay }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.color} opacity-50 transition-opacity group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 sm:mb-4 sm:h-12 sm:w-12">
                      <item.icon className="h-4 w-4 text-[#d7ff53] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-base font-black uppercase sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-white/55 sm:text-sm sm:leading-7">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* HINT */}
            <div
              className="relative overflow-hidden rounded-2xl border border-[#d7ff53]/20 bg-gradient-to-br from-[#d7ff53]/5 via-black/40 to-black/40 p-5 sm:rounded-[1.5rem] sm:p-6 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d7ff53]/10 blur-3xl" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 sm:h-12 sm:w-12">
                  <Sparkles className="h-4 w-4 text-[#d7ff53] sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase sm:text-base">
                    Belum Punya Kode Order?
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/55 sm:text-sm sm:leading-7">
                    Selesaikan checkout dulu di halaman Cart, lalu kode order
                    akan otomatis tersedia di sini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : errorMessage ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center backdrop-blur-xl animate-scale-in sm:rounded-[2rem] sm:p-8"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 sm:mb-5 sm:h-16 sm:w-16">
              <AlertCircle className="h-6 w-6 text-red-300 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-xl font-black uppercase text-red-300 sm:text-2xl">
              Terjadi Error
            </h2>
            <p className="mt-2.5 text-sm text-white/60 sm:mt-3 sm:text-base">
              {errorMessage}
            </p>
          </div>
        ) : !order ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl sm:mb-6 sm:h-20 sm:w-20 sm:text-3xl">
                🔍
              </div>
              <h2 className="text-2xl font-black uppercase sm:text-3xl md:text-4xl">
                Pesanan Tidak Ditemukan
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/55 sm:mt-4 sm:text-base sm:leading-8">
                Pastikan kode order atau nomor WhatsApp sudah benar. Kalau
                masih belum ketemu, hubungi admin untuk pengecekan manual.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
                <Link
                  href="/track-order"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-black uppercase tracking-wider backdrop-blur-md transition hover:bg-white hover:text-black sm:px-7 sm:py-4"
                >
                  Coba Lagi
                </Link>
                {whatsappAdmin && (
                  <a
                    href={`https://wa.me/${whatsappAdmin}?text=${whatsappText}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d7ff53] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] hover:bg-white sm:px-7 sm:py-4"
                  >
                    Hubungi Admin
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <OrderDetail
            order={order}
            orderStatus={orderStatus}
            whatsappAdmin={whatsappAdmin}
            whatsappText={whatsappText}
          />
        )}
      </section>
    </>
  );
}

function OrderDetail({
  order: initialOrder,
  orderStatus: initialOrderStatus,
  whatsappAdmin,
  whatsappText,
}: {
  order: any;
  orderStatus: string | undefined;
  whatsappAdmin: string;
  whatsappText: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 12; // 12 × 5 detik = 1 menit total polling

  // Polling: kalau pesanan masih menunggu pembayaran, refresh data
  // tiap 5 detik supaya status otomatis terupdate setelah webhook
  // Midtrans menandai order sebagai paid/cancelled/failed.
  useEffect(() => {
    const statusKey = normalizeStatus(orderStatus);
    const isFinal =
      statusKey === "paid" ||
      statusKey === "cancelled" ||
      statusKey === "failed" ||
      statusKey === "processing" ||
      statusKey === "shipped" ||
      statusKey === "completed";

    // Stop polling jika status sudah final atau sudah polling terlalu lama
    if (isFinal || pollCount >= maxPolls) return;

    const interval = setInterval(async () => {
      try {
        // Fetch data order terbaru dari API tanpa reload halaman
        const response = await fetch(`/api/track-order/${order.order_code}`);
        if (response.ok) {
          const data = await response.json();
          if (data.order) {
            setOrder(data.order);
            // Update orderStatus dari data terbaru
            const newStatus = data.order.status || data.order.order_status || data.order.payment_status || data.order.state;
            setOrderStatus(newStatus);
          }
        }
        setPollCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to poll order status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderStatus, pollCount, order.order_code]);

  const breakdown = computeOrderBreakdown(order);
  const StatusIcon = getStatusIcon(orderStatus);
  const snapToken = order?.midtrans_token || null;
  const snapRedirectUrl = order?.midtrans_redirect_url || null;
  const isPendingPayment =
    normalizeStatus(orderStatus) === "waiting_payment" ||
    normalizeStatus(orderStatus) === "pending";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ORDER HEADER - CINEMATIC */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-black/40 p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-7 md:p-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#d7ff53]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start md:gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#d7ff53] sm:h-4 sm:w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53] sm:text-xs sm:tracking-[0.35em]">
                Order Found
              </p>
            </div>
            <h2 className="mt-2 break-all text-2xl font-black uppercase sm:mt-3 sm:text-3xl md:text-4xl lg:text-5xl">
              {order.order_code}
            </h2>
            <p className="mt-2 text-sm text-white/55 sm:mt-3 sm:text-base">
              Pesanan atas nama{" "}
              <span className="font-black text-white">
                {order.customer_name}
              </span>
            </p>
            <p className="mt-1 text-xs text-white/35 sm:mt-1.5">
              {formatDate(order.created_at)}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md sm:px-5 sm:py-3 sm:text-sm ${getStatusClass(
              orderStatus,
            )}`}
          >
            <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {getStatusLabel(orderStatus)}
          </div>
        </div>
      </div>

      {/* TIMELINE TRACKER */}
      {orderStatus !== "cancelled" && orderStatus !== "failed" && (
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-6 md:p-7"
          style={{ animationDelay: "100ms" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#d7ff53]/3 to-transparent" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5 sm:mb-7">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10">
                <Activity className="h-4 w-4 text-[#d7ff53]" />
              </div>
              <h3 className="text-base font-black uppercase sm:text-lg">
                Progress Pesanan
              </h3>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-white/10 via-white/10 to-transparent sm:left-6" />

              {getTimelineSteps(orderStatus).map((step, i) => (
                <div
                  key={step.key}
                  className="relative flex items-start gap-3 pb-5 last:pb-0 sm:gap-4 sm:pb-7 animate-slide-in"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 ${
                        step.state === "done"
                          ? "border-[#d7ff53] bg-[#d7ff53] shadow-[0_0_20px_-3px_rgba(215,255,83,0.5)]"
                          : step.state === "current"
                            ? "border-[#d7ff53] bg-[#d7ff53]/20 shadow-[0_0_25px_-3px_rgba(215,255,83,0.6)]"
                            : "border-white/15 bg-white/5"
                      }`}
                    >
                      {step.state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-black sm:h-5 sm:w-5" />
                      ) : step.state === "current" ? (
                        <div className="h-2 w-2 animate-pulse rounded-full bg-[#d7ff53] sm:h-2.5 sm:w-2.5" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30 sm:h-2 sm:w-2" />
                      )}
                    </div>
                    {step.state === "current" && (
                      <span className="absolute inset-0 animate-ping rounded-full border border-[#d7ff53]/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                    <p
                      className={`text-sm font-black uppercase sm:text-base ${
                        step.state === "pending" ? "text-white/40" : "text-white"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`mt-0.5 text-xs sm:mt-1 sm:text-sm ${
                        step.state === "pending" ? "text-white/30" : "text-white/55"
                      }`}
                    >
                      {step.state === "current" ? "Sedang berlangsung" : step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER + SUMMARY - 2 COLUMN */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {/* CUSTOMER DETAIL */}
        <div
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-6 md:p-7"
          style={{ animationDelay: "400ms" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5 sm:mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30">
                <User className="h-4 w-4 text-white/70" />
              </div>
              <h3 className="text-base font-black uppercase sm:text-lg">
                Data Pembeli
              </h3>
            </div>

            <div className="space-y-3.5 text-sm sm:space-y-4">
              <InfoRow icon={User} label="Nama" value={order.customer_name} />
              <InfoRow
                icon={Phone}
                label="WhatsApp"
                value={order.customer_phone}
                mono
              />
              {order.customer_email && (
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={order.customer_email}
                  mono
                />
              )}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 sm:rounded-2xl sm:p-4">
                <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
                  <MapPin className="h-3.5 w-3.5 text-[#d7ff53]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 sm:text-xs">
                    Alamat
                  </p>
                </div>
                <p className="text-sm leading-6 text-white sm:leading-7">
                  {order.address}
                  {order.district ? `, ${order.district}` : ""}
                  {order.city ? `, ${order.city}` : ""}
                  {order.province ? `, ${order.province}` : ""}
                  {order.postal_code ? ` ${order.postal_code}` : ""}
                </p>
              </div>
              {order.notes && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 sm:rounded-2xl sm:p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
                    <FileText className="h-3.5 w-3.5 text-[#d7ff53]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 sm:text-xs">
                      Catatan
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-white/70 sm:leading-7">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY - CINEMATIC */}
        <div
          className="group relative overflow-hidden rounded-2xl border border-[#d7ff53]/20 bg-gradient-to-br from-[#d7ff53]/10 via-black/40 to-black/40 p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-6 md:p-7"
          style={{ animationDelay: "500ms" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#d7ff53]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#d7ff53]/5 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-2.5 sm:mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/15">
                <Receipt className="h-4 w-4 text-[#d7ff53]" />
              </div>
              <h3 className="text-base font-black uppercase sm:text-lg">
                Ringkasan Order
              </h3>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <SummaryRow
                label="Status Pembayaran"
                value={
                  <span className="capitalize">
                    {order.payment_status || "Menunggu"}
                  </span>
                }
              />
              <SummaryRow
                label="Status Order"
                value={
                  <span className="font-bold">
                    {getStatusLabel(orderStatus)}
                  </span>
                }
              />

              <div className="my-2 border-t border-[#d7ff53]/15" />

              <SummaryRow
                label="Subtotal"
                value={
                  <span className="font-mono text-sm text-white sm:text-base">
                    {rupiah(breakdown.subtotal)}
                  </span>
                }
                subtle
              />

              <SummaryRow
                label={
                  <span>
                    Ongkir
                    {order.shipping_service && (
                      <span className="ml-1.5 rounded-full border border-[#d7ff53]/30 bg-[#d7ff53]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#d7ff53]">
                        {order.shipping_service}
                      </span>
                    )}
                  </span>
                }
                value={
                  <span className="font-mono text-sm text-white sm:text-base">
                    {rupiah(breakdown.shipping)}
                  </span>
                }
                subtle
              />

              <div className="my-3 border-t border-[#d7ff53]/20 sm:my-4" />
              <div className="flex items-end justify-between gap-3 rounded-xl border border-[#d7ff53]/30 bg-gradient-to-br from-[#d7ff53]/15 to-[#d7ff53]/5 p-3.5 sm:rounded-2xl sm:p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff53] sm:text-xs">
                    Total Bayar
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40 sm:text-xs">
                    Sudah termasuk ongkir
                  </p>
                </div>
                <p
                  key={breakdown.total}
                  className="text-right text-xl font-black text-[#d7ff53] sm:text-2xl md:text-3xl"
                >
                  {rupiah(breakdown.total)}
                </p>
              </div>

              {order.tracking_number && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3.5 sm:mt-4 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 sm:text-xs">
                    Nomor Resi
                  </p>
                  <p className="mt-1.5 break-all font-mono text-sm font-black text-white sm:mt-2 sm:text-base">
                    {order.tracking_number}
                  </p>
                </div>
              )}
            </div>

            {whatsappAdmin && (
              <a
                href={`https://wa.me/${whatsappAdmin}?text=${whatsappText}`}
                target="_blank"
                className="group/btn relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#d7ff53] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02] hover:bg-white hover:shadow-[0_0_40px_-5px_rgba(215,255,83,0.6)] sm:mt-8 sm:py-4"
              >
                <span className="relative z-10">Hubungi Admin</span>
                <ChevronRight className="relative z-10 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl animate-fade-up sm:rounded-[2rem] sm:p-6 md:p-7"
        style={{ animationDelay: "600ms" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex items-center gap-2.5 sm:mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30">
              <Package className="h-4 w-4 text-white/70" />
            </div>
            <h3 className="text-base font-black uppercase sm:text-lg">
              Produk Dipesan
            </h3>
            <span className="ml-auto rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white/60 sm:px-3 sm:py-1 sm:text-xs">
              {order.order_items?.length || 0} item
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {(order.order_items || []).map((item: any, i: number) => (
              <div
                key={item.id}
                className="group/item flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/40 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-4 animate-slide-in"
                style={{ animationDelay: `${700 + i * 50}ms` }}
              >
                <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 sm:h-12 sm:w-12 sm:rounded-xl">
                    <Package className="h-4 w-4 text-[#d7ff53] sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black uppercase sm:text-base">
                      {item.product_name}
                    </h4>
                    <p className="mt-0.5 text-xs text-white/45 sm:mt-1">
                      Size {item.size || "-"} • Qty {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 pl-12 sm:flex-col sm:items-end sm:gap-0 sm:pl-0 sm:text-right">
                  <p className="text-[10px] text-white/40 sm:text-xs">
                    {rupiah(item.price)} / pcs
                  </p>
                  <p className="text-sm font-black text-white sm:text-base">
                    {rupiah(item.subtotal || Number(item.price) * Number(item.quantity))}
                  </p>
                </div>
              </div>
            ))}

            {(!order.order_items || order.order_items.length === 0) && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center text-sm text-white/50 sm:rounded-2xl">
                Detail produk belum tersedia.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRUST BADGE */}
      <div
        className="flex items-center justify-center gap-2 pt-2 text-xs text-white/35 animate-fade-in sm:text-sm"
        style={{ animationDelay: "800ms" }}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#d7ff53]/70" />
        <span>Data pesanan kamu aman dan terenkripsi</span>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Icon className="h-3.5 w-3.5 shrink-0 text-white/40" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 sm:text-xs">
          {label}
        </span>
      </div>
      <span
        className={`truncate text-right text-sm font-bold text-white sm:text-base ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  subtle,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 sm:py-1.5">
      <span
        className={`text-xs sm:text-sm ${
          subtle ? "text-white/45" : "text-white/60"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right ${
          subtle ? "text-white" : "font-bold text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
