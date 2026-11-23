import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rupiah } from "@/lib/format";
import AdminShell from "@/components/admin/AdminShell";
import { AdminCard, EmptyState, Pill } from "@/components/admin/ui";
import { Mail, Phone, Search, ShieldCheck, Users } from "lucide-react";

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
    <AdminShell
      title="Customer"
      subtitle="Daftar akun customer terdaftar"
      adminName={session.fullName}
      adminEmail={session.email}
    >
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ad-text-3)]">
          Admin / Customer
        </p>

        <AdminCard style={{ background: "linear-gradient(to right, #ffffff, #f9fafb)" }}>
          <form className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ad-text-3)]"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama, email, atau nomor HP…"
              className="ad-input !rounded-lg pl-9"
            />
          </form>
        </AdminCard>

        {error ? (
          <div className="ad-alert ad-alert-error">
            Gagal memuat customer: {error.message}
          </div>
        ) : customers.length === 0 ? (
          <AdminCard>
            <EmptyState
              icon={<Users size={20} />}
              title="Tidak ada customer"
              description="Coba ubah pencarian."
            />
          </AdminCard>
        ) : (
          <AdminCard padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ad-table w-full">
                <thead>
                  <tr className="bg-[var(--ad-surface-2)]">
                    <th>Customer</th>
                    <th className="hidden md:table-cell">Kontak</th>
                    <th className="text-center">Pesanan</th>
                    <th className="text-right">Total</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const stats = orderMap.get(c.id) ?? { count: 0, total: 0 };
                    return (
                      <tr key={c.id}>
                        <td>
                          <p className="font-semibold text-[var(--ad-text)]">{c.full_name}</p>
                          {c.role === "admin" && (
                            <span className="ad-pill ad-pill-accent mt-1.5">
                              <ShieldCheck size={10} /> Admin
                            </span>
                          )}
                        </td>
                        <td className="hidden md:table-cell">
                          <p className="flex items-center gap-1.5 text-[12px]">
                            <Mail size={11} className="text-[var(--ad-text-3)]" />
                            {c.email}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                            <Phone size={11} className="text-[var(--ad-text-3)]" />
                            {c.phone}
                          </p>
                        </td>
                        <td className="text-center font-semibold text-[var(--ad-text)]">
                          {stats.count}
                        </td>
                        <td className="text-right font-bold text-[var(--ad-accent)]">
                          {rupiah(stats.total)}
                        </td>
                        <td>
                          <Pill tone={c.is_email_verified ? "green" : "amber"}>
                            {c.is_email_verified ? "Verified" : "Unverified"}
                          </Pill>
                        </td>
                        <td className="hidden text-[11.5px] sm:table-cell">
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
          </AdminCard>
        )}

        <p className="text-[11.5px] text-[var(--ad-text-3)]">
          Untuk alasan keamanan, password customer tidak pernah ditampilkan
          atau dikirim ke admin.
        </p>
      </div>
    </AdminShell>
  );
}
