import { authNotConfigured, getAuthReadiness, requireUserContext } from "../../../lib/laju-server-boundary";

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry status API", readiness.missingEnvVars);
  }
  const authError = requireUserContext(request, "Entry status API");
  if (authError) return authError;
  return Response.json({ error: "Entry status API is auth-ready but data persistence is not wired yet.", code: "not_configured" }, { status: 501 });
}
