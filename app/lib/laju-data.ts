export type PipelineType = "job" | "freelance";
export type ViewKey = "overview" | "jobs" | "freelance" | "reminders" | "settings";
export type WorkType = "Remote" | "Hybrid" | "Onsite";
export type Currency = "IDR" | "USD";

export type Entry = {
  id: number | string;
  type: PipelineType;
  title: string;
  company: string;
  platform: string;
  status: string;
  location: string;
  workType: WorkType;
  currency: Currency;
  value: string;
  lastUpdated: string;
  notes: string;
};

export type ActivityLog = {
  id: number | string;
  entryId: number | string;
  action:
    | "created"
    | "status_change"
    | "followed_up"
    | "ghosted"
    | "note_added"
    | "deleted"
    | "csv_exported"
    | "snoozed"
    | "unsnoozed";
  oldStatus?: string;
  newStatus?: string;
  note: string;
  createdAt: string;
};

export type LajuLocalState = {
  entries: Entry[];
  activityLog: ActivityLog[];
  mode?: "sample" | "empty";
  snoozedUntilMap?: Record<string, string>;
  role?: "owner" | "member" | "viewer";
  uiPreset?: "notion" | "trello" | "asana" | "github";
  compactMode?: boolean;
  darkMode?: boolean;
};

export const jobStages = ["Applied", "Interview", "Psikotest", "Offering", "Negotiation", "Accepted", "Rejected", "Ghosted"];
export const freelanceStages = ["Lead", "Proposal", "Negotiation", "Contract", "In Progress", "Invoiced", "Paid", "Lost"];

export const currentDate = "2026-05-11";

export const initialEntries: Entry[] = [
  {
    id: 1,
    type: "job",
    title: "Growth Marketing Manager",
    company: "SaaS Studio",
    platform: "LinkedIn",
    status: "Interview",
    location: "Remote",
    workType: "Remote",
    currency: "USD",
    value: "2,500-3,500/mo",
    lastUpdated: "2026-05-03",
    notes: "Second call pending. Follow up with portfolio case study."
  },
  {
    id: 2,
    type: "job",
    title: "Performance Marketing Lead",
    company: "Jakarta Commerce",
    platform: "Glints",
    status: "Applied",
    location: "Jakarta",
    workType: "Hybrid",
    currency: "IDR",
    value: "18-25m/mo",
    lastUpdated: "2026-04-25",
    notes: "Needs follow-up. Application sent with general CV."
  },
  {
    id: 3,
    type: "freelance",
    title: "Monthly Ads Reporting System",
    company: "Design Agency",
    platform: "Direct",
    status: "Proposal",
    location: "Bali",
    workType: "Remote",
    currency: "IDR",
    value: "8m/project",
    lastUpdated: "2026-05-07",
    notes: "Proposal sent. Ask about reporting cadence and dashboard access."
  },
  {
    id: 4,
    type: "freelance",
    title: "Landing Page Audit",
    company: "Wellness Brand",
    platform: "Referral",
    status: "Negotiation",
    location: "Singapore",
    workType: "Remote",
    currency: "USD",
    value: "900",
    lastUpdated: "2026-04-29",
    notes: "Waiting on scope confirmation."
  }
];

export const initialActivityLog: ActivityLog[] = initialEntries.map((entry, index) => ({
  id: index + 1,
  entryId: entry.id,
  action: "created",
  newStatus: entry.status,
  note: `${entry.title} added to ${entry.type === "job" ? "job" : "freelance"} pipeline.`,
  createdAt: entry.lastUpdated
}));

export function getStages(type: PipelineType) {
  return type === "job" ? jobStages : freelanceStages;
}

export function daysSince(date: string) {
  const current = new Date(`${currentDate}T12:00:00+08:00`);
  const then = new Date(`${date}T12:00:00+08:00`);
  return Math.max(0, Math.floor((current.getTime() - then.getTime()) / 86400000));
}

export function isTerminal(entry: Entry) {
  return ["Accepted", "Rejected", "Ghosted", "Paid", "Lost"].includes(entry.status);
}

export function isStale(entry: Entry) {
  const limit = entry.type === "job" ? 14 : 7;
  return !isTerminal(entry) && daysSince(entry.lastUpdated) >= limit;
}

export function buildEntriesCsv(entries: Entry[]) {
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
