import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  Globe,
  Lock,
  Package,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { getCurrentUser } from "@/lib/serverAuth";
import LoginForm from "@/components/admin/LoginForm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Login Admin — WALI Merch",
};

const REASON_MESSAGES: Record<string, string> = {
  session: "Sesi kamu telah berakhir. Silakan login kembali.",
  not_admin: "Akun ini tidak memiliki akses admin.",
  logged_out: "Kamu telah logout dari panel admin.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string; error?: string }>;
}) {
  const params = await searchParams;
  const reasonKey = params?.reason;
  const reason = reasonKey ? REASON_MESSAGES[reasonKey] ?? "" : "";
  const error = params?.error ? decodeURIComponent(params.error) : "";

  const user = await getCurrentUser();
  console.log("Admin server auth", {
    hasUser: Boolean(user),
    role: user?.role ?? null,
  });
  if (user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="wali-admin min-h-screen !bg-white text-[var(--ad-text)]">
      <Navbar activeKey="admin" variant="admin" />
      <section
        className="relative flex min-h-[calc(100vh-200px)] items-center overflow-hidden px-4 py-12 sm:px-8 sm:py-16"
        style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)" }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(79,70,229,0.10) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-12">
          <div>
            <Link href="/" className="mb-7 inline-block">
              <div
                className="text-[26px] font-bold tracking-[0.3em] text-[var(--ad-text)] sm:text-[30px]"
                style={{ textShadow: "0 0 24px rgba(79,70,229,0.45)" }}
              >
                WALI
              </div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--ad-text-3)]">
                Official Merchandise
              </div>
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-[var(--ad-accent-soft)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ad-accent)]">
              <Lock size={12} strokeWidth={2.5} />
              Admin Login
            </div>

            <h1 className="text-4xl font-bold leading-[1.02] tracking-tight text-[var(--ad-text)] sm:text-5xl md:text-6xl">
              Kelola Toko
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Dengan Mudah
              </span>
            </h1>

            <p className="mt-4 max-w-md text-[14px] leading-7 text-[var(--ad-text-2)] sm:mt-5">
              Login admin untuk mengatur katalog merchandise, stok size,
              harga produk, foto, status pesanan, dan data order customer.
            </p>

            <div className="mt-6 grid max-w-sm gap-3 sm:mt-7 sm:max-w-md sm:grid-cols-3">
              {[
                { icon: Package, label: "Produk" },
                { icon: ShieldCheck, label: "Stok" },
                { icon: ShoppingCart, label: "Orders" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="ad-card p-3.5 text-center transition hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)] sm:p-4"
                  >
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ad-accent-soft)] text-[var(--ad-accent)] sm:h-11 sm:w-11">
                      <Icon size={17} strokeWidth={2.2} />
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--ad-text-2)]">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ad-card mx-auto w-full !p-5 sm:!p-6 !shadow-[0_16px_40px_-12px_rgba(16,24,40,0.15)] sm:!rounded-[20px] lg:mx-0 lg:w-auto max-w-md lg:max-w-none">
            <div className="mb-5">
              <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#c7d2fe] bg-[var(--ad-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ad-accent)]">
                <Lock size={10} strokeWidth={2.5} />
                Secure Access
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-[var(--ad-text)] sm:text-2xl">
                Login Admin
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--ad-text-3)]">
                Masukkan email dan password admin Supabase untuk masuk ke
                dashboard.
              </p>
            </div>

            {reason && (
              <div className="ad-alert ad-alert-warn mb-4">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{reason}</span>
              </div>
            )}

            <LoginForm initialError={error} />
          </div>
        </div>
      </section>
      <Footer variant="admin" />
    </main>
  );
}
