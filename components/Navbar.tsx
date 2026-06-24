"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useHomepageSettings, resolveHeaderSettings, type HeaderSettings } from "@/hooks/useHomepageSettings";
import LocaleToggle from "@/components/LocaleToggle";

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
};

function buildCustomerNav(header: HeaderSettings): NavItem[] {
  return [
    { href: "/", label: header.menuLabels.home },
    { href: "/products", label: header.menuLabels.products },
    { href: "/track-order", label: header.menuLabels.trackOrder },
    { href: "/cart", label: header.menuLabels.cart },
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

  const items = variant === "admin" ? adminNav : customerNav;
  const brandHref = variant === "admin" ? "/admin" : "/";

  // Customer nav CTA (auth buttons)
  const customerCta = (
    <div className="flex items-center gap-2">
      <LocaleToggle />
      {user && !profileLoading ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 transition hover:border-white/20 hover:bg-white/10"
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10">
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
                <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-white/60">
                  {initials}
                </div>
              )}
            </div>
            <span className="hidden text-sm font-semibold text-white/80 md:inline-block">
              {displayName}
            </span>
            <ChevronDown size={14} className="hidden text-white/40 md:block" />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#151515] p-2 shadow-xl z-20">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/40">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={goToAccount}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
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
              className="rounded-xl border border-[#d7ff53]/60 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d7ff53] transition hover:border-[#d7ff53] hover:bg-[#d7ff53]/10"
            >
              {headerSettings.loginLabel}
            </Link>
          )}
          {headerSettings.showRegister && (
            <Link
              href="/register"
              className="rounded-xl bg-[#d7ff53] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#c7ef33]"
            >
              {headerSettings.registerLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0b0b]/70 backdrop-blur-xl">
      {/* Animated gradient line at the bottom of the navbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden">
        <div
          className="flow-line-bar h-px w-full"
          style={{ height: "1px" }}
        />
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-8">
        {/* Brand — top left: big bold text, subtitle below */}
        <Link href={brandHref} className="shrink-0">
          {headerSettings.logoUrl ? (
            <img
              src={headerSettings.logoUrl}
              alt={headerSettings.logoText}
              className="h-9 w-auto transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="text-base font-black uppercase tracking-[0.22em] text-white transition-colors duration-300 group-hover:text-[#d7ff53] md:text-lg">
                {headerSettings.logoText}
              </div>
              {headerSettings.showSubtitle && (
                <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                  {headerSettings.logoSubtitle}
                </div>
              )}
            </>
          )}
        </Link>

        {/* Center nav links */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex">
          {items.map((item) => {
            const active = isItemActive(item, activeKey, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative transition hover:text-white ${
                  active ? "text-[#d7ff53]" : ""
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute -bottom-[14px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#d7ff53]"
                    style={{ boxShadow: "0 0 8px rgba(215,255,83,0.6)" }}
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#d7ff53] hover:text-[#d7ff53] md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="animate-slide-down-spring border-t border-white/10 bg-[#0b0b0b] md:hidden"
          style={{ transformOrigin: "top" }}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-wider transition ${
                  isItemActive(item, activeKey, pathname)
                    ? "bg-[#d7ff53] text-black"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {mobileExtras && (
              <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
                {mobileExtras}
              </div>
            )}

            {/* Mobile auth CTA */}
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-4">
              <div className="flex justify-center">
                <LocaleToggle />
              </div>
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
  );
}
