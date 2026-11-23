"use client";

import Link from "next/link";
import { Eye, ChevronRight } from "lucide-react";
import { Pill, type PillTone } from "@/components/admin/ui";

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

const PAYMENT_MAP: Record<string, { label: string; tone: PillTone }> = {
  pending: { label: "Pending", tone: "amber" },
  paid: { label: "Lunas", tone: "green" },
  failed: { label: "Gagal", tone: "red" },
  expired: { label: "Kadaluarsa", tone: "neutral" },
  refunded: { label: "Refund", tone: "blue" },
  cancelled: { label: "Dibatalkan", tone: "red" },
};

const ORDER_MAP: Record<string, { label: string; tone: PillTone }> = {
  waiting_payment: { label: "Menunggu Bayar", tone: "amber" },
  processing: { label: "Diproses", tone: "blue" },
  shipped: { label: "Dikirim", tone: "blue" },
  completed: { label: "Selesai", tone: "green" },
  cancelled: { label: "Dibatalkan", tone: "red" },
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

const ROW_ACCENT: Record<string, string> = {
  waiting_payment: "#d97706",
  processing: "#2563eb",
  shipped: "#0891b2",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export default function DashboardOrderRow({ order }: { order: Order }) {
  const payment = PAYMENT_MAP[order.payment_status] ?? { label: order.payment_status, tone: "neutral" as PillTone };
  const status = ORDER_MAP[order.order_status] ?? { label: order.order_status, tone: "neutral" as PillTone };
  const customer = order.customer_name || order.customer_phone || "—";
  const accent = ROW_ACCENT[order.order_status] ?? "#d1d5db";

  return (
    <tr
      className="border-b border-[var(--ad-border-soft)] transition last:border-b-0 hover:bg-[#fafbfd]"
      style={{ boxShadow: `inset 2px 0 0 0 transparent`, transitionProperty: "background-color, box-shadow" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = `inset 2px 0 0 0 ${accent}`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = `inset 2px 0 0 0 transparent`)}
    >
      <td className="px-4 py-3 font-mono text-[12px] text-[var(--ad-text-2)] sm:px-5">
        {order.order_code || order.id.slice(0, 8)}
      </td>
      <td className="px-4 py-3 sm:px-5">
        <div className="text-[14px] font-bold text-[var(--ad-text)]">{customer}</div>
        {order.customer_name && order.customer_phone && (
          <div className="text-[11px] text-[var(--ad-text-3)]">{order.customer_phone}</div>
        )}
      </td>
      <td className="px-4 py-3 text-[13.5px] font-semibold text-[var(--ad-text)] sm:px-5">
        {rupiah(order.total_amount)}
      </td>
      <td className="px-4 py-3 sm:px-5">
        <Pill tone={payment.tone}>{payment.label}</Pill>
      </td>
      <td className="px-4 py-3 sm:px-5">
        <Pill tone={status.tone}>{status.label}</Pill>
      </td>
      <td className="px-4 py-3 text-[11.5px] text-[var(--ad-text-3)] sm:px-5">
        {shortDate(order.created_at)}
      </td>
      <td className="px-4 py-3 text-right sm:px-5">
        <Link
          href="/admin/orders"
          className="ad-btn ad-btn-secondary ad-btn-sm"
        >
          <Eye size={11} /> Kelola
          <ChevronRight size={11} className="opacity-70" />
        </Link>
      </td>
    </tr>
  );
}
