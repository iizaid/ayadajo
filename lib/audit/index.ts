import "server-only";

import { createUserScopedSupabaseClient } from "@/lib/supabase/server";
import { sanitizeAuditSummary } from "./sanitize";

export type AuditEntryInput = {
  clinicId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary: string;
  ip?: string | null;
};

export type AuditWriteResult =
  | { ok: true }
  | { ok: false; reason: "rls_rejected" | "invalid_summary" | "write_failed" };

type QueryError = {
  message: string;
};

type AuditInsert = {
  clinic_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  ip: string | null;
};

type AuditInsertQuery = {
  insert(values: AuditInsert): Promise<{ error: QueryError | null }>;
};

function createAuditQuery(
  supabase: Awaited<ReturnType<typeof createUserScopedSupabaseClient>>,
): AuditInsertQuery {
  return (supabase.from as unknown as (table: "audit_logs") => AuditInsertQuery)("audit_logs");
}

export async function writeAuditLog(input: AuditEntryInput): Promise<AuditWriteResult> {
  let summary: string;

  try {
    summary = sanitizeAuditSummary(input.summary);
  } catch {
    return { ok: false, reason: "invalid_summary" };
  }

  const supabase = await createUserScopedSupabaseClient();
  const { error } = await createAuditQuery(supabase).insert({
    clinic_id: input.clinicId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    summary,
    ip: input.ip ?? null,
  });

  if (!error) {
    return { ok: true };
  }

  return error.message.toLowerCase().includes("row-level security")
    ? { ok: false, reason: "rls_rejected" }
    : { ok: false, reason: "write_failed" };
}
