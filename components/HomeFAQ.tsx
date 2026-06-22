"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const defaultFaqs = [
  {
    q: "Apakah ini merchandise resmi WALI?",
    a: "Ya. Semua produk yang dijual di sini adalah merchandise resmi WALI yang diproduksi dan didistribusikan oleh tim official.",
  },
  {
    q: "Berapa lama pesanan diproses?",
    a: "Pesanan akan diproses maksimal 1-2 hari kerja setelah pembayaran diterima. Customer akan menerima notifikasi WhatsApp ketika pesanan sudah diproses dan dikirim.",
  },
  {
    q: "Metode pembayaran apa yang tersedia?",
    a: "Kami menyediakan pembayaran melalui Midtrans dengan QRIS, transfer bank (BCA, BNI, BRI, Mandiri), e-wallet (GoPay, OVO, DANA, ShopeePay), dan lain-lain.",
  },
  {
    q: "Bagaimana cara cek status pesanan?",
    a: "Masuk ke halaman Track Order dan masukkan kode order atau nomor WhatsApp yang kamu gunakan saat checkout. Status pesanan akan muncul secara real-time.",
  },
  {
    q: "Apakah bisa retur atau tukar size?",
    a: "Karena semua produk adalah pre-order, retur dan tukar size tidak bisa dilakukan kecuali ada kesalahan produksi. Mohon cek size chart sebelum order.",
  },
  {
    q: "Bagaimana cara hubungi admin?",
    a: "Kamu bisa langsung menghubungi admin melalui tombol WhatsApp yang tersedia di halaman produk, checkout, dan detail order.",
  },
];

export default function HomeFAQ({ items }: { items?: { q: string; a: string }[] }) {
  const faqs = items && items.length > 0 ? items : defaultFaqs;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d7ff53]">
          FAQ
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase md:text-4xl">
          Frequently Asked
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/55 md:text-base">
          Pertanyaan yang sering ditanyakan tentang merchandise, checkout, dan
          pengiriman.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border border-white/10 transition ${
                isOpen ? "bg-white/[0.06]" : "bg-white/[0.03]"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5"
              >
                <span className="text-sm font-black md:text-base">{item.q}</span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 transition ${
                    isOpen ? "bg-[#d7ff53] text-black" : "bg-white/5 text-white"
                  }`}
                >
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm leading-7 text-white/60 md:px-5 md:pb-5">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
