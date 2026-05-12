import { apiMissingAuth, apiServerError, apiValidationError } from "../../lib/laju-api-contracts";
import { createEntry, listEntriesWithActivity } from "../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../lib/laju-server-boundary";

export async function GET(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entries API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entries API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entries API");

  try {
    const data = await listEntriesWithActivity(userId);
    return Response.json(data);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to fetch entries.", { message });
  }
}

export async function POST(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("Entries API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "Entries API");
  if (error) return error;
  if (!userId) return apiMissingAuth("Entries API");

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiValidationError("Invalid JSON payload.");
  }

  const type = payload.type;
  const title = payload.title;
  const company = payload.company;
  const workType = payload.workType;
  const currency = payload.currency;

  if ((type !== "job" && type !== "freelance") || typeof title !== "string" || typeof company !== "string") {
    return apiValidationError("Entry payload is missing required fields.", {
      required: ["type", "title", "company"],
      allowedType: ["job", "freelance"]
    });
  }

  if ((workType && workType !== "Remote" && workType !== "Hybrid" && workType !== "Onsite") || (currency && currency !== "IDR" && currency !== "USD")) {
    return apiValidationError("Entry payload contains unsupported enum values.", {
      workTypeAllowed: ["Remote", "Hybrid", "Onsite"],
      currencyAllowed: ["IDR", "USD"]
    });
  }

  try {
    const result = await createEntry(userId, {
      type,
      title,
      company,
      platform: typeof payload.platform === "string" ? payload.platform : "Direct",
      status: typeof payload.status === "string" ? payload.status : undefined,
      location: typeof payload.location === "string" ? payload.location : "Remote",
      workType: (typeof workType === "string" ? workType : "Remote") as "Remote" | "Hybrid" | "Onsite",
      currency: (typeof currency === "string" ? currency : "IDR") as "IDR" | "USD",
      value: typeof payload.value === "string" ? payload.value : "",
      notes: typeof payload.notes === "string" ? payload.notes : ""
    });
    return Response.json(result, { status: 201 });
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to create entry.", { message });
  }
}
