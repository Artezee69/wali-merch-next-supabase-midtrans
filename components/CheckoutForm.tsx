"use client";

import { useState } from "react";
import { CartItem } from "@/lib/types";

declare global { interface Window { snap?: { pay: (token: string, options?: any) => void } } }

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    const cart: CartItem[] = JSON.parse(localStorage.getItem("wali_cart") || "[]");
    if (!cart.length) { alert("Keranjang kosong"); setLoading(false); return; }

    const body = Object.fromEntries(formData.entries());
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, cart })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert(data.error || "Checkout gagal");

    window.snap?.pay(data.token, {
      onSuccess: () => { localStorage.removeItem("wali_cart"); window.location.href = `/order/${data.order_code}`; },
      onPending: () => { localStorage.removeItem("wali_cart"); window.location.href = `/order/${data.order_code}`; },
      onError: () => alert("Pembayaran gagal"),
      onClose: () => alert("Popup pembayaran ditutup")
    });
  }

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-2">
      <input className="input" name="customer_name" placeholder="Nama lengkap" required />
      <input className="input" name="customer_phone" placeholder="Nomor WhatsApp" required />
      <input className="input lg:col-span-2" type="email" name="customer_email" placeholder="Email" />
      <textarea className="input lg:col-span-2" name="address" placeholder="Alamat lengkap" required />
      <input className="input" name="province" placeholder="Provinsi" />
      <input className="input" name="city" placeholder="Kota/Kabupaten" />
      <input className="input" name="district" placeholder="Kecamatan" />
      <input className="input" name="postal_code" placeholder="Kode pos" />
      <textarea className="input lg:col-span-2" name="notes" placeholder="Catatan order" />
      <button disabled={loading} className="btn lg:col-span-2">{loading ? "Memproses..." : "Bayar dengan Midtrans"}</button>
    </form>
  );
}
