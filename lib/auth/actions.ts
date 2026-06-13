"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashRateLimitKey, checkRateLimit } from "@/lib/ratelimit";
import { createUserScopedSupabaseClient } from "@/lib/supabase/server";
import { ACTIVE_CLINIC_COOKIE, getCurrentAuthSession } from "./session";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(10).max(128);

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

async function requestIpHash(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "local";
}

async function checkAuthRateLimit(scope: string, email: string): Promise<boolean> {
  const ip = await requestIpHash();
  const key = hashRateLimitKey(scope, `${email}:${ip}`);
  const decision = checkRateLimit(key, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 8,
  });

  return decision.allowed;
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));

  if (!email.success || !password.success) {
    redirect("/login?status=invalid");
  }

  if (!(await checkAuthRateLimit("login", email.data))) {
    redirect("/login?status=limited");
  }

  const supabase = await createUserScopedSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });

  if (error) {
    redirect("/login?status=invalid");
  }

  const session = await getCurrentAuthSession();

  if (session?.requiresClinicSelection || (session?.activeMemberships.length ?? 0) > 1) {
    redirect("/choose-clinic");
  }

  redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = emailSchema.safeParse(formData.get("email"));

  if (!email.success) {
    redirect("/forgot?status=sent");
  }

  if (!(await checkAuthRateLimit("forgot-password", email.data))) {
    redirect("/forgot?status=sent");
  }

  const supabase = await createUserScopedSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl()}/reset`,
  });

  redirect("/forgot?status=sent");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createUserScopedSupabaseClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CLINIC_COOKIE);

  redirect("/login?status=signed-out");
}

export async function chooseClinicAction(formData: FormData): Promise<void> {
  const clinicId = z.string().uuid().safeParse(formData.get("clinicId"));

  if (!clinicId.success) {
    redirect("/choose-clinic?status=invalid");
  }

  const session = await getCurrentAuthSession();
  const membership = session?.activeMemberships.find(
    (candidate) => candidate.clinicId === clinicId.data,
  );

  if (!session) {
    redirect("/login");
  }

  if (!membership) {
    redirect("/choose-clinic?status=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CLINIC_COOKIE, membership.clinicId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/");
}
