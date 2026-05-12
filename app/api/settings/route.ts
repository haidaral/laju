import { apiMissingAuth, apiServerError, apiValidationError } from "../../lib/laju-api-contracts";
import { getUserSettings, upsertUserSettings } from "../../lib/laju-repository";
import { authNotConfigured, getAuthReadiness, resolveUserIdOrError } from "../../lib/laju-server-boundary";

export async function GET(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("User settings API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "User settings API");
  if (error) return error;
  if (!userId) return apiMissingAuth("User settings API");
  try {
    const settings = await getUserSettings(userId);
    return Response.json(settings);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to fetch user settings.", { message });
  }
}

export async function PUT(request: Request) {
  const readiness = getAuthReadiness();
  if (!readiness.configured) {
    return authNotConfigured("User settings API", readiness.missingEnvVars);
  }
  const { userId, error } = await resolveUserIdOrError(request, "User settings API");
  if (error) return error;
  if (!userId) return apiMissingAuth("User settings API");

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiValidationError("Invalid JSON payload.");
  }

  const jobReminderDays = payload.jobReminderDays;
  const freelanceReminderDays = payload.freelanceReminderDays;
  const currency = payload.currency;
  const aiEnabled = payload.aiEnabled;
  if (
    typeof jobReminderDays !== "number" ||
    typeof freelanceReminderDays !== "number" ||
    (currency !== "IDR" && currency !== "USD") ||
    typeof aiEnabled !== "boolean"
  ) {
    return apiValidationError("Invalid settings payload.", {
      required: ["jobReminderDays:number", "freelanceReminderDays:number", "currency:IDR|USD", "aiEnabled:boolean"]
    });
  }

  if (jobReminderDays < 1 || jobReminderDays > 60 || freelanceReminderDays < 1 || freelanceReminderDays > 60) {
    return apiValidationError("Reminder thresholds must be between 1 and 60.");
  }

  try {
    const saved = await upsertUserSettings(userId, {
      jobReminderDays,
      freelanceReminderDays,
      currency,
      aiEnabled
    });
    return Response.json(saved);
  } catch (repoError) {
    const message = repoError instanceof Error ? repoError.message : "Unknown server error";
    return apiServerError("Failed to save user settings.", { message });
  }
}
