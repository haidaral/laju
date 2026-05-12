import { getSupabaseAdminClient } from "./laju-supabase";

export type RepositoryEntry = {
  id: string;
  type: "job" | "freelance";
  title: string;
  company: string;
  platform: string;
  status: string;
  location: string;
  workType: "Remote" | "Hybrid" | "Onsite";
  currency: "IDR" | "USD";
  value: string;
  lastUpdated: string;
  notes: string;
};

export type RepositoryActivityLog = {
  id: string;
  entryId: string;
  action: "created" | "status_change" | "followed_up" | "ghosted" | "note_added" | "deleted";
  oldStatus?: string;
  newStatus?: string;
  note: string;
  createdAt: string;
};

export type RepositoryUserSettings = {
  jobReminderDays: number;
  freelanceReminderDays: number;
  currency: "IDR" | "USD";
  aiEnabled: boolean;
};

export type CreateEntryInput = {
  type: "job" | "freelance";
  title: string;
  company: string;
  platform: string;
  status?: string;
  location: string;
  workType: "Remote" | "Hybrid" | "Onsite";
  currency: "IDR" | "USD";
  value: string;
  notes: string;
};

type DbEntryRow = {
  id: string;
  user_id: string;
  type: "job" | "freelance";
  title: string;
  company: string;
  platform: string;
  status: string;
  currency: "IDR" | "USD";
  value: string | null;
  location: string | null;
  work_type: "Remote" | "Hybrid" | "Onsite";
  notes: string | null;
  last_updated: string;
};

type DbActivityRow = {
  id: string;
  entry_id: string;
  action: "created" | "status_change" | "followed_up" | "ghosted" | "note_added" | "deleted";
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

function mapDbEntry(row: DbEntryRow): RepositoryEntry {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    company: row.company,
    platform: row.platform,
    status: row.status,
    location: row.location ?? "Remote",
    workType: row.work_type,
    currency: row.currency,
    value: row.value ?? "",
    lastUpdated: row.last_updated.slice(0, 10),
    notes: row.notes ?? ""
  };
}

function mapDbActivity(row: DbActivityRow): RepositoryActivityLog {
  return {
    id: row.id,
    entryId: row.entry_id,
    action: row.action,
    oldStatus: row.old_status ?? undefined,
    newStatus: row.new_status ?? undefined,
    note: row.note ?? "",
    createdAt: row.created_at.slice(0, 10)
  };
}

