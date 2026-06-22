export function formatRupiah(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.trunc(num));
}

export function formatDateLong(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

type StatusBadge = { label: string; classes: string };

const PAYMENT_STATUS_MAP: Record<string, StatusBadge> = {
  pending: { label: "Pending", classes: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  paid: { label: "Paid", classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  failed: { label: "Failed", classes: "border-red-500/30 bg-red-500/10 text-red-300" },
  expired: { label: "Expired", classes: "border-white/15 bg-white/5 text-white/60" },
  refunded: { label: "Refunded", classes: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  cancelled: { label: "Cancelled", classes: "border-red-500/30 bg-red-500/10 text-red-300" },
};

export function formatPaymentStatus(status: string | null | undefined): StatusBadge {
  const key = (status || "pending").toLowerCase();
  return (
    PAYMENT_STATUS_MAP[key] ?? {
      label: key,
      classes: "border-white/15 bg-white/5 text-white/60",
    }
  );
}

const ORDER_STATUS_MAP: Record<string, StatusBadge> = {
  menunggu_pembayaran: { label: "Menunggu Bayar", classes: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  perlu_diproses: { label: "Perlu Diproses", classes: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  sedang_dikemas: { label: "Sedang Dikemas", classes: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" },
  dikirim: { label: "Dikirim", classes: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
  selesai: { label: "Selesai", classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  dibatalkan: { label: "Dibatalkan", classes: "border-red-500/30 bg-red-500/10 text-red-300" },
};

export function formatOrderStatus(status: string | null | undefined): StatusBadge {
  const key = (status || "menunggu_pembayaran").toLowerCase();
  return (
    ORDER_STATUS_MAP[key] ?? {
      label: key,
      classes: "border-white/15 bg-white/5 text-white/60",
    }
  );
}

export const ORDER_FULFILLMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "perlu_diproses", label: "Perlu Diproses" },
  { value: "sedang_dikemas", label: "Sedang Dikemas" },
  { value: "dikirim", label: "Dikirim" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

export function initialsFromName(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "A";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
