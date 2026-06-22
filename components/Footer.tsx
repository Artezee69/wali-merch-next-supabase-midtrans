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
    <footer className="border-t border-white/10 px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div
          className="flow-line-bar h-px w-full"
          style={{ height: "1px" }}
        />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 text-sm text-white/45 md:flex-row md:items-center">
        <p className="font-bold">© {year} Official Merchandise WALI. All rights reserved.</p>
        <div className="flex flex-wrap gap-5 font-bold">
          <Link href="/products" className="draw-underline hover:text-white transition">
            Products
          </Link>
          <Link href="/track-order" className="draw-underline hover:text-white transition">
            Track Order
          </Link>
          <Link href="/cart" className="draw-underline hover:text-white transition">
            Cart
          </Link>
          <Link href="/admin" className="draw-underline hover:text-white transition">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