export async function listEntriesWithActivity(
  userId: string
): Promise<{ entries: RepositoryEntry[]; activityLog: RepositoryActivityLog[] }> {
  const supabase = getSupabaseAdminClient();

  const { data: entriesData, error: entriesError } = await supabase
    .from("entries")
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .eq("user_id", userId)
    .order("last_updated", { ascending: false });
  if (entriesError) throw entriesError;

  const { data: activityData, error: activityError } = await supabase
    .from("activity_log")
    .select("id,entry_id,action,old_status,new_status,note,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (activityError) throw activityError;

  return {
    entries: (entriesData as DbEntryRow[]).map(mapDbEntry),
    activityLog: (activityData as DbActivityRow[]).map(mapDbActivity)
  };
}

export async function createEntry(
  userId: string,
  input: CreateEntryInput
): Promise<{ entry: RepositoryEntry; activity: RepositoryActivityLog }> {
  const supabase = getSupabaseAdminClient();
  const timestamp = new Date().toISOString();

  const insertPayload = {
    user_id: userId,
    type: input.type,
    title: input.title,
    company: input.company,
    platform: input.platform || "Direct",
    status: input.status || (input.type === "job" ? "Applied" : "Lead"),
    currency: input.currency,
    value: input.value || null,
    location: input.location || "Remote",
    work_type: input.workType,
    notes: input.notes || "",
    last_updated: timestamp
  };

  const { data: insertedEntry, error: insertError } = await supabase
    .from("entries")
    .insert(insertPayload)
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .single();
  if (insertError) throw insertError;

  const entryRow = insertedEntry as DbEntryRow;

  const activityPayload = {
    user_id: userId,
    entry_id: entryRow.id,
    action: "created",
    old_status: null,
    new_status: entryRow.status,
    note: `${entryRow.title} added to ${entryRow.type === "job" ? "job" : "freelance"} pipeline.`
  };

  const { data: insertedActivity, error: activityError } = await supabase
    .from("activity_log")
    .insert(activityPayload)
    .select("id,entry_id,action,old_status,new_status,note,created_at")
    .single();
  if (activityError) throw activityError;

  return {
    entry: mapDbEntry(entryRow),
    activity: mapDbActivity(insertedActivity as DbActivityRow)
  };
}

export async function updateEntryStatus(
  userId: string,
  entryId: string,
  status: string
): Promise<{ entry: RepositoryEntry; activity: RepositoryActivityLog }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existingEntry, error: existingError } = await supabase
    .from("entries")
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existingEntry) throw new Error("ENTRY_NOT_FOUND");

  const existing = existingEntry as DbEntryRow;

  const { data: updatedEntry, error: updateError } = await supabase
    .from("entries")
    .update({ status, last_updated: now })
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .single();
  if (updateError) throw updateError;

  const action = status === "Ghosted" ? "ghosted" : "status_change";
  const { data: insertedActivity, error: activityError } = await supabase
    .from("activity_log")
    .insert({
      user_id: userId,
      entry_id: entryId,
      action,
      old_status: existing.status,
      new_status: status,
      note: `${existing.title} moved from ${existing.status} to ${status}.`
    })
    .select("id,entry_id,action,old_status,new_status,note,created_at")
    .single();
  if (activityError) throw activityError;

  return {
    entry: mapDbEntry(updatedEntry as DbEntryRow),
    activity: mapDbActivity(insertedActivity as DbActivityRow)
  };
}

export async function markEntryFollowedUp(
  userId: string,
  entryId: string
): Promise<{ entry: RepositoryEntry; activity: RepositoryActivityLog }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existingEntry, error: existingError } = await supabase
    .from("entries")
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existingEntry) throw new Error("ENTRY_NOT_FOUND");

  const { data: updatedEntry, error: updateError } = await supabase
    .from("entries")
    .update({ last_updated: now })
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .single();
  if (updateError) throw updateError;
  const updated = updatedEntry as DbEntryRow;

  const { data: insertedActivity, error: activityError } = await supabase
    .from("activity_log")
    .insert({
      user_id: userId,
      entry_id: entryId,
      action: "followed_up",
      old_status: updated.status,
      new_status: updated.status,
      note: `${updated.title} marked as followed up.`
    })
    .select("id,entry_id,action,old_status,new_status,note,created_at")
    .single();
  if (activityError) throw activityError;

  return {
    entry: mapDbEntry(updated),
    activity: mapDbActivity(insertedActivity as DbActivityRow)
  };
}

type ExportFilters = {
  type?: "job" | "freelance";
  status?: string;
  from?: string;
  to?: string;
};

