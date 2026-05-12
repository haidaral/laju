import { authNotConfigured, getAuthReadiness, requireUserContext } from "../../lib/laju-server-boundary";

export async function GET(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Server-side export API", readiness.missingEnvVars);
  }
  const authError = requireUserContext(request, "Server-side export API");
  if (authError) return authError;
  return Response.json(
    { error: "Server-side export API is auth-ready but data persistence is not wired yet.", code: "not_configured" },
    { status: 501 }
  );
}
