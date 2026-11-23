"use client";

import Link from "next/link";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";

type FooterProps = {
  variant?: "customer" | "admin";
};

export default function Footer({ variant = "customer" }: FooterProps) {
  const year = new Date().getFullYear();
  const { settings } = useHomepageSettings();
  const footerSettings = settings?.footer;

  /* ── Admin variant: minimal ────────────────────────────────────── */
  if (variant === "admin") {
    return (
      <footer
        className="border-t px-5 py-6 md:px-10"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
            &copy; {year} WALI Admin Panel
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link
              href="/admin/products"
              className="text-xs font-medium transition hover:opacity-100"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            >
              Produk
            </Link>
            <Link
              href="/admin/orders"
              className="text-xs font-medium transition hover:opacity-100"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            >
              Pesanan
            </Link>
            <Link
              href="/"
              className="text-xs font-medium transition hover:opacity-100"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            >
              Website
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  /* ── Customer variant: premium dark theme ─────────────────────── */
  return (
    <footer style={{ background: "var(--bg-primary)" }}>
      {/* Top border accent */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(to right, transparent, var(--border-color), transparent)" }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand block */}
          <div>
            <p className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {footerSettings?.brandDescription ? (
                footerSettings.brandDescription.split(".")[0]
              ) : (
                <>
                  WALI{" "}
                  <span style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
                    Merchandise
                  </span>
                </>
              )}
            </p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {footerSettings?.brandDescription || "Merchandise resmi WALI. Dibuat dengan penuh dedikasi."}
            </p>
          </div>

          {/* Quick links */}
          <nav
            aria-label="Footer"
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3"
          >
            {(footerSettings?.links?.length ? footerSettings.links : [{ id: "products", label: "Produk", url: "/products" }, { id: "track", label: "Lacak Pesanan", url: "/track-order" }, { id: "cart", label: "Keranjang", url: "/cart" }, { id: "login", label: "Masuk", url: "/login" }]).map(
              (link, i) => (
                <Link
                  key={link.id || i}
                  href={link.url}
                  className="text-sm font-medium transition-colors duration-150 hover:opacity-100"
                  style={{ color: "var(--text-secondary)", opacity: 0.55 }}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Divider + copyright */}
        <div
          className="mt-9 flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid var(--border-color)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-secondary)", opacity: 0.3 }}>
            {footerSettings?.copyrightText ? `${footerSettings.copyrightText} ${year}` : `© ${year} Merchandise Resmi WALI. Hak cipta dilindungi.`}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)", opacity: 0.2 }}>
            &middot; Dibuat dengan penuh dedikasi
          </p>
        </div>
      </div>
    </footer>
  );
}
