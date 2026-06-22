import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";

export async function requireAdminApi(): Promise<
  { ok: true; user: { id: string; email: string | null } } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Akun ini tidak memiliki akses admin." },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user: { id: user.id, email: user.email } };
}
