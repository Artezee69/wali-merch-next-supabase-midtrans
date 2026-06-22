import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";

type Params = { id: string };

export default async function ProductDetailRedirect({ params }: { params: Promise<Params> }) {
  await requireAdmin();
  const { id } = await params;
  redirect(`/admin/products/${id}/edit`);
}
