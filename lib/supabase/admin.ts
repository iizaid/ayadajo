import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

const serviceRoleSchema = z.string().min(1);

export function createAdminSupabaseClient() {
  const env = getPublicEnv();

  /*
   * SERVER-ONLY AND DANGEROUS:
   * The Supabase service-role key bypasses RLS.
   * This factory is for Super Admin and trusted background job code only.
   * Never import this file from client components, clinic-user routes, or user-scoped actions.
   */
  const serviceRoleKey = serviceRoleSchema.parse(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
