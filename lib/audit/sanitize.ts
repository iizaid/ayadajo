import { z } from "zod";

const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const phonePattern = /(?:\+?\d[\s-]?){8,}/;

export const auditSummarySchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .refine((value) => !emailPattern.test(value), "Audit summaries must not include email addresses.")
  .refine((value) => !phonePattern.test(value), "Audit summaries must not include phone numbers.");

export function sanitizeAuditSummary(summary: string): string {
  return auditSummarySchema.parse(summary);
}
