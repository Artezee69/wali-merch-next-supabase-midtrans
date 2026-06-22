import { supabaseAdmin } from "./supabaseAdmin";

export type AdminAuditAction =
  | "order.updated"
  | "order.status_changed"
  | "order.tracking_changed"
  | "order.deleted"
  | "product.created"
  | "product.updated"
  | "product.status_changed"
  | "product.deleted"
  | "product.duplicated"
  | "product.bulk_status_changed"
  | "product.bulk_deleted"
  | "product.images_updated"
  | "product.variants_updated"
  | "product.variants_bulk_update"
  | "customer.role_changed"
  | "settings.updated"
  | "homepage.updated"
  // Auth lifecycle events. `entity` is "admin_auth" for these, and
  // `entityId` is either the user id (login success) or a placeholder
  // like "unknown" / email (login failure). actor_id may be null for
  // failed logins where we couldn't resolve a user.
  | "auth.login_succeeded"
  | "auth.login_failed"
  | "auth.logout";

type AuditInput = {
  /**
   * Acting profile id. Nullable for failed-login events where the
   * attacker never resolved to a known user.
   */
  actorId: string | null;
  actorEmail?: string | null;
  action: AdminAuditAction;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Write a row to admin_audit_log. Failures are logged but
 * never throw — audit logging must not break the primary
 * operation.
 *
 * IMPORTANT: never pass passwords, tokens, or secrets in
 * any of the fields.
 */
export async function logAdminAction(input: AuditInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: input.actorId,
      actor_email: input.actorEmail ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      before_data: input.before ?? null,
      after_data: input.after ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("[adminAudit] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[adminAudit] unexpected error:", err);
  }
}
