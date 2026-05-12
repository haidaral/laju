import { apiMissingAuth, apiServerError } from "../../lib/laju-api-contracts";
import { buildServerEntriesCsv } from "../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../lib/laju-server-boundary";

export async function GET(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Server-side export API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Server-side export API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Server-side export API");
  try {
    const csv = await buildServerEntriesCsv(userId);
    const today = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laju-entries-${today}.csv"`
      }
    });
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to export CSV.", { message });
  }
}
