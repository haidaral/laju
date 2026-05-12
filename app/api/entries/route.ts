import { authNotConfigured, getAuthReadiness, requireUserContext } from "../../lib/laju-server-boundary";

export async function GET(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entries API", readiness.missingEnvVars);
  }
  const authError = await requireUserContext(request, "Entries API");
  if (authError) return authError;
  return Response.json({ error: "Entries API is auth-ready but data persistence is not wired yet.", code: "not_configured" }, { status: 501 });
}

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entries API", readiness.missingEnvVars);
  }
  const authError = await requireUserContext(request, "Entries API");
  if (authError) return authError;
  return Response.json({ error: "Entries API is auth-ready but data persistence is not wired yet.", code: "not_configured" }, { status: 501 });
}
