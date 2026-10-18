"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ImageIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  matchPrefix?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/admin" },
  { href: "/admin/products", label: "Produk", icon: Package, matchPrefix: "/admin/products" },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart, matchPrefix: "/admin/orders" },
  { href: "/admin/customers", label: "Customer", icon: Users, matchPrefix: "/admin/customers" },
  { href: "/admin/banners", label: "Banner", icon: ImageIcon, matchPrefix: "/admin/banners" },
  { href: "/admin/popup-ads", label: "Popup Ads", icon: ImageIcon, matchPrefix: "/admin/popup-ads" },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings, matchPrefix: "/admin/settings" },
];

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === item.href || pathname.startsWith(item.matchPrefix + "/");
}

function getInitials(name: string | null, email: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "A";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export type AdminShellProps = {
  title: string;
  subtitle?: string;
  adminName: string | null;
  adminEmail: string | null;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  subtitle,
  adminName,
  adminEmail,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const initials = useMemo(
    () => getInitials(adminName, adminEmail),
    [adminName, adminEmail]
  );

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="block">
          <div className="text-lg font-black tracking-[0.3em] text-white">WALI</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7ff53]">
            Admin Panel
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white lg:flex"
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          <ChevronLeft
            size={16}
            strokeWidth={2.5}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                    active
                      ? "border border-[#d7ff53]/40 bg-[#d7ff53]/10 text-[#d7ff53]"
                      : "border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} strokeWidth={2.2} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/70 transition hover:border hover:border-white/10 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} strokeWidth={2.2} className="shrink-0" />
          {!collapsed && <span>Lihat Website</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white/70 transition hover:border hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={18} strokeWidth={2.2} className="shrink-0" />
          {!collapsed && (
            <span>{loggingOut ? "Logging out…" : "Logout"}</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 lg:block ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72">{sidebar}</aside>
          </div>
        )}

        <div className="min-h-screen flex-1">
          {/* Topbar — 2-row on mobile, 1-row on desktop */}
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a] sm:bg-[#0a0a0a]/90 sm:backdrop-blur">
            {/* Mobile: 2 rows */}
            <div className="flex flex-col gap-2 px-4 py-3 lg:hidden">
              {/* Row 1: hamburger + title | avatar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 transition active:bg-white/10"
                    aria-label="Buka menu"
                  >
                    <Menu size={18} strokeWidth={2.2} />
                  </button>
                  <h1 className="truncate text-base font-black uppercase tracking-tight">
                    {title}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d7ff53] text-xs font-black text-black">
                    {initials}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition active:bg-red-500/10 active:text-red-300 disabled:opacity-40"
                    aria-label="Logout"
                  >
                    <LogOut size={15} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
              {/* Row 2: subtitle + website link */}
              <div className="flex items-center justify-between gap-2">
                {subtitle && (
                  <p className="truncate text-[11px] text-white/40">{subtitle}</p>
                )}
                <Link
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/50 transition active:bg-white/5"
                >
                  <ExternalLink size={11} strokeWidth={2.2} />
                  Website
                </Link>
              </div>
            </div>

            {/* Desktop: 1 row */}
            <div className="hidden items-center justify-between gap-3 px-6 py-4 lg:flex">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black uppercase tracking-tight sm:text-xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-white/50 sm:text-sm">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/70 transition hover:border-white/30 hover:text-white sm:inline-flex"
                >
                  <ExternalLink size={14} strokeWidth={2.2} />
                  Lihat Website
                </Link>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7ff53] text-xs font-black text-black">
                    {initials}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-xs font-bold text-white">
                      {adminName || "Admin"}
                    </div>
                    <div className="text-[10px] text-white/50">{adminEmail}</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-3 py-4 sm:px-6 sm:py-6 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
