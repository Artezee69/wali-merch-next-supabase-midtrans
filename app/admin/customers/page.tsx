import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rupiah } from "@/lib/format";
import AdminShell from "@/components/admin/AdminShell";
import { Search, Users, ShieldCheck, Mail, Phone } from "lucide-react";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_email_verified: boolean | null;
  created_at: string;
  orders?: { total_amount: number; payment_status: string }[] | null;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const q = (params?.q ?? "").trim();

  // Server-side auth: use the admin's own auth to get user email
  // verification status. We fetch the base profile data via
  // service role only for administrative data the admin already
  // has access to by policy (read all customer rows).
  const {
    data: { users },
  } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  const emailVerified = new Set(
    users.filter((u) => !!u.email_confirmed_at).map((u) => u.id)
  );

  let query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, role, is_email_verified, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data: profiles, error } = await query;
  const customers: CustomerRow[] = ((profiles ?? []) as CustomerRow[]).map(
    (c) => ({
      ...c,
      is_email_verified: c.is_email_verified ?? emailVerified.has(c.id),
    })
  );

  // Per-customer order totals.
  const { data: orderStats } = await supabaseAdmin
    .from("orders")
    .select("user_id, total_amount, payment_status")
    .not("user_id", "is", null);

  const orderMap = new Map<string, { count: number; total: number }>();
  (orderStats ?? []).forEach((o) => {
    if (!o.user_id) return;
    const cur = orderMap.get(o.user_id) ?? { count: 0, total: 0 };
    cur.count += 1;
    if (o.payment_status === "paid") {
      cur.total += Number(o.total_amount || 0);
    }
    orderMap.set(o.user_id, cur);
  });

  return (
    <AdminShell title="Customer" adminName={session.fullName} adminEmail={session.email}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7ff53]">
            Manajemen
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Customer
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Daftar akun customer terdaftar.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <form>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama, email, atau nomor HP..."
              className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#d7ff53]"
            />
          </div>
        </form>
      </section>

      <section className="mt-6">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm font-bold text-red-300">
            Gagal memuat customer: {error.message}
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/50">
              <Users size={20} />
            </div>
            <h3 className="text-base font-black uppercase">Tidak ada customer</h3>
            <p className="mt-1 text-xs text-white/45">
              Coba ubah pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3">Kontak</th>
                    <th className="px-3 py-3 text-center">Pesanan</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const stats = orderMap.get(c.id) ?? { count: 0, total: 0 };
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{c.full_name}</p>
                          {c.role === "admin" && (
                            <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#d7ff53]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#d7ff53]">
                              <ShieldCheck size={10} /> Admin
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-white/75">
                          <p className="flex items-center gap-1.5 text-[11px]">
                            <Mail size={10} className="text-white/40" />
                            {c.email}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                            <Phone size={10} className="text-white/40" />
                            {c.phone}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-white/85">
                          {stats.count}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-[#d7ff53]">
                          {rupiah(stats.total)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              c.is_email_verified
                                ? "bg-[#d7ff53]/15 text-[#d7ff53] border-[#d7ff53]/30"
                                : "bg-yellow-400/15 text-yellow-300 border-yellow-400/30"
                            }`}
                          >
                            {c.is_email_verified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-white/55">
                          {new Date(c.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-white/35">
          Untuk alasan keamanan, password customer tidak pernah ditampilkan
          atau dikirim ke admin.
        </p>
      </section>
    </AdminShell>
  );
}
