import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_DB_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  SENTRY_DSN: z.string().min(1),
  SUPER_ADMIN_BOOTSTRAP_EMAIL: z.email(),
  SUPER_ADMIN_BOOTSTRAP_PASSWORD: z.string().min(12),
  SUPER_ADMIN_BOOTSTRAP_NAME: z.string().min(1),
  SUPER_ADMIN_BOOTSTRAP_2FA_REQUIRED: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatEnvError(error: z.ZodError): Error {
  const missingOrInvalid = error.issues.map((issue) => issue.path.join(".")).join(", ");
  return new Error(`Invalid environment configuration: ${missingOrInvalid}`);
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw formatEnvError(parsed.error);
  }

  return parsed.data;
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw formatEnvError(parsed.error);
  }

  return parsed.data;
}
