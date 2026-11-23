"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  Menu, X, User, LogOut, ChevronDown, Home, ShoppingBag,
  Truck, ShoppingCart, Search, Package, LogIn,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useHomepageSettings, resolveHeaderSettings, type HeaderSettings } from "@/hooks/useHomepageSettings";

type NavKey =
  | "home" | "products" | "track-order" | "cart" | "checkout"
  | "order-detail" | "payment" | "admin" | "admin-products" | "admin-orders";

type NavbarProps = {
  variant?: "customer" | "admin";
  activeKey?: NavKey;
  desktopCta?: ReactNode;
  mobileExtras?: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

function buildCustomerNav(header: HeaderSettings): NavItem[] {
  return [
    { href: "/", label: header.menuLabels.home, icon: <Home size={16} /> },
    { href: "/products", label: header.menuLabels.products, icon: <ShoppingBag size={16} /> },
    { href: "/track-order", label: header.menuLabels.trackOrder, icon: <Truck size={16} /> },
  ];
}

const adminNav: NavItem[] = [
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/", label: "Website" },
];

function isItemActive(item: NavItem, activeKey: NavKey | undefined, pathname: string | null) {
  if (activeKey) {
    if (activeKey === "admin-products") return item.href === "/admin/products";
    if (activeKey === "admin-orders") return item.href === "/admin/orders";
    if (activeKey === "home") return item.href === "/";
    if (activeKey === "admin") return item.href === "/admin";
    return item.href === `/${activeKey}`;
  }
  if (!pathname) return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function resolveDisplayName(
  profile: { full_name?: string | null } | null | undefined,
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null | undefined
): string {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;
  const fromMeta = (user?.user_metadata?.full_name as string | undefined)?.trim();
  if (fromMeta) return fromMeta;
  const email = user?.email ?? "";
  const local = email.includes("@") ? email.split("@")[0] : email;
  return local || "Akun";
}

// ─── CSS-variable style helpers ──────────────────────────────────────────────
const s = {
  bgPrimary:  { backgroundColor: "var(--bg-primary)" },
  bgSecondary:{ backgroundColor: "var(--bg-secondary)" },
  border:     { borderColor: "var(--border-color)" },
  textPrimary:{ color: "var(--text-primary)" },
  textSecond: { color: "var(--text-secondary)" },
  accent:     { color: "var(--accent-color)" },
};

// ─── Mobile bottom nav items (Shopee-style) ──────────────────────────────────
type MobileNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export default function Navbar({
  variant = "customer",
  activeKey,
  desktopCta,
  mobileExtras,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, profile, profileLoading } = useAuth();
  const { settings } = useHomepageSettings();
  const headerSettings = resolveHeaderSettings(settings?.header);
  const customerNav = buildCustomerNav(headerSettings);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName = resolveDisplayName(profile, user);
  const initials = getInitials(displayName);

  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll when admin drawer is open
  useEffect(() => {
    if (open && variant === "admin") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, variant]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileRef]);

  const handleSignOut = useCallback(async () => {
    setProfileOpen(false);
    await signOut();
  }, [signOut]);

  const goToAccount = useCallback(() => {
    setProfileOpen(false);
    router.push("/account");
  }, [router]);

  const items = variant === "admin" ? adminNav : customerNav;
  const brandHref = variant === "admin" ? "/admin" : "/";
  const isMobileNav = variant === "customer";

  // ─── Mobile bottom nav (Shopee-style) ──────────────────────────────────────
  const mobileNavItems: MobileNavItem[] =
    isMobileNav
      ? [
          { href: "/", label: headerSettings.menuLabels.home, icon: <Home size={22} /> },
          { href: "/products", label: headerSettings.menuLabels.products, icon: <ShoppingBag size={22} /> },
          {
            href: "/cart",
            label: headerSettings.menuLabels.cart,
            icon: <ShoppingCart size={22} />,
          },
          user
            ? { href: "/account", label: "Akun", icon: <User size={22} /> }
            : { href: "/login", label: "Masuk", icon: <LogIn size={22} /> },
        ]
      : [];

  // ─── Cart item count ────────────────────────────────────────────────────────
  const { itemCount } = useCart();

  // ─── Customer CTA (right side, desktop) ────────────────────────────────────
  const customerCta = (
    <div className="flex items-center gap-2">
      {/* Cart icon */}
      <Link
        href="/cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}
        aria-label="Keranjang"
      >
        <ShoppingCart size={20} />
        {itemCount > 0 && (
          <span
            className="absolute top-0 right-0 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black"
            style={{ backgroundColor: "var(--accent-color)", color: "var(--bg-primary)" }}
          >
            {itemCount}
          </span>
        )}
      </Link>

      {/* Auth / profile */}
      {user && !profileLoading ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 transition"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <div
              className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              {profile?.profile_image_url ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars${profile.profile_image_url}`}
                  alt="Avatar"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[10px] font-black"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {initials}
                </div>
              )}
            </div>
            <span className="hidden text-sm font-semibold md:inline-block" style={s.textPrimary}>
              {displayName}
            </span>
            <ChevronDown size={14} className="hidden md:block" style={s.textSecond} />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-2xl z-20"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              {/* Header */}
              <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <p className="truncate text-sm font-bold" style={s.textPrimary}>{displayName}</p>
                <p className="truncate text-[11px]" style={s.textSecond}>{user.email}</p>
              </div>
              {/* Profil */}
              <button
                type="button"
                onClick={goToAccount}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition"
                style={s.textSecond}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <User size={15} />
                Profil Saya
              </button>
              {/* Pesanan */}
              <button
                type="button"
                onClick={() => { setProfileOpen(false); router.push("/account/orders"); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition"
                style={s.textSecond}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Package size={15} />
                Pesanan Saya
              </button>
              {/* Keluar */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition"
                style={{ color: "var(--danger-color)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {headerSettings.showLogin && (
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition"
              style={{
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              {headerSettings.loginLabel}
            </Link>
          )}
          {headerSettings.showRegister && (
            <Link
              href="/register"
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--bg-primary)",
              }}
            >
              {headerSettings.registerLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  MOBILE HEADER (customer) — sticky top, compact brand + search
  // ════════════════════════════════════════════════════════════════════════════
  const mobileHeader = (
    <div className="md:hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Row 1: Brand */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <Link href={brandHref} className="flex items-center gap-2">
          {headerSettings.logoUrl ? (
            <img src={headerSettings.logoUrl} alt={headerSettings.logoText} className="h-7 w-auto" />
          ) : (
            <span
              className="text-[13px] font-black uppercase tracking-[0.2em]"
              style={s.textPrimary}
            >
              {headerSettings.logoText}
            </span>
          )}
        </Link>
        {/* Cart shortcut in mobile header */}
        <Link
          href="/cart"
          className="relative flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
          aria-label="Keranjang"
        >
          <ShoppingCart size={17} />
          {itemCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black"
              style={{ backgroundColor: "var(--accent-color)", color: "var(--bg-primary)" }}
            >
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      {/* Row 2: Search bar */}
      <div className="px-3 py-2.5">
        <form
          action="/products"
          method="GET"
          className="flex items-center gap-2 rounded-full px-3.5 py-2.5 transition focus-within:ring-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid var(--border-color)",
            // focus ring via CSS var
          }}
        >
          <Search size={16} className="shrink-0" style={s.textSecond} />
          <input
            type="text"
            name="q"
            placeholder="Cari merchandise…"
            aria-label="Cari produk"
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </form>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  MOBILE BOTTOM NAV (customer) — fixed, Shopee-style, 4 tabs
  // ════════════════════════════════════════════════════════════════════════════
  const mobileBottomNav = (
    <>
      {/* Fixed bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-color)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-stretch">
          {mobileNavItems.map((item, idx) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const isCart = item.href === "/cart";
            return (
              <Link
                key={idx}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2.5 transition"
                style={{ color: active ? "var(--accent-color)" : "var(--text-secondary)" }}
              >
                {/* Cart gets a badge */}
                <span className="relative">
                  {item.icon}
                  {isCart && itemCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black"
                      style={{
                        backgroundColor: "var(--accent-color)",
                        color: "var(--bg-primary)",
                      }}
                    >
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer: prevents page content from hiding under the fixed bottom nav */}
      <div className="h-[64px] md:hidden" />
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--bg-primary)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.25)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Customer mobile: compact header with brand + search */}
      {isMobileNav && mobileHeader}

      {/* Customer desktop / Admin: full desktop header */}
      <div className={`${isMobileNav ? "hidden md:block" : ""}`}>
        <div
          className="flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3.5 md:px-8"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          {/* Brand */}
          <Link href={brandHref} className="group flex shrink-0 items-center gap-2.5">
            {headerSettings.logoUrl ? (
              <img
                src={headerSettings.logoUrl}
                alt={headerSettings.logoText}
                className="h-8 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div>
                <div
                  className="text-sm sm:text-base font-black uppercase tracking-[0.2em] transition-colors duration-300 group-hover:opacity-80"
                  style={s.textPrimary}
                >
                  {headerSettings.logoText}
                </div>
                {headerSettings.showSubtitle && (
                  <div
                    className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.35em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {headerSettings.logoSubtitle}
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* Center nav links */}
          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            {items.map((item) => {
              const active = isItemActive(item, activeKey, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-1.5 transition-all duration-200"
                  style={{
                    color: active ? "var(--accent-color)" : "var(--text-primary)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute -bottom-[14px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full"
                      style={{ backgroundColor: "var(--accent-color)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA */}
          <div className="hidden shrink-0 md:flex">{desktopCta || customerCta}</div>

          {/* Admin hamburger (mobile) */}
          {variant === "admin" && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 md:hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              {open ? <X size={18} style={s.accent} /> : <Menu size={18} />}
            </button>
          )}
        </div>

        {/* Desktop sub-search (customer only) */}
        {isMobileNav && (
          <div
            className="border-t px-6 py-2 sm:px-6 md:px-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <form action="/products" method="GET" className="mx-auto flex max-w-md items-center">
              <div
                className="flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 transition focus-within:ring-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Search size={16} className="shrink-0" style={s.textSecond} />
                <input
                  type="text"
                  name="q"
                  placeholder="Cari produk…"
                  aria-label="Cari produk"
                  className="w-full bg-transparent text-sm focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Admin mobile drawer */}
      {variant === "admin" && open && (
        <div
          className="border-t md:hidden overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderTopColor: "var(--border-color)",
            transformOrigin: "top",
            maxHeight: "75dvh",
          }}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-wider transition"
                style={{
                  backgroundColor: isItemActive(item, activeKey, pathname) ? "var(--accent-color)" : "transparent",
                  color: isItemActive(item, activeKey, pathname)
                    ? "var(--bg-primary)"
                    : "var(--text-primary)",
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            {mobileExtras && (
              <div
                className="mt-3 grid gap-2 pt-4"
                style={{ borderTop: "1px solid var(--border-color)" }}
              >
                {mobileExtras}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Customer mobile: fixed bottom nav (Shopee-style) */}
      {isMobileNav && mobileBottomNav}
    </div>
  );
}
