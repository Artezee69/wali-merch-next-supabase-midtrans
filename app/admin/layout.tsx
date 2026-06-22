import type { Metadata, Viewport } from "next";

// Mark everything under /admin/ as not indexable by search engines.
// This applies to every descendant route via Next.js metadata inheritance.
// NOTE: We deliberately do NOT call requireAdmin() here. A layout-level guard
// would also protect /admin/login, causing an unauthenticated visitor to be
// redirected to /admin/login, which would then re-trigger the guard — a loop.
// Auth is enforced per-page (server components call requireAdmin() directly)
// and per-API-route (handlers call getAdminContext() / requireAdminApi()).
export const metadata: Metadata = {
  title: "Admin — WALI Merch",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0b0b",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
