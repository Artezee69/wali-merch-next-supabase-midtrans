import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabasePublic";
import { rupiah } from "@/lib/format";

export default async function OrderPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = await params;
  const { data: order } = await supabasePublic.from("orders").select("*, order_items(*)").eq("order_code", orderCode).single();
  if (!order) notFound();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "6281234567890";
  const msg = encodeURIComponent(`Halo admin, saya mau tanya pesanan ${order.order_code}. Status: ${order.order_status}`);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="card p-6">
        <p className="text-sm uppercase tracking-widest text-black/50">Order</p>
        <h1 className="mt-2 text-3xl font-black">{order.order_code}</h1>
        <div className="mt-6 grid gap-3 text-sm">
          <p><b>Nama:</b> {order.customer_name}</p>
          <p><b>Payment:</b> {order.payment_status}</p>
          <p><b>Status Order:</b> {order.order_status}</p>
          <p><b>Total:</b> {rupiah(order.total_amount)}</p>
          {order.tracking_number && <p><b>Resi:</b> {order.tracking_number}</p>}
        </div>
        <hr className="my-6" />
        <h2 className="font-black">Item</h2>
        <ul className="mt-3 space-y-2">
          {order.order_items.map((i: any) => <li key={i.id}>{i.product_name} size {i.size} x{i.quantity} — {rupiah(i.subtotal)}</li>)}
        </ul>
        <a className="btn mt-6" href={`https://wa.me/${wa}?text=${msg}`} target="_blank">Chat Admin via WhatsApp</a>
      </div>
    </main>
  );
}
