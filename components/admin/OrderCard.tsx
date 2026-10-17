"use client";

import Link from "next/link";
import { rupiah } from "@/lib/format";
import { ChevronRight, Printer } from "lucide-react";

export type OrderItemRow = {
  id: string;
  product_name: string;
  size: string | null;
  price: number;
  quantity: number;
  subtotal: number;
};

export type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  subtotal?: number;
  shipping_cost?: number;
  shipping_service?: string | null;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_method?: string | null;
  transfer_proof_url?: string | null;
  transfer_proof_filename?: string | null;
  shipping_status?: string | null;
  tracking_number?: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

const orderStatusLabel: Record<string, string> = {
  waiting_payment: "Menunggu Bayar",
  processing: "Perlu Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const orderStatusStyle: Record<string, string> = {
  waiting_payment: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  processing: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  shipped: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  completed: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kadaluarsa",
  refunded: "Refund",
};

const paymentStatusStyle: Record<string, string> = {
  pending: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  paid: "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  expired: "bg-red-500/15 text-red-300 border-red-500/30",
  refunded: "bg-purple-400/15 text-purple-300 border-purple-400/30",
};

const paymentMethodLabel: Record<string, string> = {
  transfer: "Transfer Bank",
  midtrans: "Gateway (Midtrans)",
};

const ORDER_STATUS_OPTIONS = [
  "waiting_payment",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "expired", "refunded"];

