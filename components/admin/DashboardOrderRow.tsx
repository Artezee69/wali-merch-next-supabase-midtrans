"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

type Order = {
  id: string;
  order_code: string | null;
  created_at: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  customer_name: string | null;
  customer_phone: string | null;
};

const PAYMENT_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",  cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  paid:      { label: "Lunas",    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  failed:    { label: "Gagal",    cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  expired:   { label: "Kadaluarsa", cls: "border-white/15 bg-white/5 text-white/60" },
  refunded:  { label: "Refund",   cls: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  cancelled: { label: "Dibatalkan", cls: "border-red-500/30 bg-red-500/10 text-red-300" },
};

const ORDER_MAP: Record<string, { label: string; cls: string }> = {
  waiting_payment: { label: "Menunggu Bayar", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  processing:      { label: "Diproses",      cls: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  shipped:         { label: "Dikirim",       cls: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
  completed:       { label: "Selesai",       cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  cancelled:       { label: "Dibatalkan",    cls: "border-red-500/30 bg-red-500/10 text-red-300" },
};

function rupiah(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.trunc(num));
}

function shortDate(value: string | null | undefined): string {
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

export default function DashboardOrderRow({ order }: { order: Order }) {
  const payment = PAYMENT_MAP[order.payment_status] ?? { label: order.payment_status, cls: "border-white/15 bg-white/5 text-white/60" };
  const status  = ORDER_MAP[order.order_status]   ?? { label: order.order_status,   cls: "border-white/15 bg-white/5 text-white/60" };
  const customer = order.customer_name || order.customer_phone || "—";

  return (
    <tr className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
      <td className="px-5 py-3 font-mono text-xs text-white/70">
        {order.order_code || order.id.slice(0, 8)}
      </td>
      <td className="px-5 py-3">
        <div className="text-sm font-bold text-white">{customer}</div>
        {order.customer_name && order.customer_phone && (
          <div className="text-[11px] text-white/40">{order.customer_phone}</div>
        )}
      </td>
      <td className="px-5 py-3 text-sm font-bold text-white">
        {rupiah(order.total_amount)}
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${payment.cls}`}>
          {payment.label}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${status.cls}`}>
          {status.label}
        </span>
      </td>
      <td className="px-5 py-3 text-[11px] text-white/50">
        {shortDate(order.created_at)}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70 transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
        >
          <Eye size={12} strokeWidth={2.4} />
          Kelola
        </Link>
      </td>
    </tr>
  );
}
