import { apiMissingAuth, apiServerError, apiValidationError } from "../../../lib/laju-api-contracts";
import { updateEntryStatus } from "../../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../../lib/laju-server-boundary";

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry status API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entry status API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entry status API");

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiValidationError("Invalid JSON payload.");
  }

  const entryId = payload.entryId;
  const status = payload.status;
  if (typeof entryId !== "string" || !entryId.trim() || typeof status !== "string" || !status.trim()) {
    return apiValidationError("Status update requires non-empty entryId and status.");
  }

  try {
    const result = await updateEntryStatus(userId, entryId, status);
    return Response.json(result);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to update entry status.", { message });
  }
}
