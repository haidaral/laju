import { apiMissingAuth, type ApiErrorResponse } from "./laju-api-contracts";
import { auth } from "@clerk/nextjs/server";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_VARS)[number];

export type AuthReadiness = {
  configured: boolean;
  missingEnvVars: RequiredEnvKey[];
};

export function getAuthReadiness(): AuthReadiness {
  const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  return {
    configured: missingEnvVars.length === 0,
    missingEnvVars
  };
}

export function getRequestUserId(request: Request): string | null {
  const fromHeader = request.headers.get("x-laju-user-id")?.trim();
  return fromHeader ? fromHeader : null;
}

export async function getServerUserId(request: Request): Promise<string | null> {
  const clerkAuth = await auth();
  if (clerkAuth.userId) {
    return clerkAuth.userId;
  }
  return getRequestUserId(request);
}

export function authNotConfigured(feature: string, missingEnvVars: string[]): Response {
  return Response.json(
    {
      error: `${feature} is not configured yet. Missing required environment variables for Clerk/Supabase wiring.`,
      code: "not_configured",
      details: { missingEnvVars }
    } satisfies ApiErrorResponse,
    { status: 501 }
  );
}

export async function requireUserContext(request: Request, feature: string): Promise<Response | null> {
  const userId = await getServerUserId(request);
  if (!userId) {
    return apiMissingAuth(feature);
  }
  return null;
}

export async function resolveUserIdOrError(
  request: Request,
  feature: string
): Promise<{ userId: string | null; error: Response | null }> {
  const userId = await getServerUserId(request);
  if (!userId) {
    return { userId: null, error: apiMissingAuth(feature) };
  }
  return { userId, error: null };
}
