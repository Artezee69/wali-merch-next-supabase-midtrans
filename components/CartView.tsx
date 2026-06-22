"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartItem } from "@/lib/types";
import { rupiah } from "@/lib/format";

export default function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => setItems(JSON.parse(localStorage.getItem("wali_cart") || "[]")), []);

  function save(next: CartItem[]) {
    setItems(next);
    localStorage.setItem("wali_cart", JSON.stringify(next));
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!items.length) return <p className="text-black/60">Keranjang masih kosong.</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.variant_id} className="card flex gap-4 p-4">
            <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-black/5">
              {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-cover" />}
            </div>
            <div className="flex-1">
              <h3 className="font-black">{item.name}</h3>
              <p className="text-sm text-black/60">Size {item.size}</p>
              <p className="font-bold">{rupiah(item.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <input className="input max-w-24 py-2" type="number" min={1} value={item.quantity} onChange={(e) => save(items.map((x) => x.variant_id === item.variant_id ? { ...x, quantity: Number(e.target.value) } : x))} />
                <button className="text-sm font-bold text-red-700" onClick={() => save(items.filter((x) => x.variant_id !== item.variant_id))}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="card h-fit p-5">
        <p className="text-black/60">Total</p>
        <h2 className="text-2xl font-black">{rupiah(total)}</h2>
        <Link className="btn mt-5 w-full" href="/checkout">Lanjut Checkout</Link>
      </aside>
    </div>
  );
}
