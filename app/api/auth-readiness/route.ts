import { getAuthReadiness } from "../../lib/laju-server-boundary";

export async function GET() {
  const readiness = getAuthReadiness();
  return Response.json({
    configured: readiness.configured,
    missingEnvVars: readiness.missingEnvVars
  });
}
