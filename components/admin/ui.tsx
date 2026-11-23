"use client";

/**
 * Shared admin UI primitives — the light SaaS design system.
 * Wrap admin page content in <AdminCard> / use <AdminButton>, <Pill> etc.
 * All styling lives in admin-ui.css (loaded once from AdminShell).
 */

import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import "@/components/admin/admin-ui.css";

/* ============== Card ============== */

export function AdminCard({
  children,
  className = "",
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`ad-card ${padded ? "p-4 sm:p-5" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--ad-border-soft)] pb-3.5 sm:pb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold leading-tight text-[var(--ad-text)]">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 truncate text-xs text-[var(--ad-text-3)]">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============== Buttons ============== */

export function AdminButton({
  children,
  variant = "primary",
  size,
  icon,
  className = "",
  ...props
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "dangerOutline";
  size?: "sm";
  icon?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const base = `ad-btn ad-btn-${variant}`;
  const sizeCls = size === "sm" ? "ad-btn-sm" : "";
  const iconCls = icon ? "ad-btn-icon" : "";
  return (
    <button className={`${base} ${sizeCls} ${iconCls} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AdminLink({
  children,
  variant = "primary",
  size,
  icon,
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "dangerOutline";
  size?: "sm";
  icon?: boolean;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className">) {
  const base = `ad-btn ad-btn-${variant}`;
  const sizeCls = size === "sm" ? "ad-btn-sm" : "";
  const iconCls = icon ? "ad-btn-icon" : "";
  return (
    <Link className={`${base} ${sizeCls} ${iconCls} ${className}`} {...(props as any)}>
      {children}
    </Link>
  );
}

/* ============== Pills / badges ============== */

export type PillTone = "neutral" | "green" | "amber" | "red" | "blue" | "accent";

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  return <span className={`ad-pill ad-pill-${tone}`}>{children}</span>;
}

/* ============== Alerts ============== */

export function Alert({
  children,
  tone = "error",
  onClose,
}: {
  children: ReactNode;
  tone?: "error" | "success" | "warn" | "info";
  onClose?: () => void;
}) {
  return (
    <div className={`ad-alert ad-alert-${tone}`}>
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-[var(--ad-text-3)] transition hover:text-[var(--ad-text)]"
          aria-label="Tutup"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ============== Field ============== */

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="ad-label">
        <span>
          {label}
          {required && <span className="ml-0.5 text-[var(--ad-red)]">*</span>}
        </span>
        {hint && <span className="ad-hint">{hint}</span>}
      </label>
      {children}
      {error && <p className="ad-error-text">{error}</p>}
    </div>
  );
}

/* ============== Toggle ============== */

export function Toggle({
  value,
  onChange,
  label,
  hint,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="ad-inset flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        {label && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-2)]">
            {label}
          </p>
        )}
        {hint && <p className="mt-0.5 text-[11px] text-[var(--ad-text-3)]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`ad-toggle ${value ? "on" : "off"}`}
      />
    </div>
  );
}

/* ============== Section (collapsible card) ============== */

export function Section({
  title,
  icon,
  open,
  onToggle,
  badge,
  errorCount,
  accent,
  children,
}: {
  title: string;
  icon?: ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: string;
  errorCount?: number;
  /** Hex color for the 4px left accent bar on the section card. */
  accent?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="ad-card overflow-hidden"
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition hover:bg-[var(--ad-surface-2)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
              {icon}
            </span>
          )}
          <h2 className="truncate text-[13px] font-semibold text-[var(--ad-text)]">
            {title}
          </h2>
          {badge && (
            <span className="ad-pill ad-pill-neutral">{badge}</span>
          )}
          {errorCount != null && errorCount > 0 && (
            <span className="ad-pill ad-pill-red">{errorCount} error</span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[var(--ad-text-3)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="border-t border-[var(--ad-border-soft)] p-4 sm:p-5">{children}</div>}
    </div>
  );
}

/* ============== Empty state ============== */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ad-surface-2)] text-[var(--ad-text-3)]">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--ad-text)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--ad-text-3)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
