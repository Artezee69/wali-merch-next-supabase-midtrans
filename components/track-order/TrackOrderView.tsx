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
  Loader2,
  ArrowRight,
  Calendar,
  MessageCircle,
  Check,
} from "lucide-react";

type Props = {
  q: string;
  order: any | null;
  errorMessage: string;
  orderStatus: string | undefined;
  whatsappAdmin: string;
  whatsappText: string;
};

// ─── STATUS HELPERS ────────────────────────────────────────────────────────────

const statusClass: Record<string, string> = {
  waiting_payment:
    "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.5)]",
  pending:
    "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.5)]",
  paid: "bg-white/10 text-white border-white/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]",
  processing:
    "bg-white/10 text-white border-white/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.15)]",
  shipped:
    "bg-white/10 text-white border-white/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.15)]",
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

function normalizeStatus(status?: string) {
  if (!status) return "waiting_payment";
  if (status === "pending") return "waiting_payment";
  return status;
}

function getTimelineSteps(status?: string) {
  const steps = [
    { key: "waiting_payment", label: "Pesanan Dibuat", desc: "Order tercatat" },
    { key: "paid", label: "Pembayaran", desc: "Pembayaran diterima" },
    { key: "processing", label: "Diproses", desc: "Sedang disiapkan" },
    { key: "shipped", label: "Dikirim", desc: "Dalam perjalanan" },
    { key: "completed", label: "Selesai", desc: "Paket diterima" },
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

function computeOrderBreakdown(order: any) {
  const subtotal = Number(order?.subtotal) || 0;
  const shipping = Number(order?.shipping_cost) || 0;
  const total = Number(order?.total_amount) || subtotal + shipping;
  return { subtotal, shipping, total };
}

// ─── SECTION LABEL ─────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 sm:mb-6">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg border"
        style={{
          borderColor: "color-mix(in srgb, var(--accent-color) 25%, transparent)",
          background: "color-mix(in srgb, var(--accent-color) 8%, transparent)",
        }}
      >
        <Icon
          className="h-4 w-4"
          style={{ color: "var(--accent-color)" }}
        />
      </div>
      <h3
        className="text-xs font-black uppercase tracking-[0.18em] sm:text-[13px]"
        style={{ color: "var(--text-primary)" }}
      >
        {children}
      </h3>
    </div>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────

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
      {/* SEARCH FORM */}
      <section
        className="mx-auto max-w-4xl px-4 pt-6 md:px-8 md:pt-10"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl animate-fade-up sm:rounded-[1.75rem] sm:p-8 md:p-9"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-secondary) 80%, transparent)",
          }}
        >
          {/* hover glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-color) 7%, transparent), transparent)",
            }}
          />
          {/* corner glow */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--accent-color) 7%, transparent)" }}
          />

          {/* Label */}
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent-color) 30%, transparent)",
                  background: "color-mix(in srgb, var(--accent-color) 10%, transparent)",
                }}
              >
                <Search className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
              </div>
              <label
                className="text-[11px] font-black uppercase tracking-[0.25em]"
                style={{ color: "var(--accent-color)" }}
              >
                Cek Pesanan
              </label>
            </div>

            <h2
              className="mt-4 text-2xl font-black uppercase leading-tight sm:text-3xl md:text-4xl"
              style={{ color: "var(--text-primary)" }}
            >
              Lacak Status{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 60%, white))",
                }}
              >
                Order Kamu
              </span>
            </h2>

            {/* Form */}
            <form method="get" className="mt-6 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Receipt
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 sm:left-5"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Contoh: WALI-20260526-001 atau 628xxxx"
                  className="w-full rounded-xl border bg-black/50 py-3.5 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-md transition-all placeholder:text-white/25 sm:py-4 sm:text-base"
                  style={{
                    paddingLeft: "2.75rem",
                    borderColor: "var(--border-color)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-color)";
                    e.currentTarget.style.boxShadow =
                      "0 0 24px -4px color-mix(in srgb, var(--accent-color) 30%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                type="submit"
                className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02] sm:px-8 sm:py-4"
                style={{ background: "var(--accent-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.boxShadow =
                    "0 0 32px -4px color-mix(in srgb, var(--accent-color) 50%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span className="relative z-10">Lacak Pesanan</span>
                <ChevronRight
                  className="relative z-10 h-4 w-4 transition-transform group-hover/btn:translate-x-1"
                />
              </button>
            </form>

            <p
              className="mt-4 text-xs leading-6 sm:mt-5 sm:text-sm sm:leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              Kode order muncul setelah checkout. Lupa kode? Masukkan nomor
              WhatsApp yang dipakai saat order.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
        {!q ? (
          <IdleState />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} whatsappAdmin={whatsappAdmin} whatsappText={whatsappText} />
        ) : !order ? (
          <NotFoundState whatsappAdmin={whatsappAdmin} whatsappText={whatsappText} />
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

// ─── IDLE STATE ─────────────────────────────────────────────────────────────────

function IdleState() {
  const cards = [
    {
      title: "Menunggu Pembayaran",
      desc: "Pesanan dibuat, pembayaran belum masuk.",
      icon: Clock,
      delay: "0ms",
    },
    {
      title: "Sedang Diproses",
      desc: "Pembayaran masuk, pesanan disiapkan.",
      icon: Activity,
      delay: "100ms",
    },
    {
      title: "Dikirim",
      desc: "Paket dikirim, resi ditampilkan.",
      icon: Truck,
      delay: "200ms",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all animate-fade-up sm:p-6"
            style={{
              borderColor: "var(--border-color)",
              background: "color-mix(in srgb, var(--bg-secondary) 60%, transparent)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 6%, transparent), transparent)",
              }}
            />
            <div className="relative">
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border sm:mb-4 sm:h-11 sm:w-11"
                style={{
                  borderColor: "var(--border-color)",
                  background: "color-mix(in srgb, var(--bg-primary) 50%, transparent)",
                }}
              >
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "var(--accent-color)" }} />
              </div>
              <h3
                className="text-sm font-black uppercase tracking-wide sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                {card.title}
              </h3>
              <p
                className="mt-1.5 text-xs leading-6 sm:text-sm sm:leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Hint card */}
      <div
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-6"
        style={{
          borderColor: "color-mix(in srgb, var(--accent-color) 20%, transparent)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 5%, transparent), var(--bg-secondary))",
          animationDelay: "300ms",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--accent-color) 8%, transparent)" }}
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border sm:h-11 sm:w-11"
            style={{
              borderColor: "color-mix(in srgb, var(--accent-color) 30%, transparent)",
              background: "color-mix(in srgb, var(--accent-color) 10%, transparent)",
            }}
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "var(--accent-color)" }} />
          </div>
          <div>
            <p className="text-sm font-black uppercase sm:text-base" style={{ color: "var(--text-primary)" }}>
              Belum Punya Kode Order?
            </p>
            <p
              className="mt-1 text-xs leading-6 sm:text-sm sm:leading-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Selesaikan checkout dulu di halaman Cart, lalu kode order
              otomatis tersedia di sini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ERROR STATE ────────────────────────────────────────────────────────────────

function ErrorState({
  message,
  whatsappAdmin,
  whatsappText,
}: {
  message: string;
  whatsappAdmin: string;
  whatsappText: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-8 text-center backdrop-blur-xl animate-scale-in sm:p-10"
      style={{
        borderColor: "rgba(239,68,68,0.25)",
        background: "rgba(239,68,68,0.06)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "rgba(239,68,68,0.08)" }}
      />
      <div className="relative">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border"
          style={{
            borderColor: "rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.1)",
          }}
        >
          <AlertCircle className="h-6 w-6 text-red-300" />
        </div>
        <h2
          className="text-xl font-black uppercase sm:text-2xl"
          style={{ color: "#fca5a5" }}
        >
          Terjadi Error
        </h2>
        <p className="mt-2.5 text-sm sm:mt-3 sm:text-base" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
          <Link
            href="/track-order"
            className="rounded-xl border px-6 py-3 text-sm font-black uppercase tracking-wider backdrop-blur-md transition sm:px-7 sm:py-3.5"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--text-primary)";
              e.currentTarget.style.color = "var(--bg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            Coba Lagi
          </Link>
          {whatsappAdmin && (
            <a
              href={`https://wa.me/${whatsappAdmin}?text=${whatsappText}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition sm:px-7 sm:py-3.5"
              style={{ background: "var(--accent-color)" }}
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Admin
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NOT FOUND STATE ────────────────────────────────────────────────────────────

function NotFoundState({
  whatsappAdmin,
  whatsappText,
}: {
  whatsappAdmin: string;
  whatsappText: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-8 text-center backdrop-blur-xl animate-fade-up sm:p-12"
      style={{
        borderColor: "var(--border-color)",
        background: "color-mix(in srgb, var(--bg-secondary) 70%, transparent)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
      <div className="relative">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border sm:mb-6 sm:h-20 sm:w-20"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-primary) 50%, transparent)",
          }}
        >
          <Search className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: "var(--text-secondary)" }} />
        </div>
        <h2
          className="text-2xl font-black uppercase sm:text-3xl md:text-4xl"
          style={{ color: "var(--text-primary)" }}
        >
          Pesanan Tidak Ditemukan
        </h2>
        <p
          className="mx-auto mt-3 max-w-lg text-sm leading-7 sm:mt-4 sm:text-base sm:leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          Pastikan kode order atau nomor WhatsApp sudah benar. Kalau masih
          belum ketemu, hubungi admin untuk pengecekan manual.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
          <Link
            href="/track-order"
            className="rounded-xl border px-7 py-3.5 text-sm font-black uppercase tracking-wider backdrop-blur-md transition sm:px-8 sm:py-4"
            style={{
              borderColor: "var(--border-color)",
              background: "color-mix(in srgb, var(--bg-card) 100%, transparent)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--text-primary)";
              e.currentTarget.style.color = "var(--bg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "color-mix(in srgb, var(--bg-card) 100%, transparent)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            Coba Lagi
          </Link>
          {whatsappAdmin && (
            <a
              href={`https://wa.me/${whatsappAdmin}?text=${whatsappText}`}
              target="_blank"
              className="inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wider text-black transition hover:scale-[1.02] sm:px-8 sm:py-4"
              style={{ background: "var(--accent-color)" }}
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Admin
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── JNE TRACKING PANEL ────────────────────────────────────────────────────────

type JneEvent = {
  timestamp: string;
  location: string;
  status: string;
  description: string;
};

function JneTrackingPanel({ order }: { order: any }) {
  const trackingNum: string | null = order?.tracking_number?.trim() || null;
  const [events, setEvents] = useState<JneEvent[]>([]);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  const [estDelivery, setEstDelivery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (!trackingNum) {
      setLoading(false);
      setConfigured(false);
      return;
    }
    setLoading(true);
    fetch(`/api/jne/track?tracking_number=${encodeURIComponent(trackingNum)}`)
      .then((res) => res.json())
      .then((data) => {
        setConfigured(data.jne_configured !== false);
        setEvents(data.events ?? []);
        setFinalStatus(data.finalStatus ?? null);
        setEstDelivery(data.estimatedDelivery ?? null);
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, [trackingNum]);

  if (!trackingNum) return null;

  const cardStyle: React.CSSProperties = {
    borderColor: "var(--border-color)",
    background: "color-mix(in srgb, var(--bg-secondary) 75%, transparent)",
    animationDelay: "350ms",
  };

  // JNE not configured
  if (!configured && !loading) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
        style={cardStyle}
      >
        <div className="mb-5">
          <SectionLabel icon={Truck}>Tracking JNE</SectionLabel>
        </div>
        <div className="space-y-4">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--text-secondary)" }}
            >
              Nomor Resi
            </p>
            <p
              className="mt-1.5 break-all font-mono text-sm font-black sm:text-base"
              style={{ color: "var(--accent-color)" }}
            >
              {trackingNum}
            </p>
          </div>
          <div
            className="flex flex-col items-start justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
            style={{
              borderColor: "var(--border-color)",
              background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
            }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Cek status di JNE langsung
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Klik untuk buka di situs JNE
              </p>
            </div>
            <a
              href={`https://www.jne.co.id/id/cekresi/${trackingNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:scale-[1.02]"
              style={{ background: "var(--accent-color)" }}
            >
              Cek Resi <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
        style={cardStyle}
      >
        <div className="mb-5">
          <SectionLabel icon={Truck}>Tracking JNE</SectionLabel>
        </div>
        <div
          className="flex items-center gap-3.5 rounded-xl border p-4"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
          }}
        >
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-color)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Memuat data tracking...
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              Resi: <span className="font-mono" style={{ color: "var(--accent-color)" }}>{trackingNum}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No events yet
  if (events.length === 0) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
        style={cardStyle}
      >
        <div className="mb-5">
          <SectionLabel icon={Truck}>Tracking JNE</SectionLabel>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
          }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Resi: <span className="font-mono" style={{ color: "var(--accent-color)" }}>{trackingNum}</span>
          </p>
          <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>
            Belum ada scan event dari JNE. Resi biasanya aktif setelah paket
            diterima pihak kurir.
          </p>
        </div>
      </div>
    );
  }

  const jneStatusLabels: Record<string, string> = {
    PICKUP: "Diterima Kurir",
    IN_TRANSIT: "Dalam Perjalanan",
    AT_DESTINATION: "Di Kota Tujuan",
    DELIVERED: "Sudah Diterima",
    FAILED_DELIVERY: "Gagal Pengiriman",
    RETURNED: "Dikembalikan",
  };

  const jneStatusColors: Record<string, string> = {
    DELIVERED: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    FAILED_DELIVERY: "border-red-500/50 bg-red-500/15 text-red-300",
    RETURNED: "border-orange-500/50 bg-orange-500/15 text-orange-300",
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
      style={cardStyle}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <SectionLabel icon={Truck}>Tracking JNE</SectionLabel>
        {finalStatus && (
          <span
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
              jneStatusColors[finalStatus] || "border-white/15 bg-white/5 text-white/60"
            }`}
          >
            {jneStatusLabels[finalStatus] || finalStatus}
          </span>
        )}
      </div>

      {/* Resi number */}
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--text-secondary)" }}>
        Nomor Resi
      </p>
      <p
        className="mb-5 break-all font-mono text-sm font-black"
        style={{ color: "var(--accent-color)" }}
      >
        {trackingNum}
      </p>

      {/* Estimated delivery */}
      {estDelivery && (
        <div
          className="mb-5 flex items-center gap-3 rounded-xl border p-3.5"
          style={{
            borderColor: "color-mix(in srgb, var(--accent-color) 20%, transparent)",
            background: "color-mix(in srgb, var(--accent-color) 5%, transparent)",
          }}
        >
          <Calendar className="h-4 w-4 shrink-0" style={{ color: "var(--accent-color)" }} />
          <div>
            <p
              className="text-[11px] font-black uppercase tracking-[0.15em]"
              style={{ color: "var(--text-secondary)" }}
            >
              Estimasi Tiba
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {estDelivery}
            </p>
          </div>
        </div>
      )}

      {/* Scan timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div
          className="absolute left-[13px] top-0 h-full w-[2px] sm:left-[15px]"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--accent-color) 40%, transparent), rgba(255,255,255,0.08), transparent)",
          }}
        />

        <div className="space-y-0">
          {events.map((evt, i) => {
            const isLast = i === events.length - 1;
            const isDelivered = evt.status === "DELIVERED";
            const isFailed = evt.status === "FAILED_DELIVERY" || evt.status === "RETURNED";

            let timeStr = "-";
            try {
              const d = new Date(evt.timestamp);
              if (!isNaN(d.getTime())) {
                timeStr = d.toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }
            } catch { /* noop */ }

            return (
              <div key={i} className="relative flex items-start gap-3.5 py-3 pl-8 sm:gap-4 sm:pl-10">
                {/* Dot */}
                <div
                  className={`absolute left-[8px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border sm:left-[10px] sm:h-[26px] sm:w-[26px] ${
                    isLast
                      ? isDelivered
                        ? "border-emerald-400 bg-emerald-400/25"
                        : isFailed
                          ? "border-red-400 bg-red-400/25"
                          : "border-[var(--accent-color)] shadow-[0_0_14px_-2px_color-mix(in_srgb,var(--accent-color)_40%,transparent)]"
                      : "border-white/20 bg-[color-mix(in_srgb,var(--bg-primary)_60%,transparent)]"
                  }`}
                  style={
                    isLast && !isDelivered && !isFailed
                      ? {
                          borderColor: "var(--accent-color)",
                          background: "color-mix(in srgb, var(--accent-color) 20%, transparent)",
                          boxShadow: "0 0 14px -2px color-mix(in srgb, var(--accent-color) 40%, transparent)",
                        }
                      : undefined
                  }
                >
                  {isLast && !isDelivered && !isFailed && (
                    <div
                      className="h-[5px] w-[5px] animate-pulse rounded-full sm:h-[6px] sm:w-[6px]"
                      style={{ background: "var(--accent-color)" }}
                    />
                  )}
                  {isDelivered && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 sm:h-3.5 sm:w-3.5" />
                  )}
                  {isFailed && (
                    <XCircle className="h-3 w-3 text-red-400 sm:h-3.5 sm:w-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-black sm:text-sm ${
                        isLast ? "" : "text-white/60"
                      }`}
                      style={isLast ? { color: "var(--text-primary)" } : undefined}
                    >
                      {jneStatusLabels[evt.status] || evt.description}
                    </span>
                    {evt.location && evt.location !== "-" && (
                      <span
                        className="text-[11px] sm:text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        — {evt.location}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {timeStr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External link */}
      <a
        href={`https://www.jne.co.id/id/cekresi/${trackingNum}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent-color) 50%, transparent)";
          e.currentTarget.style.color = "var(--accent-color)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        Buka di JNE.co.id <ArrowRight size={12} />
      </a>
    </div>
  );
}

// ─── ORDER DETAIL ───────────────────────────────────────────────────────────────

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
  const maxPolls = 12;

  useEffect(() => {
    const statusKey = normalizeStatus(orderStatus);
    const isFinal =
      statusKey === "paid" ||
      statusKey === "cancelled" ||
      statusKey === "failed" ||
      statusKey === "processing" ||
      statusKey === "shipped" ||
      statusKey === "completed";

    if (isFinal || pollCount >= maxPolls) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/track-order/${order.order_code}`);
        if (response.ok) {
          const data = await response.json();
          if (data.order) {
            setOrder(data.order);
            const newStatus =
              data.order.status ||
              data.order.order_status ||
              data.order.payment_status ||
              data.order.state;
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
  const steps = getTimelineSteps(orderStatus);
  const showTimeline = orderStatus !== "cancelled" && orderStatus !== "failed";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ORDER HEADER */}
      <div
        className="group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7 md:p-8"
        style={{
          borderColor: "var(--border-color)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--bg-secondary) 85%, transparent), color-mix(in srgb, var(--bg-primary) 70%, transparent))",
        }}
      >
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--accent-color) 8%, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-start md:gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: "var(--accent-color)" }} />
              <p
                className="text-[11px] font-black uppercase tracking-[0.25em] sm:text-xs sm:tracking-[0.3em]"
                style={{ color: "var(--accent-color)" }}
              >
                Pesanan Ditemukan
              </p>
            </div>
            <h2
              className="mt-3 break-all text-2xl font-black uppercase leading-tight sm:text-3xl md:text-4xl lg:text-[2.75rem]"
              style={{ color: "var(--text-primary)" }}
            >
              {order.order_code}
            </h2>
            <p className="mt-2.5 text-sm sm:mt-3 sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Atas nama{" "}
              <span className="font-black" style={{ color: "var(--text-primary)" }}>
                {order.customer_name}
              </span>
            </p>
            <p className="mt-1 text-xs sm:mt-1.5" style={{ color: "var(--text-secondary)" }}>
              {formatDate(order.created_at)}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-wider backdrop-blur-md sm:px-5 sm:py-3 sm:text-sm ${getStatusClass(
              orderStatus,
            )}`}
          >
            <StatusIcon className="h-4 w-4 sm:h-4 sm:w-4" />
            {getStatusLabel(orderStatus)}
          </div>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      {showTimeline && (
        <div
          className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-secondary) 75%, transparent)",
            animationDelay: "100ms",
          }}
        >
          <div className="mb-6">
            <SectionLabel icon={Activity}>Progress Pesanan</SectionLabel>
          </div>

          {/* Horizontal step tracker (desktop) */}
          <div className="hidden sm:block">
            <div className="flex items-start">
              {steps.map((step, i) => {
                const isDone = step.state === "done";
                const isCurrent = step.state === "current";
                const isSkipped = step.state === "skipped";

                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center">
                    {/* Node row */}
                    <div className="flex w-full items-center">
                      {/* Left connector */}
                      {i > 0 && (
                        <div
                          className="h-[2px] flex-1 rounded"
                          style={{
                            background:
                              isDone || isCurrent
                                ? "color-mix(in srgb, var(--accent-color) 50%, transparent)"
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      )}
                      {/* Node */}
                      <div
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 sm:h-11 sm:w-11 ${
                          isSkipped ? "border-white/15 bg-white/5" : ""
                        }`}
                        style={
                          isDone
                            ? {
                                borderColor: "var(--accent-color)",
                                background: "var(--accent-color)",
                                boxShadow:
                                  "0 0 18px -2px color-mix(in srgb, var(--accent-color) 50%, transparent)",
                              }
                            : isCurrent
                              ? {
                                  borderColor: "var(--accent-color)",
                                  background:
                                    "color-mix(in srgb, var(--accent-color) 18%, transparent)",
                                  boxShadow:
                                    "0 0 22px -2px color-mix(in srgb, var(--accent-color) 55%, transparent)",
                                }
                              : {
                                  borderColor: "rgba(255,255,255,0.15)",
                                  background: "rgba(255,255,255,0.04)",
                                }
                        }
                      >
                        {isDone && (
                          <Check className="h-4 w-4 text-black sm:h-5 sm:w-5" strokeWidth={3} />
                        )}
                        {isCurrent && (
                          <div
                            className="h-2.5 w-2.5 animate-pulse rounded-full"
                            style={{ background: "var(--accent-color)" }}
                          />
                        )}
                        {!isDone && !isCurrent && !isSkipped && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        )}
                        {isSkipped && <div className="h-1.5 w-1.5 rounded-full bg-white/15" />}
                        {/* Ping ring on current */}
                        {isCurrent && (
                          <span
                            className="absolute inset-0 animate-ping rounded-full border"
                            style={{
                              borderColor: "color-mix(in srgb, var(--accent-color) 40%, transparent)",
                            }}
                          />
                        )}
                      </div>
                      {/* Right connector */}
                      {i < steps.length - 1 && (
                        <div
                          className="h-[2px] flex-1 rounded"
                          style={{
                            background:
                              isDone
                                ? "color-mix(in srgb, var(--accent-color) 50%, transparent)"
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <p
                      className="mt-3 text-[11px] font-black uppercase tracking-wide sm:text-xs"
                      style={{
                        color: isDone || isCurrent ? "var(--text-primary)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {isCurrent ? "Sedang berlangsung" : step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertical step list (mobile) */}
          <div className="sm:hidden">
            <div className="relative">
              <div
                className="absolute left-[18px] top-0 h-full w-[2px]"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--accent-color) 40%, transparent), rgba(255,255,255,0.08), transparent)",
                }}
              />
              <div className="space-y-4">
                {steps.map((step, i) => {
                  const isDone = step.state === "done";
                  const isCurrent = step.state === "current";
                  const isSkipped = step.state === "skipped";

                  return (
                    <div key={step.key} className="relative flex items-start gap-3 pl-0 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <div
                        className="relative z-10 flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border-2"
                        style={
                          isDone
                            ? {
                                borderColor: "var(--accent-color)",
                                background: "var(--accent-color)",
                                boxShadow:
                                  "0 0 14px -2px color-mix(in srgb, var(--accent-color) 50%, transparent)",
                              }
                            : isCurrent
                              ? {
                                  borderColor: "var(--accent-color)",
                                  background:
                                    "color-mix(in srgb, var(--accent-color) 18%, transparent)",
                                  boxShadow:
                                    "0 0 18px -2px color-mix(in srgb, var(--accent-color) 55%, transparent)",
                                }
                              : {
                                  borderColor: "rgba(255,255,255,0.15)",
                                  background: "rgba(255,255,255,0.04)",
                                }
                        }
                      >
                        {isDone && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
                        {isCurrent && (
                          <div
                            className="h-2 w-2 animate-pulse rounded-full"
                            style={{ background: "var(--accent-color)" }}
                          />
                        )}
                        {!isDone && !isCurrent && !isSkipped && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white/25" />
                        )}
                        {isSkipped && <div className="h-1.5 w-1.5 rounded-full bg-white/10" />}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <p
                          className="text-sm font-black uppercase"
                          style={{
                            color: isDone || isCurrent ? "var(--text-primary)" : "rgba(255,255,255,0.35)",
                          }}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {isCurrent ? "Sedang berlangsung" : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER + SUMMARY */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {/* Customer card */}
        <div
          className="group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-6 md:p-7"
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-secondary) 75%, transparent)",
            animationDelay: "400ms",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div className="relative">
            <SectionLabel icon={User}>Data Pembeli</SectionLabel>

            <div className="space-y-3 text-sm sm:space-y-3.5">
              <InfoRow icon={User} label="Nama" value={order.customer_name} />
              <InfoRow icon={Phone} label="WhatsApp" value={order.customer_phone} mono />
              {order.customer_email && (
                <InfoRow icon={Mail} label="Email" value={order.customer_email} mono />
              )}

              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Alamat Pengiriman
                  </p>
                </div>
                <p className="text-sm leading-6" style={{ color: "var(--text-primary)" }}>
                  {order.address}
                  {order.district ? `, ${order.district}` : ""}
                  {order.city ? `, ${order.city}` : ""}
                  {order.province ? `, ${order.province}` : ""}
                  {order.postal_code ? ` · ${order.postal_code}` : ""}
                </p>
              </div>

              {order.notes && (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Catatan
                    </p>
                  </div>
                  <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order summary — glass card */}
        <div
          className="group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-6 md:p-7"
          style={{
            borderColor: "color-mix(in srgb, var(--accent-color) 22%, transparent)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 7%, transparent), color-mix(in srgb, var(--bg-primary) 50%, transparent))",
            animationDelay: "500ms",
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--accent-color) 10%, transparent)" }}
          />

          <div className="relative">
            <SectionLabel icon={Receipt}>Ringkasan Order</SectionLabel>

            <div className="space-y-3">
              <SummaryRow
                label="Status Pembayaran"
                value={
                  <span className="capitalize" style={{ color: "var(--text-primary)" }}>
                    {order.payment_status || "Menunggu"}
                  </span>
                }
              />
              <SummaryRow
                label="Status Order"
                value={
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                    {getStatusLabel(orderStatus)}
                  </span>
                }
              />

              <div
                className="my-1.5 h-px"
                style={{ background: "color-mix(in srgb, var(--accent-color) 15%, transparent)" }}
              />

              <SummaryRow
                label="Subtotal"
                value={
                  <span className="font-mono text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
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
                      <span
                        className="ml-2 rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                        style={{
                          borderColor: "color-mix(in srgb, var(--accent-color) 30%, transparent)",
                          background: "color-mix(in srgb, var(--accent-color) 10%, transparent)",
                          color: "var(--accent-color)",
                        }}
                      >
                        {order.shipping_service}
                      </span>
                    )}
                  </span>
                }
                value={
                  <span className="font-mono text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                    {rupiah(breakdown.shipping)}
                  </span>
                }
                subtle
              />

              <div
                className="my-2 h-px sm:my-3"
                style={{ background: "color-mix(in srgb, var(--accent-color) 20%, transparent)" }}
              />

              {/* Total */}
              <div
                className="flex items-end justify-between gap-3 rounded-xl border p-4 sm:p-5"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent-color) 30%, transparent)",
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 15%, transparent), color-mix(in srgb, var(--accent-color) 5%, transparent))",
                }}
              >
                <div>
                  <p
                    className="text-[11px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "var(--accent-color)" }}
                  >
                    Total Bayar
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Sudah termasuk ongkir
                  </p>
                </div>
                <p
                  key={breakdown.total}
                  className="text-right text-xl font-black sm:text-2xl md:text-3xl"
                  style={{ color: "var(--accent-color)" }}
                >
                  {rupiah(breakdown.total)}
                </p>
              </div>

              {order.tracking_number && (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Nomor Resi
                  </p>
                  <p
                    className="mt-1.5 break-all font-mono text-sm font-black sm:text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {order.tracking_number}
                  </p>
                </div>
              )}
            </div>

            {/* WhatsApp CTA */}
            {whatsappAdmin && (
              <a
                href={`https://wa.me/${whatsappAdmin}?text=${whatsappText}`}
                target="_blank"
                className="group/btn relative mt-6 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-4 text-sm font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02] sm:mt-7 sm:py-4.5"
                style={{ background: "var(--accent-color)" }}
              >
                <MessageCircle className="relative z-10 h-4.5 w-4.5 sm:h-5 sm:w-5" />
                <span className="relative z-10">Hubungi Admin via WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* JNE TRACKING */}
      {order.tracking_number && <JneTrackingPanel order={order} />}

      {/* ITEMS */}
      <div
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl animate-fade-up sm:p-7"
        style={{
          borderColor: "var(--border-color)",
          background: "color-mix(in srgb, var(--bg-secondary) 75%, transparent)",
          animationDelay: "600ms",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        <div className="relative">
          <div className="mb-5 flex items-center justify-between sm:mb-6">
            <SectionLabel icon={Package}>Produk Dipesan</SectionLabel>
            <span
              className="rounded-lg border px-3 py-1 text-[11px] font-black uppercase tracking-wider"
              style={{
                borderColor: "var(--border-color)",
                background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
                color: "var(--text-secondary)",
              }}
            >
              {order.order_items?.length || 0} item
            </span>
          </div>

          <div className="space-y-3">
            {(order.order_items || []).map((item: any, i: number) => (
              <div
                key={item.id}
                className="group/item flex flex-col justify-between gap-3 rounded-xl border p-4 backdrop-blur-sm transition-all hover:border-white/20 sm:flex-row sm:items-center sm:gap-4 animate-slide-in"
                style={{
                  borderColor: "var(--border-color)",
                  background: "color-mix(in srgb, var(--bg-primary) 55%, transparent)",
                  animationDelay: `${650 + i * 60}ms`,
                }}
              >
                <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border sm:h-12 sm:w-12 sm:rounded-xl"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "color-mix(in srgb, var(--bg-primary) 70%, transparent)",
                    }}
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "var(--accent-color)" }} />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className="truncate text-sm font-black uppercase sm:text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.product_name}
                    </h4>
                    <p className="mt-0.5 text-xs sm:mt-1" style={{ color: "var(--text-secondary)" }}>
                      Ukuran {item.size || "-"} · {item.quantity} pcs
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 pl-[46px] sm:flex-col sm:items-end sm:gap-0 sm:pl-0 sm:text-right">
                  <p className="text-[11px] sm:text-xs" style={{ color: "var(--text-secondary)" }}>
                    {rupiah(item.price)} / pcs
                  </p>
                  <p
                    className="text-sm font-black sm:text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {rupiah(item.subtotal || Number(item.price) * Number(item.quantity))}
                  </p>
                </div>
              </div>
            ))}

            {(!order.order_items || order.order_items.length === 0) && (
              <div
                className="rounded-xl border p-5 text-center text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
                  color: "var(--text-secondary)",
                }}
              >
                Detail produk belum tersedia.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRUST BADGE */}
      <div
        className="flex items-center justify-center gap-2.5 pt-3 text-xs animate-fade-in sm:text-sm"
        style={{ color: "var(--text-secondary)", animationDelay: "800ms" }}
      >
        <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent-color)", opacity: 0.7 }} />
        <span>Data pesanan kamu aman dan terenkripsi</span>
      </div>
    </div>
  );
}

// ─── SHARED ROWS ────────────────────────────────────────────────────────────────

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
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
      style={{
        borderColor: "var(--border-color)",
        background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-secondary)" }} />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </span>
      </div>
      <span
        className={`truncate text-right text-sm font-bold ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-primary)" }}
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
    <div className="flex items-center justify-between gap-3 py-1.5 sm:py-2">
      <span
        className="text-xs sm:text-sm"
        style={{ color: subtle ? "var(--text-secondary)" : "var(--text-primary)", opacity: subtle ? 0.65 : 0.85 }}
      >
        {label}
      </span>
      <span
        className={`text-right ${subtle ? "" : "font-bold"}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
