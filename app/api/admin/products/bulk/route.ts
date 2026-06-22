import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getAdminContext, isResponse } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction } from "@/lib/adminAudit";

// POST /api/admin/products/bulk — bulk actions (activate, deactivate, archive, delete)
export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (isResponse(admin)) return admin;
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ids } = body as { action?: string; ids?: string[] };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Aksi dan id produk wajib diisi" },
        { status: 400 }
      );
    }

    if (!["activate", "deactivate", "archive", "delete", "feature", "unfeature"].includes(action)) {
      return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
    }

    if (action === "delete") {
      // Check each product for order history
      const results = { hard_deleted: 0, soft_deleted: 0, failed: 0 };
      for (const id of ids) {
        const { count: oiCount } = await supabaseAdmin
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .eq("product_id", id);

        if ((oiCount ?? 0) > 0) {
          const { error } = await supabaseAdmin
            .from("products")
            .update({ is_active: false, status: "inactive" })
            .eq("id", id);
          if (error) {
            results.failed++;
          } else {
            results.soft_deleted++;
          }
        } else {
          const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
          if (error) {
            results.failed++;
          } else {
            results.hard_deleted++;
          }
        }
      }

      await logAdminAction({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "product.deleted",
        entity: "product",
        metadata: { bulk: true, count: ids.length, results },
      });

      return NextResponse.json({ success: true, results });
    }

    if (action === "activate") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: true, status: "active" })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: "Gagal mengaktifkan produk", details: error.message }, { status: 500 });
      }
    } else if (action === "deactivate") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false, status: "inactive" })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: "Gagal menonaktifkan produk", details: error.message }, { status: 500 });
      }
    } else if (action === "archive") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false, status: "archived" })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: "Gagal mengarsipkan produk", details: error.message }, { status: 500 });
      }
    } else if (action === "feature") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_featured: true })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: "Gagal menandai produk", details: error.message }, { status: 500 });
      }
    } else if (action === "unfeature") {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_featured: false })
        .in("id", ids);

      if (error) {
        return NextResponse.json({ error: "Gagal menghapus tanda produk", details: error.message }, { status: 500 });
      }
    }

    await logAdminAction({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "product.updated",
      entity: "product",
      metadata: { bulk: true, action, count: ids.length },
    });

    return NextResponse.json({ success: true, affected: ids.length });
  } catch (err) {
    console.error("[API /api/admin/products/bulk] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
