import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/serverAuth";

export type AdminUser = CurrentUser & { role: "admin" };

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login?reason=session");
  }
  if (user.role !== "admin") {
    redirect("/admin/login?reason=not_admin");
  }
  return user as AdminUser;
}

export async function maybeAdmin(): Promise<AdminUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user as AdminUser;
}