export async function buildServerEntriesCsv(userId: string, filters?: ExportFilters): Promise<string> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("entries")
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .eq("user_id", userId)
    .order("last_updated", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.from) {
    query = query.gte("last_updated", `${filters.from}T00:00:00.000Z`);
  }
  if (filters?.to) {
    query = query.lte("last_updated", `${filters.to}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) throw error;
  const entries = (data as DbEntryRow[]).map(mapDbEntry);

  return [
    ["type", "title", "company", "platform", "status", "currency", "value", "location", "work_type", "last_updated", "notes"],
    ...entries.map((entry) => [
      entry.type,
      entry.title,
      entry.company,
      entry.platform,
      entry.status,
      entry.currency,
      entry.value,
      entry.location,
      entry.workType,
      entry.lastUpdated,
      entry.notes
    ])
  ]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export async function updateEntryDetails(
  userId: string,
  entryId: string,
  patch: Partial<CreateEntryInput> & { status?: string }
): Promise<{ entry: RepositoryEntry; activity: RepositoryActivityLog }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existingEntry, error: existingError } = await supabase
    .from("entries")
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existingEntry) throw new Error("ENTRY_NOT_FOUND");
  const existing = existingEntry as DbEntryRow;

  const updatePayload: Record<string, unknown> = {
    last_updated: now
  };
  if (typeof patch.title === "string") updatePayload.title = patch.title;
  if (typeof patch.company === "string") updatePayload.company = patch.company;
  if (typeof patch.platform === "string") updatePayload.platform = patch.platform;
  if (typeof patch.status === "string") updatePayload.status = patch.status;
  if (typeof patch.location === "string") updatePayload.location = patch.location;
  if (typeof patch.workType === "string") updatePayload.work_type = patch.workType;
  if (typeof patch.currency === "string") updatePayload.currency = patch.currency;
  if (typeof patch.value === "string") updatePayload.value = patch.value;
  if (typeof patch.notes === "string") updatePayload.notes = patch.notes;

  const { data: updatedEntry, error: updateError } = await supabase
    .from("entries")
    .update(updatePayload)
    .eq("id", entryId)
    .eq("user_id", userId)
    .select("id,user_id,type,title,company,platform,status,currency,value,location,work_type,notes,last_updated")
    .single();
  if (updateError) throw updateError;
  const updated = updatedEntry as DbEntryRow;

  const isStatusChanged = updated.status !== existing.status;
  const { data: insertedActivity, error: activityError } = await supabase
    .from("activity_log")
    .insert({
      user_id: userId,
      entry_id: entryId,
      action: isStatusChanged ? "status_change" : "note_added",
      old_status: existing.status,
      new_status: updated.status,
      note: `${updated.title} details updated.`
    })
    .select("id,entry_id,action,old_status,new_status,note,created_at")
    .single();
  if (activityError) throw activityError;

  return {
    entry: mapDbEntry(updated),
    activity: mapDbActivity(insertedActivity as DbActivityRow)
  };
}

export async function deleteEntryById(userId: string, entryId: string): Promise<{ deleted: true }> {
  const supabase = getSupabaseAdminClient();
  const { data: existingEntry, error: existingError } = await supabase
    .from("entries")
    .select("id,title,type,status")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existingEntry) throw new Error("ENTRY_NOT_FOUND");

  const row = existingEntry as { id: string; title: string; type: "job" | "freelance"; status: string };

  const { error: activityError } = await supabase.from("activity_log").insert({
    user_id: userId,
    entry_id: row.id,
    action: "deleted",
    old_status: row.status,
    new_status: null,
    note: `${row.title} deleted from ${row.type === "job" ? "job" : "freelance"} pipeline.`
  });
  if (activityError) throw activityError;

  const { error: deleteError } = await supabase.from("entries").delete().eq("id", entryId).eq("user_id", userId);
  if (deleteError) throw deleteError;

  return { deleted: true };
}

export async function getUserSettings(userId: string): Promise<RepositoryUserSettings> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("job_reminder_days,freelance_reminder_days,currency,ai_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      jobReminderDays: 14,
      freelanceReminderDays: 7,
      currency: "IDR",
      aiEnabled: false
    };
  }
  return {
    jobReminderDays: data.job_reminder_days,
    freelanceReminderDays: data.freelance_reminder_days,
    currency: data.currency,
    aiEnabled: data.ai_enabled
  };
}

export async function upsertUserSettings(userId: string, input: RepositoryUserSettings): Promise<RepositoryUserSettings> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        job_reminder_days: input.jobReminderDays,
        freelance_reminder_days: input.freelanceReminderDays,
        currency: input.currency,
        ai_enabled: input.aiEnabled,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    )
    .select("job_reminder_days,freelance_reminder_days,currency,ai_enabled")
    .single();
  if (error) throw error;
  return {
    jobReminderDays: data.job_reminder_days,
    freelanceReminderDays: data.freelance_reminder_days,
    currency: data.currency,
    aiEnabled: data.ai_enabled
  };
}