function printReceipt(order: OrderRow) {
  const items = order.order_items ?? [];

  // Build item rows: product name, size, quantity — NO prices
  const itemsHtml = items.length
    ? items
        .map(
          (i) => `<tr>
            <td class="item-cell">${i.product_name}${i.size ? " <span class='size-tag'>(" + i.size + ")</span>" : ""}</td>
            <td class="item-cell qty">${i.quantity}</td>
          </tr>`
        )
        .join("\n")
    : '<tr><td class="item-cell center">-</td><td class="item-cell qty">-</td></tr>';

  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);

  // Destination address lines (JNE format)
  const destAddr1 = [order.address, order.district, order.city].filter(Boolean).join(", ");
  const destAddr2 = [order.province, order.postal_code].filter(Boolean).join("  ");

  const dateStr = new Date(order.created_at).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Resi ${order.order_code}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 100mm 150mm; margin: 0; }
  html, body { width: 100mm; min-height: 150mm; font-family: "Arial", sans-serif; font-size: 10px; color: #000; background: #fff; }

  .label { width: 100%; min-height: 150mm; padding: 5mm 4mm; display: flex; flex-direction: column; }

  /* Top header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .store { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .date-badge { font-size: 8px; color: #555; }

  /* Sender / Receiver blocks */
  .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 4px 0; }
  .party { padding: 5px 6px; border: 1px solid #000; }
  .party + .party { border-left: none; }
  .party-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 2px; }
  .party-name { font-size: 10px; font-weight: 700; word-break: break-word; }
  .party-phone { font-size: 9px; color: #333; margin-top: 1px; }
  .party-addr { font-size: 9px; color: #333; margin-top: 2px; line-height: 1.4; word-break: break-word; }
  .party-receiver .party-name { font-size: 10.5px; }

  /* Items section */
  .items-section { margin: 5px 0; padding: 5px 6px; border: 1px solid #000; }
  .items-header { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 4px; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { text-align: left; font-size: 8px; font-weight: 700; border-bottom: 1px solid #ccc; padding: 2px 0; }
  table.items th.qty-th { text-align: center; }
  table.items td { padding: 2.5px 0; font-size: 9.5px; }
  table.items td.qty { text-align: center; font-weight: 700; font-size: 10px; }
  .size-tag { font-size: 8px; color: #666; }
  .total-qty-row { display: flex; justify-content: flex-end; margin-top: 4px; font-size: 9px; font-weight: 700; }

  /* Status + tracking */
  .status-strip { display: flex; gap: 0; margin: 4px 0; }
  .status-strip > div { flex: 1; padding: 4px 6px; border: 1px solid #000; }
  .status-strip > div + div { border-left: none; }
  .status-label { font-size: 7.5px; font-weight: 700; text-transform: uppercase; color: #888; }
  .status-value { font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .tracking-strip { display: flex; gap: 0; margin: 0; }
  .tracking-strip > div { flex: 1; padding: 4px 6px; border: 1px solid #000; }
  .tracking-strip > div + div { border-left: none; }

  /* Courier service row */
  .service-row { display: flex; gap: 0; margin: 4px 0; }
  .service-row > div { flex: 1; padding: 3px 6px; border: 1px solid #000; }
  .service-row > div + div { border-left: none; }

  /* Footer */
  .footer { margin-top: auto; padding-top: 4px; text-align: center; font-size: 7.5px; color: #999; }

  /* Toolbar (hidden when printing) */
  .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #fff; padding: 6px; text-align: center; border-bottom: 1px solid #ccc; z-index: 100; }
  .toolbar button { font-family: Arial, sans-serif; font-size: 12px; padding: 5px 16px; cursor: pointer; border: 1px solid #000; background: #fff; border-radius: 4px; }
  .toolbar button:hover { background: #f5f5f5; }
  .toolbar button.primary { background: #000; color: #fff; border-color: #000; }
  .toolbar button.primary:hover { background: #333; }
  @media print { .toolbar { display: none; } body { padding-top: 0; } }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()" class="primary">Cetak / Simpan PDF</button>
    <button onclick="window.close()">Tutup</button>
  </div>

  <div class="label">
    <!-- Header -->
    <div class="header">
      <div class="store">WALI Merch</div>
      <div class="date-badge">${dateStr}</div>
    </div>

    <!-- Order code -->
    <div style="font-size:9px;font-weight:700;margin-bottom:4px;letter-spacing:0.5px;">
      ORDER: <span style="font-family:monospace;">${order.order_code}</span>
    </div>

    <!-- Sender + Receiver -->
    <div class="party-grid">
      <div class="party party-sender">
        <div class="party-label">Dari (Pengirim)</div>
        <div class="party-name">WALI Merch</div>
        <div class="party-phone">Tangerang Selatan, Banten</div>
        <div class="party-addr">Jl. Alam Sutera, Tangerang Selatan 15314</div>
      </div>
      <div class="party party-receiver">
        <div class="party-label">Ke (Penerima)</div>
        <div class="party-name">${order.customer_name || "-"}</div>
        <div class="party-phone">${order.customer_phone || "-"}</div>
        <div class="party-addr">${destAddr1}${destAddr2 ? " — " + destAddr2 : ""}</div>
      </div>
    </div>

    <!-- Items -->
    <div class="items-section">
      <div class="items-header">Isi Paket</div>
      <table class="items">
        <thead>
          <tr><th>Produk</th><th class="qty-th">Qty</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="total-qty-row">
        <span>Total: ${totalQty} pcs</span>
      </div>
    </div>

    <!-- Service + Status -->
    <div class="service-row">
      <div>
        <div class="status-label">Jasa Pengiriman</div>
        <div class="status-value">JNE ${order.shipping_service || "REG"}</div>
      </div>
      <div>
        <div class="status-label">Status Order</div>
        <div class="status-value" style="text-transform:capitalize;">${order.order_status?.replace(/_/g, " ") || "-"}</div>
      </div>
      <div>
        <div class="status-label">Bayar</div>
        <div class="status-value" style="text-transform:capitalize;">${order.payment_status || "-"}</div>
      </div>
    </div>

    <!-- Tracking number -->
    ${order.tracking_number ? `
    <div class="tracking-strip">
      <div style="flex:2;">
        <div class="status-label">Nomor Resi JNE</div>
        <div style="font-family:monospace;font-size:12px;font-weight:700;letter-spacing:1px;">${order.tracking_number}</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;">
        <div style="width:50px;height:50px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:7px;color:#999;text-align:center;line-height:1.3;">
          QR CODE
        </div>
      </div>
    </div>` : ""}

    <!-- Footer -->
    <div class="footer">
      WALI Merch &mdash; Tangerang Selatan, Banten &mdash; ${dateStr}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=420,height=620");
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 400);
    };
  }
}

export default function OrderCard({
  order,
  onUpdate,
}: {
  order: OrderRow;
  onUpdate: (formData: FormData) => Promise<void>;
}) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-[#d7ff53]/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 md:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-white">{order.order_code}</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                orderStatusStyle[order.order_status] ||
                "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {orderStatusLabel[order.order_status] || order.order_status}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                paymentStatusStyle[order.payment_status] ||
                "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {paymentStatusLabel[order.payment_status] || order.payment_status}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/65">
            {order.customer_name}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
          </p>
          <p className="text-[11px] text-white/40">
            {new Date(order.created_at).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-black text-[#d7ff53] md:text-lg">
            {rupiah(order.total_amount)}
          </p>
          {order.payment_method && (
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">
              {paymentMethodLabel[order.payment_method] || order.payment_method}
            </p>
          )}
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 text-white/40 transition group-open:rotate-90"
        />
      </summary>

      <div className="border-t border-white/10 p-4 md:p-5">
        <form action={onUpdate} className="grid gap-4 lg:grid-cols-3">
          <input type="hidden" name="id" value={order.id} />

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Status Pesanan
            </label>
            <select
              name="order_status"
              defaultValue={order.order_status}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            >
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Status Pembayaran
            </label>
            <select
              name="payment_status"
              defaultValue={order.payment_status}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7ff53]"
            >
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/40">
              Nomor Resi
            </label>
            <input
              name="tracking_number"
              defaultValue={order.tracking_number || ""}
              placeholder="JNE1234567890"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d7ff53]"
            />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-white/45">
              Ubahan disimpan ke database dan dicatat di audit log admin.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => printReceipt(order)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <Printer size={12} />
                Cetak Resi
              </button>
              <Link
                href={`/order/${order.order_code}`}
                target="_blank"
                className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Lihat di Website
              </Link>
              <button
                type="submit"
                className="rounded-full bg-[#d7ff53] px-5 py-2 text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-2 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-white/55 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">Email</p>
            <p className="font-bold text-white/80">{order.customer_email || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">HP</p>
            <p className="font-bold text-white/80">{order.customer_phone || "-"}</p>
          </div>
        </div>

        {/* Transfer proof */}
        {order.payment_method === "transfer" && (
          <div className="mt-4 rounded-xl border border-[#d7ff53]/20 bg-[#d7ff53]/[0.04] p-3 sm:p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#d7ff53]">
              Bukti Transfer
            </p>
            {order.transfer_proof_url ? (
              <div className="flex items-center gap-3">
                <a
                  href={order.transfer_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.transfer_proof_url}
                    alt="Bukti transfer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 transition group-hover:opacity-100" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-white opacity-0 group-hover:opacity-100">
                    Lihat
                  </span>
                </a>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white/70">
                    {order.transfer_proof_filename || "Bukti transfer"}
                  </p>
                  <Link
                    href={order.transfer_proof_url}
                    target="_blank"
                    className="mt-1 inline-block text-[10px] font-black uppercase tracking-wider text-[#d7ff53] hover:underline"
                  >
                    Buka File →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/40">
                Belum ada bukti transfer yang diunggah.
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
