import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import TrackOrderView from "@/components/track-order/TrackOrderView";
import MidtransScript from "@/components/MidtransScript";
import { createClient } from "@supabase/supabase-js";
import { supabasePublic } from "@/lib/supabasePublic";

const WHATSAPP_ADMIN = "628xxxxxxxxxx";
const WHATSAPP_HELLO = encodeURIComponent("Halo Admin, saya ingin cek status pesanan saya.");

function pickStatus(...candidates: any[]) {
  for (const c of candidates) {
    if (typeof c === "string" && c) return c;
  }
  return undefined;
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params?.q || "").trim();

  let order: any = null;
  let errorMessage = "";

  if (q) {
    try {
      const supabase = supabasePublic;

      // 1) Cari by order_code
      const { data: orderByCode, error: e1 } = await supabase
        .from("orders")
        .select(
          `*, order_items (*)`,
        )
        .eq("order_code", q)
        .maybeSingle();

      if (e1) {
        errorMessage = e1.message || "Gagal mencari pesanan.";
      } else if (orderByCode) {
        order = orderByCode;
      } else {
        // 2) Cari by customer_phone / customer_name
        const isPhone = /^\d{8,}$/.test(q.replace(/[^0-9]/g, ""));
        const probe = isPhone ? q.replace(/[^0-9]/g, "") : q;

        const filters: string[] = [];
        if (isPhone) filters.push(`customer_phone.ilike.%${probe}%`);
        else filters.push(`customer_name.ilike.%${q}%`);

        const { data: orderByContact, error: e2 } = await supabase
          .from("orders")
          .select(`*, order_items (*)`)
          .or(filters.join(","))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (e2) {
          errorMessage = e2.message || "Gagal mencari pesanan.";
        } else if (orderByContact) {
          order = orderByContact;
        } else {
          errorMessage = `Pesanan dengan kode/nomor "${q}" tidak ditemukan.`;
        }
      }
    } catch (err: any) {
      errorMessage = err?.message || "Terjadi kesalahan server.";
    }
  }

  const orderStatus = pickStatus(
    order?.status,
    order?.order_status,
    order?.payment_status,
    order?.state,
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-white">
      <MidtransScript />
      <Navbar activeKey="track-order" />

      <PageHeader
        badge="Real-Time Tracking"
        title="Track"
        highlight="Order"
        description="Pantau status pesanan kamu secara real-time. Masukkan kode order atau nomor WhatsApp yang dipakai saat checkout."
      />

      <TrackOrderView
        q={q}
        order={order}
        errorMessage={errorMessage}
        orderStatus={orderStatus}
        whatsappAdmin={WHATSAPP_ADMIN}
        whatsappText={WHATSAPP_HELLO}
      />

      <Footer />
    </main>
  );
}
