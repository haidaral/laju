import type { ActivityLog, Entry } from "./laju-data";

export type EntryCreateInput = Omit<Entry, "id" | "lastUpdated" | "status"> & {
  status?: string;
};

export type EntryStatusUpdateInput = {
  entryId: number | string;
  status: string;
};

export type EntriesResponse = {
  entries: Entry[];
  activityLog: ActivityLog[];
};

export type ApiErrorResponse = {
  error: string;
  code: "missing_auth" | "not_configured" | "validation_error" | "server_error";
};

export function apiNotConfigured(feature: string): Response {
  return Response.json(
    {
      error: `${feature} is not configured yet. v0.1 currently uses browser-local persistence until Clerk/Supabase are wired.`,
      code: "not_configured"
    } satisfies ApiErrorResponse,
    { status: 501 }
  );
}
