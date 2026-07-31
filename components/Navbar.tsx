"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Menu, X, User, LogOut, ChevronDown, Home, ShoppingBag, Truck, ShoppingCart, Search } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useHomepageSettings, resolveHeaderSettings, type HeaderSettings } from "@/hooks/useHomepageSettings";

type NavKey =
  | "home"
  | "products"
  | "track-order"
  | "cart"
  | "checkout"
  | "order-detail"
  | "admin"
  | "admin-products"
  | "admin-orders";

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

// Default avatar with initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

// Resolves the customer name to display. Order:
//   1. profiles.full_name (authoritative — set by trigger or upsert)
//   2. auth.user_metadata.full_name (passed at signUp)
//   3. email local-part (e.g. "ada" of "ada@x.com")
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

export default function Navbar({
  variant = "customer",
  activeKey,
  desktopCta,
  mobileExtras,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, user, signOut, profile, profileLoading } = useAuth();
  const { settings } = useHomepageSettings();
  const headerSettings = resolveHeaderSettings(settings?.header);
  const customerNav = buildCustomerNav(headerSettings);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName = resolveDisplayName(profile, user);
  const initials = getInitials(displayName);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

  // Theme Toggle removed — pure dark mode only (no light mode option available)

  const items = variant === "admin" ? adminNav : customerNav;
  const brandHref = variant === "admin" ? "/admin" : "/";

  // Customer nav CTA (auth buttons)
  const { itemCount } = useCart();
  const customerCta = (
    <div className="flex items-center gap-3">
      {/* Cart icon — only icon, right before account */}
      <Link href="/cart" className="relative mr-1 text-gray-600 dark:text-white hover:text-green-600 dark:hover:text-[#d7ff53] transition">
        <ShoppingCart size={22} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-green-600 dark:bg-[#d7ff53] text-[10px] font-bold text-white dark:text-gray-800">
            {itemCount}
          </span>
        )}
      </Link>
      {user && !profileLoading ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 dark:border-white/20 dark:bg-gray-800/30 px-2.5 py-1.5 transition hover:border-gray-400 hover:bg-gray-200 dark:hover:border-green-600 dark:hover:bg-gray-700/30"
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10 dark:bg-gray-600/30 light:bg-gray-300 dark:light:bg-gray-600/30">
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
                <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-white/60 dark:text-gray-400 light:text-gray-600 dark:light:text-white/60">
                  {initials}
                </div>
              )}
            </div>
            <span className="hidden text-sm font-semibold text-gray-700 md:inline-block dark:text-white light:text-gray-700 dark:light:text-white">
              {displayName}
            </span>
            <ChevronDown size={14} className="hidden text-gray-500 dark:text-white md:block light:text-gray-500 dark:light:text-white" />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-xl z-20 light:bg-white dark:light:bg-gray-800/90"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              <div className="px-3 py-2 border-b border-gray-300 dark:border-white/10 light:border-gray-300">
                <p className="truncate text-sm font-bold" style={{ color: "var(--text-primary) light:text-gray-900 dark:light:text-gray-400" }}>{displayName}</p>
                <p className="truncate text-[11px]" style={{ color: "var(--text-secondary) light:text-gray-600 dark:light:text-gray-400" }}>{user.email}</p>
              </div>
              <button
                type="button"
                onClick={goToAccount}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700/30 light:bg-gray-100"
                style={{ color: "var(--text-secondary) light:text-gray-700 dark:light:text-gray-400" }}>
                <User size={15} />
                Profil Saya
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-red-100 dark:hover:bg-red-900/20 light:bg-gray-100"
                style={{ color: "var(--danger-color) light:text-red-600 dark:light:text-red-400", backgroundColor: "transparent" }}>
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
              className="rounded-xl border border-green-600 dark:border-white/20 bg-gray-100 dark:bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-white light:text-gray-700 transition hover:border-green-600 dark:hover:border-[#d7ff53] hover:bg-gray-200 dark:hover:bg-[#d7ff53]/10 light:bg-gray-100 dark:light:bg-transparent"
            >
              {headerSettings.loginLabel}
            </Link>
          )}
          {headerSettings.showRegister && (
            <Link
              href="/register"
              className="rounded-xl bg-green-600 dark:bg-[#d7ff53] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-gray-800 light:text-white transition hover:bg-green-700 dark:hover:bg-[#b8e633] hover:text-black"
            >
              {headerSettings.registerLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl shadow-lg transition-all duration-300 border-b border-white/10">
      <header className="border-b border-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-4 py-3 sm:py-4 md:px-8">
        {/* Brand — top left: big bold text, subtitle below */}
        <Link href={brandHref} className="shrink-0 flex items-center gap-2">
          {headerSettings.logoUrl ? (
            <img
              src={headerSettings.logoUrl}
              alt={headerSettings.logoText}
              className="h-8 sm:h-9 w-auto transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="text-sm sm:text-base font-black uppercase tracking-[0.2em] sm:tracking-[0.22em] text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-[#d7ff53] animate-pulse-light">
                {headerSettings.logoText}
              </div>
              {headerSettings.showSubtitle && (
                <div className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                  {headerSettings.logoSubtitle}
                </div>
              )}
            </>
          )}
        </Link>

        {/* Center nav links */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-700 dark:text-white light:text-gray-700 md:flex">
          {items.map((item) => {
            const active = isItemActive(item, activeKey, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 text-gray-700 dark:text-white light:text-gray-700 transition hover:text-green-600 dark:hover:text-[#d7ff53] ${
                  active ? "text-green-600 dark:text-[#d7ff53] font-bold" : ""
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {active && (
                  <span
                    className="absolute -bottom-[14px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-green-600 dark:bg-[#d7ff53]"
                    style={{ boxShadow: "0 0 8px rgba(16,185,129,0.6) dark:shadow-[0_0_8px_rgba(215,255,83,0.6)]" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side CTA */}
        <div className="hidden shrink-0 md:flex">{desktopCta || customerCta}</div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 dark:bg-white/5 text-white transition-all duration-200 hover:bg-white/10 hover:border-[#d7ff53]/30 active:scale-95 md:hidden"
        >
          {open ? <X size={20} className="text-[#d7ff53]" /> : <Menu size={20} className="text-white" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="animate-slide-down-spring border-t border-white/10 bg-black/95 backdrop-blur-xl md:hidden overflow-y-auto"
          style={{ transformOrigin: "top", maxHeight: "85dvh" }}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {/* Mobile search bar */}
            <form
              action="/products"
              method="GET"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <Search size={16} className="text-gray-500 dark:text-white/40" />
              <input
                type="text"
                name="q"
                placeholder="Cari produk..."
                aria-label="Search products"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800/50"
              />
            </form>

            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-wider transition ${
                  isItemActive(item, activeKey, pathname)
                    ? "bg-[#d7ff53] text-black font-black"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </Link>
            ))}

            {/* Cart link in mobile menu */}
            <Link
              href="/cart"
              className={`flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-wider transition-all duration-200 active:scale-98 ${
                pathname === "/cart"
                  ? "bg-[#d7ff53] text-black font-black"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart size={16} />
                {headerSettings.menuLabels.cart}
              </span>
              {itemCount > 0 && (
                <span className={`flex h-6 min-w-6 px-2 items-center justify-center rounded-full text-[11px] font-bold ${
                  pathname === "/cart" ? "bg-black text-[#d7ff53]" : "bg-black text-[#d7ff53]"
                }`}>
                  {itemCount}
                </span>
              )}
            </Link>

            {mobileExtras && (
              <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
                {mobileExtras}
              </div>
            )}

            {/* Mobile auth CTA */}
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
              {user && !profileLoading ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {profile?.profile_image_url ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars${profile.profile_image_url}`}
                          alt="Avatar"
                          fill
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-white/60">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{displayName}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          goToAccount();
                        }}
                        className="text-xs text-[#d7ff53]"
                      >
                        Kelola Profil
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-red-500/10 p-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  {headerSettings.showLogin && (
                    <Link href="/login" className="rounded-xl border border-[#d7ff53]/60 bg-transparent px-4 py-3.5 text-center text-sm font-black uppercase tracking-wider text-[#d7ff53] transition-all duration-200 hover:bg-[#d7ff53]/10 active:scale-95">
                      {headerSettings.loginLabel}
                    </Link>
                  )}
                  {headerSettings.showRegister && (
                    <Link href="/register" className="rounded-xl bg-[#d7ff53] px-4 py-3.5 text-center text-sm font-black uppercase tracking-wider text-black transition-all duration-200 hover:bg-[#c7ef33] active:scale-95">
                      {headerSettings.registerLabel}
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>

    {/* Sub-header search bar — sits below the main navbar, sticks together on scroll */}
    <div className="bg-transparent">
      <form
        action="/products"
        method="GET"
        className="mx-auto flex max-w-md items-center justify-center gap-2 px-4 py-2.5 md:px-8"
      >
        <div className="flex w-full items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 transition focus-within:border-gray-500 focus-within:bg-white dark:border-white/10 dark:bg-white/5 dark:focus-within:border-white/30 dark:focus-within:bg-white/10">
          <Search size={16} className="shrink-0 text-gray-500 dark:text-white/40" />
          <input
            type="text"
            name="q"
            placeholder="Cari produk..."
            aria-label="Search products"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-white/30"
          />
        </div>
      </form>
    </div>
  </div>
  );
}
