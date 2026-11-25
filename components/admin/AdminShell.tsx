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
  ChevronLeft,
  ImageIcon,
  MousePointer,
  Calculator,
  Tag,
  type LucideIcon,
} from "lucide-react";

import "@/components/admin/admin-ui.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Manajemen",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/admin" },
      { href: "/admin/products", label: "Produk", icon: Package, matchPrefix: "/admin/products" },
    ],
  },
  {
    label: "Pesanan",
    items: [
      { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart, matchPrefix: "/admin/orders" },
      { href: "/admin/customers", label: "Customer", icon: Users, matchPrefix: "/admin/customers" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/banners", label: "Banner", icon: ImageIcon, matchPrefix: "/admin/banners" },
      { href: "/admin/popup-ads", label: "Popup Ads", icon: MousePointer, matchPrefix: "/admin/popup-ads" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/admin/finance", label: "Kalkulator HPP", icon: Calculator, matchPrefix: "/admin/finance" },
      { href: "/admin/employee-sales", label: "Penjualan Karyawan", icon: Tag, matchPrefix: "/admin/employee-sales" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/settings", label: "Pengaturan", icon: Settings, matchPrefix: "/admin/settings" },
    ],
  },
];

const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

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
    <div className="flex h-full flex-col bg-white border-r border-[var(--ad-border)]">
      {/* Brand */}
      <div className={`flex items-center justify-between border-b border-[var(--ad-border-soft)] py-4 ${collapsed ? "px-3" : "px-5"}`}>
        <Link href="/admin" className="block" aria-label="WALI Admin">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ad-accent)] text-white shadow-sm">
              <Package size={17} strokeWidth={2.4} />
            </span>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-[15px] font-bold tracking-tight text-[var(--ad-text)]">WALI Merch</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ad-text-3)]">
                  Admin Panel
                </div>
              </div>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[var(--ad-border)] text-[var(--ad-text-3)] transition hover:bg-[var(--ad-surface-2)] hover:text-[var(--ad-text)] lg:flex"
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          <ChevronLeft
            size={15}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-2.5" : "px-3"}`}>
        <ul className="space-y-0.5">
          {NAV_GROUPS.map((group) => (
            <li key={group.label}>
              {!collapsed && (
                <div
                  className={`px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ad-text-3)] ${
                    group === NAV_GROUPS[0] ? "pt-0" : ""
                  }`}
                >
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-2.5 rounded-lg py-2 text-[13.5px] font-medium transition ${
                          collapsed ? "justify-center px-0" : "px-3"
                        } ${
                          active
                            ? "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]"
                            : "text-[var(--ad-text-2)] hover:bg-[var(--ad-surface-2)] hover:text-[var(--ad-text)]"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        {active && !collapsed && (
                          <span
                            aria-hidden
                            className="absolute -left-3 top-1/2 h-[60%] w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[var(--ad-accent)] to-[#8b5cf6]"
                          />
                        )}
                        <Icon size={17} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer — admin info card */}
      <div className={`border-t border-[var(--ad-border-soft)] p-3 ${collapsed ? "px-2.5" : ""}`}>
        {!collapsed ? (
          <div className="ad-inset space-y-2.5 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ad-accent)] to-[#8b5cf6] text-[12px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold leading-tight text-[var(--ad-text)]">
                  {adminName || "Admin"}
                </div>
                <span className="ad-pill ad-pill-accent mt-0.5 !px-1.5 !py-px !text-[9px]">Admin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ad-btn ad-btn-secondary w-full !py-1.5 !text-[12px]"
            >
              <LogOut size={14} strokeWidth={2} />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ad-text-3)] transition hover:bg-[var(--ad-surface-2)] hover:text-[var(--ad-text)]"
              title="Lihat Website"
            >
              <ExternalLink size={15} strokeWidth={2} />
            </Link>
            <div
              title={adminName || "Admin"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ad-accent)] to-[#8b5cf6] text-[11px] font-bold text-white"
            >
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ad-text-3)] transition hover:bg-red-50 hover:text-[var(--ad-red)] disabled:opacity-40"
            >
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="wali-admin min-h-screen">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 lg:block ${
            collapsed ? "w-[76px]" : "w-60"
          }`}
        >
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl">{sidebar}</aside>
          </div>
        )}

        <div className="min-h-screen flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
            {/* 1px indigo→transparent gradient bottom border */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-[var(--ad-accent)] via-[#8b5cf6]/40 to-transparent"
            />
            {/* Mobile: 2 rows */}
            <div className="flex flex-col gap-2.5 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ad-border)] bg-white text-[var(--ad-text-2)] transition active:bg-[var(--ad-surface-2)]"
                    aria-label="Buka menu"
                  >
                    <Menu size={17} />
                  </button>
                  <div className="min-w-0">
                    <div className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ad-text-3)]">
                      Admin / {title}
                    </div>
                    <h1 className="truncate text-[15px] font-bold text-[var(--ad-text)]">
                      {title}
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ad-accent)] text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ad-border)] bg-white text-[var(--ad-text-3)] transition active:bg-red-50 active:text-[var(--ad-red)] disabled:opacity-40"
                    aria-label="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                {subtitle && (
                  <p className="truncate text-[11px] text-[var(--ad-text-3)]">{subtitle}</p>
                )}
                <Link
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--ad-border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--ad-text-2)] transition active:bg-[var(--ad-surface-2)]"
                >
                  <ExternalLink size={11} />
                  Website
                </Link>
              </div>
            </div>

            {/* Desktop: 1 row */}
            <div className="hidden items-center justify-between gap-3 px-5 py-3.5 lg:flex">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ad-text-3)]">
                  Admin / {title}
                </div>
                <h1 className="mt-0.5 truncate text-[17px] font-bold tracking-tight text-[var(--ad-text)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-[var(--ad-text-3)]">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-1.5 rounded-lg border border-[var(--ad-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ad-text-2)] transition hover:bg-[var(--ad-surface-2)] hover:text-[var(--ad-text)] sm:inline-flex"
                >
                  <ExternalLink size={13} />
                  Lihat Website
                </Link>
                <div className="flex items-center gap-2.5 rounded-full border border-[var(--ad-border-soft)] bg-[var(--ad-surface-2)] py-1.5 pl-1.5 pr-3.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ad-accent)] text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-xs font-semibold leading-tight text-[var(--ad-text)]">
                      {adminName || "Admin"}
                    </div>
                    <div className="text-[10px] text-[var(--ad-text-3)]">{adminEmail}</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main
            className="mx-auto max-w-[1400px] px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(79,70,229,0.06) 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
