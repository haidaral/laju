import { apiMissingAuth, apiServerError, apiValidationError } from "../../../../lib/laju-api-contracts";
import { upsertEntryMeta } from "../../../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../../../lib/laju-server-boundary";

type RouteParams = {
  params: Promise<{ entryId: string }>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown server error");
  }
  return "Unknown server error";
}

export async function PUT(request: Request, context: RouteParams) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entry meta API", readiness.missingEnvVars);
  }

  const { userId, error } = await resolveUserIdOrError(request, "Entry meta API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entry meta API");

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

  const assignee = typeof payload.assignee === "string" ? payload.assignee : "";
  const priority = payload.priority;
  if (priority !== "Low" && priority !== "Medium" && priority !== "High") {
    return apiValidationError("Invalid priority value.");
  }
  const rawComments = payload.comments;
  if (!Array.isArray(rawComments)) {
    return apiValidationError("Comments must be an array.");
  }
  const comments = rawComments
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.text !== "string" || typeof row.createdAt !== "string") return null;
      return { id: row.id, text: row.text, createdAt: row.createdAt };
    })
    .filter((item): item is { id: string; text: string; createdAt: string } => Boolean(item));

  try {
    const meta = await upsertEntryMeta(userId, entryId, {
      assignee,
      priority,
      comments
    });
    return Response.json({ entryId, meta });
  } catch (repoError) {
    const message = getErrorMessage(repoError);
    if (message === "ENTRY_NOT_FOUND") {
      return Response.json({ error: "Entry not found for this user.", code: "validation_error" }, { status: 404 });
    }
    return apiServerError("Failed to update entry meta.", { message });
  }
}

