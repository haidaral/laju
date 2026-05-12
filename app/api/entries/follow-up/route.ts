import { apiMissingAuth, apiServerError, apiValidationError } from "../../../lib/laju-api-contracts";
import { markEntryFollowedUp } from "../../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../../lib/laju-server-boundary";

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry follow-up API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entry follow-up API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entry follow-up API");

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiValidationError("Invalid JSON payload.");
  }
  const entryId = payload.entryId;
  if (typeof entryId !== "string" || !entryId.trim()) {
    return apiValidationError("Follow-up requires non-empty entryId.");
  }
  try {
    const result = await markEntryFollowedUp(userId, entryId);
    return Response.json(result);
  } catch (repoError) {
    const message =
      repoError instanceof Error
        ? repoError.message
        : typeof repoError === "object" && repoError !== null && "message" in repoError
          ? String((repoError as { message?: unknown }).message ?? "Unknown server error")
          : "Unknown server error";
    if (message === "ENTRY_NOT_FOUND") {
      return Response.json({ error: "Entry not found for this user.", code: "validation_error" }, { status: 404 });
    }
    return apiServerError("Failed to mark follow-up.", { message });
  }
}
