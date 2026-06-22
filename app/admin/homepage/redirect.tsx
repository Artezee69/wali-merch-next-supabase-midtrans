import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function HomepageRedirect(): ReactNode {
  redirect("/admin/settings?tab=homepage_latest_drop");
  return null;
}
