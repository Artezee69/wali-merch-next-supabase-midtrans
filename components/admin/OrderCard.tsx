"use client";

import Link from "next/link";
import { rupiah } from "@/lib/format";
import { ChevronDown, Printer, ExternalLink } from "lucide-react";
import {
  AdminButton,
  Pill,
  type PillTone,
} from "@/components/admin/ui";

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

const orderStatusTone: Record<string, PillTone> = {
  waiting_payment: "amber",
  processing: "blue",
  shipped: "blue",
  completed: "green",
  cancelled: "red",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "Pending",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kadaluarsa",
  refunded: "Refund",
};

const paymentStatusTone: Record<string, PillTone> = {
  pending: "amber",
  paid: "green",
  failed: "red",
  expired: "neutral",
  refunded: "blue",
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

const selectCls = "ad-input";

const ORDER_ACCENT: Record<string, string> = {
  waiting_payment: "#d97706",
  processing: "#2563eb",
  shipped: "#0891b2",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export default function OrderCard({
  order,
  onUpdate,
}: {
  order: OrderRow;
  onUpdate: (formData: FormData) => Promise<void>;
}) {
  const accent = ORDER_ACCENT[order.order_status] ?? "#d1d5db";
  return (
    <details
      className="ad-card group !p-0 overflow-hidden open:!border-[var(--ad-accent)]/30"
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 sm:px-5 transition-colors hover:bg-[var(--ad-surface-2)]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[13px] font-bold tracking-wide text-[var(--ad-text)]">
              {order.order_code}
            </span>
            <Pill tone={orderStatusTone[order.order_status] ?? "neutral"}>
              {orderStatusLabel[order.order_status] || order.order_status}
            </Pill>
            <Pill tone={paymentStatusTone[order.payment_status] ?? "neutral"}>
              {paymentStatusLabel[order.payment_status] || order.payment_status}
            </Pill>
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-[var(--ad-text-2)]">
            {order.customer_name}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
          </p>
          <p className="text-[11px] text-[var(--ad-text-3)]">
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
          <p className="text-[15px] font-bold text-[var(--ad-text)] md:text-[16px]">
            {rupiah(order.total_amount)}
          </p>
          {order.payment_method && (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ad-text-3)]">
              {paymentMethodLabel[order.payment_method] || order.payment_method}
            </p>
          )}
        </div>
        <ChevronDown
          size={16}
          className="shrink-0 text-[var(--ad-text-3)] transition group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[var(--ad-border-soft)] p-4 sm:p-5">
        <form action={onUpdate} className="grid gap-3.5 lg:grid-cols-3">
          <input type="hidden" name="id" value={order.id} />

          <div>
            <label className="ad-label">
              <span>Status Pesanan</span>
            </label>
            <select name="order_status" defaultValue={order.order_status} className={selectCls}>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ad-label">
              <span>Status Pembayaran</span>
            </label>
            <select name="payment_status" defaultValue={order.payment_status} className={selectCls}>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ad-label">
              <span>Nomor Resi</span>
            </label>
            <input
              name="tracking_number"
              defaultValue={order.tracking_number || ""}
              placeholder="JNE1234567890"
              className={`${selectCls} font-mono text-[12px]`}
            />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[var(--ad-text-3)]">
              Perubahan disimpan ke database dan tercatat di audit log admin.
            </p>
            <div className="flex flex-wrap gap-2">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => printReceipt(order)}
              >
                <Printer size={12} /> Cetak Resi
              </AdminButton>
              <Link
                href={`/order/${order.order_code}`}
                target="_blank"
                className="ad-btn ad-btn-secondary ad-btn-sm"
              >
                <ExternalLink size={12} /> Lihat di Website
              </Link>
              <AdminButton type="submit" variant="primary" size="sm">
                Simpan
              </AdminButton>
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-2.5 rounded-lg bg-[var(--ad-surface-2)] p-3 text-[12px] sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
              Email
            </p>
            <p className="font-semibold text-[var(--ad-text)]">{order.customer_email || "-"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ad-text-3)]">
              HP
            </p>
            <p className="font-semibold text-[var(--ad-text)]">{order.customer_phone || "-"}</p>
          </div>
        </div>

        {/* Transfer proof */}
        {order.payment_method === "transfer" && (
          <div className="ad-inset mt-4 p-3.5">
            <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-widest text-[var(--ad-accent)]">
              Bukti Transfer
            </p>
            {order.transfer_proof_url ? (
              <div className="flex items-center gap-3">
                <a
                  href={order.transfer_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--ad-border)]"
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
                  <p className="truncate text-[12.5px] font-semibold text-[var(--ad-text-2)]">
                    {order.transfer_proof_filename || "Bukti transfer"}
                  </p>
                  <Link
                    href={order.transfer_proof_url}
                    target="_blank"
                    className="mt-0.5 inline-block text-[11.5px] font-bold text-[var(--ad-accent)] hover:underline"
                  >
                    Buka File →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--ad-text-3)]">
                Belum ada bukti transfer yang diunggah.
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
