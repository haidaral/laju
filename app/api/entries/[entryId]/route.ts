import { apiMissingAuth, apiServerError, apiValidationError } from "../../../lib/laju-api-contracts";
import { deleteEntryById, updateEntryDetails } from "../../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../../lib/laju-server-boundary";

type RouteParams = {
  params: Promise<{ entryId: string }>;
};

export async function PATCH(request: Request, context: RouteParams) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry detail API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entry detail API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entry detail API");

  const { entryId } = await context.params;
  if (!entryId?.trim()) {
    return apiValidationError("Missing entryId.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiValidationError("Invalid JSON payload.");
  }

  try {
    const result = await updateEntryDetails(userId, entryId, {
      type: payload.type === "job" || payload.type === "freelance" ? payload.type : undefined,
      title: typeof payload.title === "string" ? payload.title : undefined,
      company: typeof payload.company === "string" ? payload.company : undefined,
      platform: typeof payload.platform === "string" ? payload.platform : undefined,
      status: typeof payload.status === "string" ? payload.status : undefined,
      location: typeof payload.location === "string" ? payload.location : undefined,
      workType: payload.workType === "Remote" || payload.workType === "Hybrid" || payload.workType === "Onsite" ? payload.workType : undefined,
      currency: payload.currency === "IDR" || payload.currency === "USD" ? payload.currency : undefined,
      value: typeof payload.value === "string" ? payload.value : undefined,
      notes: typeof payload.notes === "string" ? payload.notes : undefined
    });
    return Response.json(result);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to update entry details.", { message });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry delete API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entry delete API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entry delete API");

  const { entryId } = await context.params;
  if (!entryId?.trim()) {
    return apiValidationError("Missing entryId.");
  }
  try {
    const result = await deleteEntryById(userId, entryId);
    return Response.json(result);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to delete entry.", { message });
  }
}
