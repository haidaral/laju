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
    .single();
  if (existingError) throw existingError;

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

export async function buildServerEntriesCsv(userId: string): Promise<string> {
  const { entries } = await listEntriesWithActivity(userId);
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
