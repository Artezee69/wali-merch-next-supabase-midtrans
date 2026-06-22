import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, AlertCircle, Globe, Package, ShoppingCart, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <Navbar activeKey="admin" variant="admin" />
      <section className="relative flex min-h-[calc(100vh-200px)] items-center overflow-hidden px-4 py-12 sm:px-8 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#d7ff532e,transparent_40%),radial-gradient(circle_at_bottom_right,#ff3b3033,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,#0b0b0b_92%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-12">
          <div>
            <Link href="/" className="mb-8 inline-block">
              <div className="text-xl font-black tracking-[0.35em]">WALI</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">
                Official Merchandise
              </div>
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-[#d7ff53]">
              <Lock size={12} strokeWidth={3} />
              Admin Login
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.9] sm:text-5xl md:text-7xl">
              Control
              <span className="block text-[#d7ff53]">Your Store</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:mt-6 sm:text-base sm:leading-8 md:text-lg md:leading-9">
              Login admin untuk mengatur katalog merchandise, stok size, harga
              produk, foto, status pesanan, dan data order customer.
            </p>

            <div className="mt-6 grid max-w-sm gap-3 sm:mt-8 sm:max-w-md sm:grid-cols-3">
              {[
                { icon: Package, label: "Produk" },
                { icon: ShieldCheck, label: "Stok" },
                { icon: ShoppingCart, label: "Orders" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center transition hover:border-[#d7ff53]/30 sm:rounded-2xl sm:p-4"
                  >
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#d7ff53] sm:h-12 sm:w-12 sm:rounded-xl">
                      <Icon size={16} strokeWidth={2.5} className="sm:hidden" />
                      <Icon size={20} strokeWidth={2.5} className="hidden sm:block" />
                    </div>
                    <p className="text-[10px] font-black uppercase sm:text-xs">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem] sm:p-5">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:rounded-[2rem] sm:p-8">
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff53]">
                  <Lock size={10} strokeWidth={2.5} />
                  Secure Access
                </div>
                <h2 className="text-2xl font-black uppercase sm:text-3xl">
                  Login Admin
                </h2>
                <p className="mt-2 text-xs leading-6 text-white/50 sm:mt-3 sm:text-sm sm:leading-7">
                  Masukkan email dan password admin Supabase untuk masuk ke
                  dashboard.
                </p>
              </div>

              {reason && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-200 sm:mb-5 sm:rounded-2xl sm:p-4 sm:text-sm">
                  <AlertCircle size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              )}

              <LoginForm initialError={error} />
            </div>
          </div>
        </div>
      </section>
      <Footer variant="admin" />
    </main>
  );
}
