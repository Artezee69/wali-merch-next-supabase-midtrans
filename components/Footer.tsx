import Link from "next/link";

type FooterProps = {
  variant?: "customer" | "admin";
};

export default function Footer({ variant = "customer" }: FooterProps) {
  const year = new Date().getFullYear();

  if (variant === "admin") {
    return (
      <footer className="border-t border-white/10 px-4 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div
            className="flow-line-bar h-px w-full"
            style={{ height: "1px" }}
          />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 text-sm text-white/45 sm:flex-row sm:items-center">
          <p className="font-bold">© {year} WALI Admin Panel. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 font-bold">
            <Link href="/admin/products" className="draw-underline hover:text-white transition">
              Produk
            </Link>
            <Link href="/admin/orders" className="draw-underline hover:text-white transition">
              Orders
            </Link>
            <Link href="/" className="draw-underline hover:text-white transition">
              Website
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 px-4 py-10 md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div
          className="flow-line-bar h-px w-full"
          style={{ height: "1px" }}
        />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 text-sm text-white/45 md:flex-row md:items-center md:gap-8">
        <p className="font-bold text-white/70">© {year} Official Merchandise WALI. All rights reserved.</p>
        <nav className="flex flex-wrap items-center gap-4 md:gap-6">
          <Link href="/products" className="draw-underline text-white/60 hover:text-[#d7ff53] transition-all duration-200 font-semibold text-sm">
            Products
          </Link>
          <Link href="/track-order" className="draw-underline text-white/60 hover:text-[#d7ff53] transition-all duration-200 font-semibold text-sm">
            Track Order
          </Link>
          <Link href="/cart" className="draw-underline text-white/60 hover:text-[#d7ff53] transition-all duration-200 font-semibold text-sm">
            Cart
          </Link>
        </nav>
      </div>
    </footer>
  );
}
