import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabasePublic";
import { rupiah } from "@/lib/format";

export default async function OrderPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = await params;
  const { data: order } = await supabasePublic.from("orders").select("*, order_items(*)").eq("order_code", orderCode).single();
  if (!order) notFound();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "6285134894580";
  const msg = encodeURIComponent(`Halo admin, saya mau tanya pesanan ${order.order_code}. Status: ${order.order_status}`);
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div
          className="rounded-2xl p-6"
          style={{ border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
        >
          <p className="text-sm uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Order</p>
          <h1 className="mt-2 text-3xl font-black">{order.order_code}</h1>
          <div className="mt-6 grid gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <p><b style={{ color: "var(--text-primary)" }}>Nama:</b> {order.customer_name}</p>
            <p><b style={{ color: "var(--text-primary)" }}>Payment:</b> {order.payment_status}</p>
            <p><b style={{ color: "var(--text-primary)" }}>Status Order:</b> {order.order_status}</p>
            <p><b style={{ color: "var(--text-primary)" }}>Total:</b> {rupiah(order.total_amount)}</p>
            {order.tracking_number && <p><b style={{ color: "var(--text-primary)" }}>Resi:</b> {order.tracking_number}</p>}
          </div>
          <hr className="my-6" style={{ borderColor: "var(--border-color)" }} />
          <h2 className="font-black">Item</h2>
          <ul className="mt-3 space-y-2" style={{ color: "var(--text-secondary)" }}>
            {order.order_items.map((i: any) => <li key={i.id}>{i.product_name} size {i.size} x{i.quantity} — {rupiah(i.subtotal)}</li>)}
          </ul>
          <a
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition hover:opacity-90"
            style={{ background: "var(--accent-color)", color: "var(--bg-primary)" }}
            href={`https://wa.me/${wa}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat Admin via WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
