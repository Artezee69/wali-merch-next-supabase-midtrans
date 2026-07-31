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

  const { itemCount } = useCart();
  const customerCta = (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Cart icon */}
      <Link href="/cart" className="relative p-2 text-gray-600 dark:text-white hover:text-[#d7ff53] transition">
        <ShoppingCart size={20} className="sm:size-[22]" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-[#d7ff53] text-[9px] font-bold text-black sm:text-[10px]">
            {itemCount}
          </span>
        )}
      </Link>
      {user && !profileLoading ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-white/20 bg-white/5 dark:bg-white/10 px-2 py-1.5 transition hover:border-[#d7ff53]/50 hover:bg-white/10 dark:hover:bg-white/20"
          >
            <div className="relative h-6 w-6 sm:h-7 sm:w-7 shrink-0 overflow-hidden rounded-full bg-white/10">
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
                <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-white/70">
                  {initials}
                </div>
              )}
            </div>
            <span className="hidden text-sm font-semibold text-white sm:inline-block">
              {displayName}
            </span>
            <ChevronDown size={14} className="hidden text-white/60 sm:block" />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-2 shadow-2xl z-20 border border-white/10 bg-gray-900/95 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/50">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={goToAccount}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition"
              >
                <User size={15} />
                Profil Saya
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
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
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#d7ff53] hover:text-[#d7ff53]"
            >
              {headerSettings.loginLabel}
            </Link>
          )}
          {headerSettings.showRegister && (
            <Link
              href="/register"
              className="rounded-xl bg-[#d7ff53] px-3 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#c7ef33]"
            >
              {headerSettings.registerLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );

  const items = variant === "admin" ? adminNav : customerNav;
  const brandHref = variant === "admin" ? "/admin" : "/";

  return (
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
      <header>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 md:px-8 md:py-4">
          {/* Brand */}
          <Link href={brandHref} className="shrink-0">
            {headerSettings.logoUrl ? (
              <img
                src={headerSettings.logoUrl}
                alt={headerSettings.logoText}
                className="h-8 w-auto sm:h-9 transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:text-[#d7ff53] sm:text-lg">
                  {headerSettings.logoText}
                </div>
                {headerSettings.showSubtitle && (
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                    {headerSettings.logoSubtitle}
                  </div>
                )}
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {items.map((item) => {
              const active = isItemActive(item, activeKey, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-[#d7ff53] ${
                    active ? "text-[#d7ff53]" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute -bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#d7ff53]" />
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-[#d7ff53] hover:bg-[#d7ff53]/10 hover:text-[#d7ff53] md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} className="text-white" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <nav className="mx-auto max-w-7xl flex-col gap-1 px-4 py-4">
              {/* Search */}
              <form
                action="/products"
                method="GET"
                className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <Search size={16} className="text-white/40" />
                <input
                  type="text"
                  name="q"
                  placeholder="Cari produk..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </form>

              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition ${
                    isItemActive(item, activeKey, pathname)
                      ? "bg-[#d7ff53] text-black"
                      : "text-white/80 hover:bg-white/5 hover:text-[#d7ff53]"
                  }`}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}

              {/* Cart */}
              <Link
                href="/cart"
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition ${
                  pathname === "/cart"
                    ? "bg-[#d7ff53] text-black"
                    : "text-white/80 hover:bg-white/5 hover:text-[#d7ff53]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShoppingCart size={16} />
                  {headerSettings.menuLabels.cart}
                </span>
                {itemCount > 0 && (
                  <span className={`flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold ${
                    pathname === "/cart" ? "bg-black text-[#d7ff53]" : "bg-[#d7ff53] text-black"
                  }`}>
                    {itemCount}
                  </span>
                )}
              </Link>

              {mobileExtras && (
                <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
                  {mobileExtras}
                </div>
              )}

              {/* Auth */}
              <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
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
                      <Link href="/login" className="rounded-xl border border-[#d7ff53]/60 bg-transparent px-4 py-3 text-center text-sm font-bold text-[#d7ff53] transition hover:bg-[#d7ff53]/10">
                        {headerSettings.loginLabel}
                      </Link>
                    )}
                    {headerSettings.showRegister && (
                      <Link href="/register" className="rounded-xl bg-[#d7ff53] px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-[#c7ef33]">
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
    </div>
  );
}
