import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

export type AuditAction =
  | "order.status.update"
  | "order.resi.update"
  | "order.cancel"
  | "product.create"
  | "product.update"
  | "product.toggle_active"
  | "product.soft_delete"
  | "product.stock.update"
  | "product.price.update"
  | "customer.role.update"
  | "store_settings.update";

export type WriteAuditLogInput = {
  actorId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

const FORBIDDEN_KEYS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "service_role",
  "api_key",
  "authorization",
];

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.some((f) => k.toLowerCase().includes(f))) {
        out[k] = "[redacted]";
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  if (typeof value === "string") {
    if (value.length > 2000) return value.slice(0, 2000) + "…";
    return value;
  }
  return value;
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  try {
    const { error } = await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: input.actorId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      before: input.before ? (redact(input.before) as never) : null,
      after: input.after ? (redact(input.after) as never) : null,
      metadata: input.metadata ? (redact(input.metadata) as never) : null,
    });
    if (error) {
      console.error("[auditLog] insert failed", error.message);
    }
  } catch (e) {
    console.error("[auditLog] unexpected error", e);
  }
}
