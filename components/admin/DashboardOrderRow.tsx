"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

type Order = {
  id: string;
  order_number: string | null;
  created_at: string;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  customer_name: string | null;
  customer_email: string | null;
};

type Props = {
  order: Order;
  formatPaymentStatus: (s: string) => { label: string; classes: string };
  formatOrderStatus: (s: string) => { label: string; classes: string };
  formatRupiah: (n: number) => string;
  formatShortDate: (s: string) => string;
};

export default function DashboardOrderRow({
  order,
  formatPaymentStatus,
  formatOrderStatus,
  formatRupiah,
  formatShortDate,
}: Props) {
  const payment = formatPaymentStatus(order.payment_status);
  const fulfillment = formatOrderStatus(order.fulfillment_status);
  const customer = order.customer_name || order.customer_email || "—";

  return (
    <tr className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
      <td className="px-5 py-3 text-xs font-mono text-white/70">
        #{order.order_number || order.id.slice(0, 8)}
      </td>
      <td className="px-5 py-3">
        <div className="text-sm font-bold text-white">{customer}</div>
        {order.customer_name && order.customer_email && (
          <div className="text-[11px] text-white/40">{order.customer_email}</div>
        )}
      </td>
      <td className="px-5 py-3 text-sm font-bold text-white">
        {formatRupiah(order.total)}
      </td>
      <td className="px-5 py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${payment.classes}`}
        >
          {payment.label}
        </span>
      </td>
      <td className="px-5 py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${fulfillment.classes}`}
        >
          {fulfillment.label}
        </span>
      </td>
      <td className="px-5 py-3 text-[11px] text-white/50">
        {formatShortDate(order.created_at)}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70 transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
        >
          <Eye size={12} strokeWidth={2.4} />
          Detail
        </Link>
      </td>
    </tr>
  );
}
