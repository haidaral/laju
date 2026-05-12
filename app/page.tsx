"use client";

import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  buildEntriesCsv,
  currentDate,
  daysSince,
  getStages,
  initialActivityLog,
  initialEntries,
  isStale,
  isTerminal,
  type ActivityLog,
  type Entry,
  type LajuLocalState,
  type PipelineType,
  type ViewKey
} from "./lib/laju-data";

const storageKey = "laju:v0.1:state";

export default function Home() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(initialActivityLog);
  const [mode, setMode] = useState<"sample" | "empty">("sample");
  const [isHydrated, setIsHydrated] = useState(false);
  const [pipelineView, setPipelineView] = useState<"kanban" | "table">("kanban");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("All");
  const [dataMode, setDataMode] = useState<DataMode>("local");
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({
    jobReminderDays: 14,
    freelanceReminderDays: 7,
    currency: "IDR",
    aiEnabled: false
  });
  const [settingsStatus, setSettingsStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cloudDataStatus, setCloudDataStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [operationNotice, setOperationNotice] = useState<OperationNotice>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ status: "idle" });
  const [snoozedUntilMap, setSnoozedUntilMap] = useState<Record<string, string>>({});
  const [selectedPipelineEntryIds, setSelectedPipelineEntryIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LajuLocalState;
        if (parsed.mode === "empty") {
          setEntries(parsed.entries ?? []);
          setActivityLog(parsed.activityLog ?? []);
          setSnoozedUntilMap(parsed.snoozedUntilMap ?? {});
          setMode("empty");
        } else {
          setEntries(parsed.entries?.length ? parsed.entries : initialEntries);
          setActivityLog(parsed.activityLog?.length ? parsed.activityLog : initialActivityLog);
          setSnoozedUntilMap(parsed.snoozedUntilMap ?? {});
          setMode("sample");
        }
      } catch {
        setEntries(initialEntries);
        setActivityLog(initialActivityLog);
        setSnoozedUntilMap({});
        setMode("sample");
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (dataMode !== "local") return;
    window.localStorage.setItem(storageKey, JSON.stringify({ entries, activityLog, mode, snoozedUntilMap }));
  }, [activityLog, entries, isHydrated, mode, dataMode, snoozedUntilMap]);

  useEffect(() => {
    let active = true;
    async function detectDataMode() {
      try {
        const response = await fetch("/api/auth-readiness", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { configured?: boolean };
        if (!active) return;
        if (payload.configured && authLoaded) {
          setDataMode("cloud");
        } else {
          setDataMode("local");
        }
      } catch {
        if (active) {
          setDataMode("local");
        }
      }
    }
    void detectDataMode();
    return () => {
      active = false;
    };
  }, [authLoaded]);

  useEffect(() => {
    if (dataMode !== "cloud") return;
    if (!authLoaded || !isSignedIn) return;
    let active = true;
    async function loadCloudData() {
      setCloudDataStatus("loading");
      try {
        const response = await fetch("/api/entries", { cache: "no-store" });
        if (!response.ok) {
          if (active) setCloudDataStatus("error");
          return;
        }
        const payload = (await response.json()) as { entries: Entry[]; activityLog: ActivityLog[] };
        if (!active) return;
        setEntries(payload.entries ?? []);
        setActivityLog(payload.activityLog ?? []);
        setCloudDataStatus("ready");
      } catch {
        if (active) setCloudDataStatus("error");
      }
    }
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as CloudSettings;
        if (active) {
          setCloudSettings(payload);
        }
      } catch {
        // Keep defaults if cloud settings fetch fails.
      }
    }
    void loadCloudData();
    void loadSettings();
    return () => {
      active = false;
    };
  }, [authLoaded, dataMode, isSignedIn]);

  useEffect(() => {
    if (!operationNotice) return;
    const timeout = window.setTimeout(() => setOperationNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [operationNotice]);

  async function saveCloudSettings(next: CloudSettings) {
    if (dataMode !== "cloud") return;
    setSettingsStatus("saving");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      if (!response.ok) {
        setSettingsStatus("error");
        setOperationNotice({ type: "error", message: "Failed to save settings." });
        return;
      }
      const payload = (await response.json()) as CloudSettings;
      setCloudSettings(payload);
      setSettingsStatus("saved");
      setOperationNotice({ type: "success", message: "Settings saved." });
    } catch {
      setSettingsStatus("error");
      setOperationNotice({ type: "error", message: "Failed to save settings." });
    }
  }

  async function checkCloudHealth() {
    setHealthStatus({ status: "loading" });
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) {
        setHealthStatus({ status: "error", message: "Health endpoint is unavailable." });
        return;
      }
      const payload = (await response.json()) as {
        auth: { configured: boolean };
        db: { ok: boolean; error?: string };
      };
      if (!payload.auth.configured) {
        setHealthStatus({ status: "error", message: "Auth environment is not configured." });
        return;
      }
      if (!payload.db.ok) {
        setHealthStatus({ status: "error", message: payload.db.error ?? "Database is not reachable." });
        return;
      }
      setHealthStatus({ status: "ok", message: "Auth and database are healthy." });
    } catch {
      setHealthStatus({ status: "error", message: "Health check failed." });
    }
  }

  const activeEntries = entries.filter((entry) => !isTerminal(entry));
  const completedEntries = entries.filter((entry) => isTerminal(entry));
  const staleEntries = entries.filter((entry) => {
    const limit = entry.type === "job" ? cloudSettings.jobReminderDays : cloudSettings.freelanceReminderDays;
    const snoozedUntil = snoozedUntilMap[String(entry.id)];
    const isSnoozed = snoozedUntil ? snoozedUntil >= currentDate : false;
    return !isTerminal(entry) && !isSnoozed && daysSince(entry.lastUpdated) >= limit;
  });
  const snoozedEntriesCount = Object.keys(snoozedUntilMap).filter((entryId) => {
    const entry = entries.find((item) => sameId(item.id, entryId));
    if (!entry || isTerminal(entry)) return false;
    return snoozedUntilMap[entryId] >= currentDate;
  }).length;
  const wins = entries.filter((entry) => ["Accepted", "Paid"].includes(entry.status)).length;
  const winRate = completedEntries.length ? Math.round((wins / completedEntries.length) * 100) : 0;

  const recentActivity = useMemo(
    () => [...activityLog].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [activityLog]
  );
  const gateAStats = useMemo(() => buildGateAStats(activityLog), [activityLog]);
  const onboardingTasks = useMemo(
    () => [
      { label: "Add your first entry", done: entries.length > 0 },
      { label: "Move one entry between statuses", done: activityLog.some((activity) => activity.action === "status_change") },
      { label: "Mark one follow-up action", done: activityLog.some((activity) => activity.action === "followed_up") },
      { label: "Export your CSV once", done: activityLog.some((activity) => activity.action === "csv_exported") }
    ],
    [activityLog, entries.length]
  );

  async function updateStatus(entryId: Entry["id"], status: string) {
    const entryBeforeUpdate = entries.find((entry) => entry.id === entryId);
    if (!entryBeforeUpdate || entryBeforeUpdate.status === status) return;

    if (dataMode === "cloud") {
      const response = await fetch("/api/entries/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, status })
      });
      if (!response.ok) {
        setOperationNotice({ type: "error", message: "Failed to update status." });
        return;
      }
      const payload = (await response.json()) as { entry: Entry; activity: ActivityLog };
      setEntries((current) => current.map((entry) => (sameId(entry.id, payload.entry.id) ? payload.entry : entry)));
      setSelectedEntry((current) => (current && sameId(current.id, payload.entry.id) ? payload.entry : current));
      setActivityLog((current) => [payload.activity, ...current]);
      setOperationNotice({ type: "success", message: "Status updated." });
      return;
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              status,
              lastUpdated: currentDate
            }
          : entry
      )
    );
    setSelectedEntry((current) => (current?.id === entryId ? { ...current, status, lastUpdated: currentDate } : current));
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId,
        action: status === "Ghosted" ? "ghosted" : "status_change",
        oldStatus: entryBeforeUpdate.status,
        newStatus: status,
        note: `${entryBeforeUpdate.title} moved from ${entryBeforeUpdate.status} to ${status}.`,
        createdAt: currentDate
      },
      ...current
    ]);
  }

  async function bulkUpdateStatus(status: string) {
    if (!selectedPipelineEntryIds.length) return;
    for (const entryId of selectedPipelineEntryIds) {
      const entry = entries.find((item) => sameId(item.id, entryId));
      if (!entry || entry.status === status) continue;
      await updateStatus(entry.id, status);
    }
    setSelectedPipelineEntryIds([]);
    setOperationNotice({ type: "success", message: "Bulk status update applied." });
  }

  async function markFollowedUp(entryId: Entry["id"]) {
    const entryBeforeUpdate = entries.find((entry) => entry.id === entryId);
    if (!entryBeforeUpdate) return;

    if (dataMode === "cloud" && typeof entryId === "string") {
      const response = await fetch("/api/entries/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId })
      });
      if (!response.ok) {
        setOperationNotice({ type: "error", message: "Failed to log follow-up." });
        return;
      }
      const payload = (await response.json()) as { entry: Entry; activity: ActivityLog };
      setEntries((current) => current.map((entry) => (sameId(entry.id, payload.entry.id) ? payload.entry : entry)));
      setActivityLog((current) => [payload.activity, ...current]);
      setOperationNotice({ type: "success", message: "Follow-up logged." });
      return;
    }

    setEntries((current) => current.map((entry) => (sameId(entry.id, entryId) ? { ...entry, lastUpdated: currentDate } : entry)));
    setSnoozedUntilMap((current) => {
      const next = { ...current };
      delete next[String(entryId)];
      return next;
    });
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId,
        action: "followed_up",
        oldStatus: entryBeforeUpdate.status,
        newStatus: entryBeforeUpdate.status,
        note: `${entryBeforeUpdate.title} marked as followed up.`,
        createdAt: currentDate
      },
      ...current
    ]);
  }

  function snoozeReminder(entryId: Entry["id"], days: number) {
    const entry = entries.find((item) => sameId(item.id, entryId));
    if (!entry) return;
    const snoozeUntil = addDaysIso(currentDate, days);
    setSnoozedUntilMap((current) => ({ ...current, [String(entryId)]: snoozeUntil }));
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId,
        action: "snoozed",
        oldStatus: entry.status,
        newStatus: entry.status,
        note: `${entry.title} snoozed until ${snoozeUntil}.`,
        createdAt: currentDate
      },
      ...current
    ]);
    setOperationNotice({ type: "success", message: `Reminder snoozed for ${days} days.` });
  }

  function clearSnooze(entryId: Entry["id"]) {
    const entry = entries.find((item) => sameId(item.id, entryId));
    if (!entry) return;
    setSnoozedUntilMap((current) => {
      const next = { ...current };
      delete next[String(entryId)];
      return next;
    });
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId,
        action: "unsnoozed",
        oldStatus: entry.status,
        newStatus: entry.status,
        note: `${entry.title} snooze cleared.`,
        createdAt: currentDate
      },
      ...current
    ]);
    setOperationNotice({ type: "success", message: "Reminder snooze cleared." });
  }

  async function updateEntry(updatedEntry: Entry) {
    const existingEntry = entries.find((entry) => entry.id === updatedEntry.id);
    if (!existingEntry) return;

    if (dataMode === "cloud" && typeof updatedEntry.id === "string") {
      const response = await fetch(`/api/entries/${updatedEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntry)
      });
      if (!response.ok) {
        setOperationNotice({ type: "error", message: "Failed to update entry." });
        return;
      }
      const payload = (await response.json()) as { entry: Entry; activity: ActivityLog };
      setEntries((current) => current.map((entry) => (sameId(entry.id, payload.entry.id) ? payload.entry : entry)));
      setSelectedEntry(payload.entry);
      setActivityLog((current) => [payload.activity, ...current]);
      setOperationNotice({ type: "success", message: "Entry updated." });
      return;
    }

    const entryWithTimestamp = {
      ...updatedEntry,
      lastUpdated: currentDate
    };

    setEntries((current) => current.map((entry) => (entry.id === updatedEntry.id ? entryWithTimestamp : entry)));
    setSelectedEntry(entryWithTimestamp);
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId: updatedEntry.id,
        action: existingEntry.status !== updatedEntry.status ? "status_change" : "note_added",
        oldStatus: existingEntry.status,
        newStatus: updatedEntry.status,
        note: `${updatedEntry.title} details updated.`,
        createdAt: currentDate
      },
      ...current
    ]);
  }

  async function deleteEntry(entryId: Entry["id"]) {
    const entryToDelete = entries.find((entry) => entry.id === entryId);
    if (!entryToDelete) return;

    if (dataMode === "cloud" && typeof entryId === "string") {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        setOperationNotice({ type: "error", message: "Failed to delete entry." });
        return;
      }
      setEntries((current) => current.filter((entry) => !sameId(entry.id, entryId)));
      setSelectedEntry(null);
      const refresh = await fetch("/api/entries", { cache: "no-store" });
      if (refresh.ok) {
        const payload = (await refresh.json()) as { activityLog: ActivityLog[] };
        setActivityLog(payload.activityLog ?? []);
      }
      return;
    }

    setEntries((current) => current.filter((entry) => !sameId(entry.id, entryId)));
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId,
        action: "deleted",
        oldStatus: entryToDelete.status,
        note: `${entryToDelete.title} deleted from ${entryToDelete.type === "job" ? "job" : "freelance"} pipeline.`,
        createdAt: currentDate
      },
      ...current
    ]);
    setSelectedEntry(null);
  }

  async function addEntry(formData: FormData) {
    const type = formData.get("type") as PipelineType;
    const title = String(formData.get("title") || "").trim();
    const company = String(formData.get("company") || "").trim();

    if (!title || !company || title.length < 2 || company.length < 2) {
      setOperationNotice({ type: "error", message: "Title and Company must be at least 2 characters." });
      return;
    }

    const entry: Entry = {
      id: Date.now(),
      type,
      title,
      company,
      platform: String(formData.get("platform") || "Direct"),
      status: type === "job" ? "Applied" : "Lead",
      location: String(formData.get("location") || "Remote"),
      workType: "Remote",
      currency: String(formData.get("currency") || "IDR") as Entry["currency"],
      value: String(formData.get("value") || "TBD"),
      lastUpdated: currentDate,
      notes: String(formData.get("notes") || "")
    };

    if (dataMode === "cloud") {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      if (!response.ok) {
        setOperationNotice({ type: "error", message: "Failed to create entry." });
        return;
      }
      const payload = (await response.json()) as { entry: Entry; activity: ActivityLog };
      setEntries((current) => [payload.entry, ...current]);
      setActivityLog((current) => [payload.activity, ...current]);
      setIsCreating(false);
      setOperationNotice({ type: "success", message: "Entry created." });
      return;
    }

    setEntries((current) => [entry, ...current]);
    setActivityLog((current) => [
      {
        id: Date.now() + 1,
        entryId: entry.id,
        action: "created",
        newStatus: entry.status,
        note: `${entry.title} added to ${entry.type === "job" ? "job" : "freelance"} pipeline.`,
        createdAt: currentDate
      },
      ...current
    ]);
    setIsCreating(false);
    setOperationNotice({ type: "success", message: "Entry created." });
  }

  function startEmptyMode() {
    setEntries([]);
    setActivityLog([]);
    setSnoozedUntilMap({});
    setSelectedEntry(null);
    setMode("empty");
  }

  function useSampleData() {
    setEntries(initialEntries);
    setActivityLog(initialActivityLog);
    setSnoozedUntilMap({});
    setSelectedEntry(null);
    setMode("sample");
  }

  function logCsvExport() {
    setActivityLog((current) => [
      {
        id: Date.now(),
        entryId: 0,
        action: "csv_exported",
        note: "CSV export downloaded.",
        createdAt: currentDate
      },
      ...current
    ]);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">L</div>
          <div>
            <strong>Laju</strong>
            <span>Career pipeline</span>
          </div>
        </div>
        <nav>
          {[
            ["overview", "Overview"],
            ["jobs", "Jobs"],
            ["freelance", "Freelance"],
            ["reminders", `Reminders (${staleEntries.length})`],
            ["settings", "Settings"]
          ].map(([key, label]) => (
            <button key={key} className={activeView === key ? "active" : ""} onClick={() => setActiveView(key as ViewKey)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v0.1 invite build</span>
          <span>{mode === "empty" ? "Mode: Empty" : "Mode: Sample data"}</span>
          <span>{dataMode === "cloud" ? "Sync: Cloud" : "Sync: Local demo"}</span>
          <strong>{entries.length} entries tracked</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{activeView === "overview" ? "Today" : "Pipeline"}</p>
            <h1>{viewTitle(activeView)}</h1>
          </div>
          <div className="row-actions">
            {authLoaded && isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button>Sign In</button>
              </SignInButton>
            )}
            <button className="primary" onClick={() => setIsCreating(true)}>
              Add Entry
            </button>
          </div>
        </header>

        {dataMode === "cloud" && authLoaded && !isSignedIn && (
          <section className="panel">
            <div className="section-heading">
              <h2>Sign in required</h2>
              <p>Cloud sync is enabled for this workspace.</p>
            </div>
            <div className="row-actions">
              <SignInButton mode="modal">
                <button>Sign In to Continue</button>
              </SignInButton>
            </div>
          </section>
        )}
        {dataMode === "cloud" && authLoaded && isSignedIn && cloudDataStatus !== "ready" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Cloud sync status</h2>
              <p>{cloudDataStatus === "loading" ? "Loading cloud data..." : "Cloud data could not be loaded right now."}</p>
            </div>
          </section>
        )}
        {operationNotice && (
          <section className={`notice ${operationNotice.type === "error" ? "notice-error" : "notice-success"}`}>
            {operationNotice.message}
          </section>
        )}

        {activeView === "overview" && (
          <Overview
            entries={entries}
            activeEntries={activeEntries}
            staleEntries={staleEntries}
            winRate={winRate}
            recentActivity={recentActivity}
            gateAStats={gateAStats}
            onboardingTasks={onboardingTasks}
            mode={mode}
          />
        )}

        {(activeView === "jobs" || activeView === "freelance") && (
          <Pipeline
            entries={entries}
            type={activeView === "jobs" ? "job" : "freelance"}
            filter={filter}
            setFilter={setFilter}
            view={pipelineView}
            setView={setPipelineView}
            updateStatus={updateStatus}
            bulkUpdateStatus={bulkUpdateStatus}
            markFollowedUp={markFollowedUp}
            selectEntry={setSelectedEntry}
            selectedEntryIds={selectedPipelineEntryIds}
            setSelectedEntryIds={setSelectedPipelineEntryIds}
          />
        )}

        {activeView === "reminders" && (
          <Reminders
            entries={staleEntries}
            markFollowedUp={markFollowedUp}
            updateStatus={updateStatus}
            snoozeReminder={snoozeReminder}
            clearSnooze={clearSnooze}
            snoozedUntilMap={snoozedUntilMap}
          />
        )}

        {activeView === "settings" && (
          <Settings
            entries={entries}
            activityLog={activityLog}
            setEmptyMode={startEmptyMode}
            setSampleMode={useSampleData}
            mode={mode}
            logCsvExport={logCsvExport}
            dataMode={dataMode}
            cloudSettings={cloudSettings}
            settingsStatus={settingsStatus}
            onSaveCloudSettings={saveCloudSettings}
            healthStatus={healthStatus}
            onCheckCloudHealth={checkCloudHealth}
            staleEntriesCount={staleEntries.length}
            snoozedEntriesCount={snoozedEntriesCount}
            cloudDataStatus={cloudDataStatus}
            resetLocalData={() => {
              setEntries(initialEntries);
              setActivityLog(initialActivityLog);
              setSnoozedUntilMap({});
              setSelectedEntry(null);
              setMode("sample");
            }}
          />
        )}
      </section>

      {(selectedEntry || isCreating) && (
        <div className="drawer-backdrop" onClick={() => (isCreating ? setIsCreating(false) : setSelectedEntry(null))}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            {isCreating ? (
              <CreateEntry close={() => setIsCreating(false)} addEntry={addEntry} />
            ) : selectedEntry ? (
              <EntryDetail entry={selectedEntry} updateEntry={updateEntry} deleteEntry={deleteEntry} close={() => setSelectedEntry(null)} />
            ) : null}
          </aside>
        </div>
      )}
    </main>
  );
}

function viewTitle(view: ViewKey) {
  const titles: Record<ViewKey, string> = {
    overview: "Overview",
    jobs: "Job Applications",
    freelance: "Freelance Leads",
    reminders: "Reminders",
    settings: "Settings"
  };
  return titles[view];
}

function Overview({
  entries,
  activeEntries,
  staleEntries,
  winRate,
  recentActivity,
  gateAStats,
  onboardingTasks,
  mode
}: {
  entries: Entry[];
  activeEntries: Entry[];
  staleEntries: Entry[];
  winRate: number;
  recentActivity: ActivityLog[];
  gateAStats: GateAStats;
  onboardingTasks: Array<{ label: string; done: boolean }>;
  mode: "sample" | "empty";
}) {
  const stats = [
    ["Total Entries", entries.length],
    ["Active", activeEntries.length],
    ["Needs Attention", staleEntries.length],
    ["Win Rate", `${winRate}%`]
  ];

  return (
    <div className="content-grid">
      <section className="stat-grid">
        {stats.map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <h2>Pipeline split</h2>
          <p>Active work by track</p>
        </div>
        <div className="split-row">
          <PipelineMeter label="Jobs" count={entries.filter((entry) => entry.type === "job").length} total={entries.length} />
          <PipelineMeter label="Freelance" count={entries.filter((entry) => entry.type === "freelance").length} total={entries.length} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Gate A progress</h2>
          <p>Target: 4 active days per week for 4 weeks</p>
        </div>
        <div className="gate-grid">
          <article className="stat-card inline">
            <span>This week</span>
            <strong>
              {gateAStats.thisWeekActiveDays}/4
            </strong>
          </article>
          <article className="stat-card inline">
            <span>Last 4 weeks average</span>
            <strong>{gateAStats.averagePerWeek.toFixed(1)} days</strong>
          </article>
        </div>
        <p className="helper">
          {gateAStats.aligned
            ? "Current behavior is aligned with Gate A."
            : "Not yet aligned. Focus on consistent daily tracker use before adding new features."}
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>First-run checklist</h2>
          <p>{mode === "empty" ? "Empty mode active for founder validation." : "Sample mode active for quick demo."}</p>
        </div>
        <div className="onboarding-list">
          {onboardingTasks.map((task) => (
            <div className="onboarding-row" key={task.label}>
              <strong>{task.label}</strong>
              <span>{task.done ? "Done" : "Pending"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <p>Newest updates first</p>
        </div>
        <div className="activity-list">
          {recentActivity.map((activity) => (
            <div className="activity-row" key={activity.id}>
              <div>
                <strong>{activity.note}</strong>
                <span>{activity.action.replaceAll("_", " ")}</span>
              </div>
              <em>{daysSince(activity.createdAt)}d</em>
            </div>
          ))}
        </div>
      </section>

      <section className="panel alert-panel">
        <div className="section-heading">
          <h2>Needs attention</h2>
          <p>Follow-up candidates</p>
        </div>
        {staleEntries.length ? (
          staleEntries.map((entry) => (
            <div className="attention-row" key={entry.id}>
              <strong>{entry.company}</strong>
              <span>
                {entry.status} for {daysSince(entry.lastUpdated)} days
              </span>
            </div>
          ))
        ) : (
          <p className="empty">No stale entries right now.</p>
        )}
      </section>
    </div>
  );
}

function PipelineMeter({ label, count, total }: { label: string; count: number; total: number }) {
  const width = total ? `${Math.round((count / total) * 100)}%` : "0%";
  return (
    <div className="meter-block">
      <div>
        <strong>{label}</strong>
        <span>{count} entries</span>
      </div>
      <div className="meter">
        <i style={{ width }} />
      </div>
    </div>
  );
}

function Pipeline({
  entries,
  type,
  filter,
  setFilter,
  view,
  setView,
  updateStatus,
  bulkUpdateStatus,
  markFollowedUp,
  selectEntry,
  selectedEntryIds,
  setSelectedEntryIds
}: {
  entries: Entry[];
  type: PipelineType;
  filter: string;
  setFilter: (value: string) => void;
  view: "kanban" | "table";
  setView: (value: "kanban" | "table") => void;
  updateStatus: (id: Entry["id"], status: string) => void;
  bulkUpdateStatus: (status: string) => Promise<void>;
  markFollowedUp: (id: Entry["id"]) => void;
  selectEntry: (entry: Entry) => void;
  selectedEntryIds: string[];
  setSelectedEntryIds: (value: string[]) => void;
}) {
  const stages = getStages(type);
  const pipelineEntries = entries.filter((entry) => entry.type === type && (filter === "All" || entry.platform === filter));
  const platforms = ["All", ...Array.from(new Set(entries.filter((entry) => entry.type === type).map((entry) => entry.platform)))];
  const [bulkStatus, setBulkStatus] = useState(stages[0] ?? "");

  function handleDrop(event: DragEvent<HTMLDivElement>, status: string) {
    const entryId = event.dataTransfer.getData("text/plain");
    if (!entryId) return;
    updateStatus(entryId, status);
  }

  return (
    <section className="pipeline-space">
      <div className="toolbar">
        <div className="segmented">
          <button className={view === "kanban" ? "selected" : ""} onClick={() => setView("kanban")}>
            Kanban
          </button>
          <button className={view === "table" ? "selected" : ""} onClick={() => setView("table")}>
            Table
          </button>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
        {view === "table" && (
          <div className="row-actions">
            <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
            <button
              onClick={() => void bulkUpdateStatus(bulkStatus)}
              disabled={!selectedEntryIds.length}
              title={!selectedEntryIds.length ? "Select entries first" : "Apply status to selected entries"}
            >
              Apply to {selectedEntryIds.length} selected
            </button>
            <button onClick={() => setSelectedEntryIds([])} disabled={!selectedEntryIds.length}>
              Clear
            </button>
          </div>
        )}
      </div>

      {view === "kanban" ? (
        <div className="kanban">
          {stages.map((stage) => (
            <div
              className="kanban-column"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, stage)}
            >
              <div className="column-heading">
                <strong>{stage}</strong>
                <span>{pipelineEntries.filter((entry) => entry.status === stage).length}</span>
              </div>
              {pipelineEntries
                .filter((entry) => entry.status === stage)
                .map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    selectEntry={selectEntry}
                    updateStatus={updateStatus}
                    markFollowedUp={markFollowedUp}
                    stages={stages}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Opportunity</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Value</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {pipelineEntries.map((entry) => (
                <tr key={entry.id} onClick={() => selectEntry(entry)}>
                  <td onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedEntryIds.includes(String(entry.id))}
                      onChange={(event) => {
                        const id = String(entry.id);
                        if (event.target.checked) {
                          setSelectedEntryIds([...selectedEntryIds, id]);
                        } else {
                          setSelectedEntryIds(selectedEntryIds.filter((value) => value !== id));
                        }
                      }}
                    />
                  </td>
                  <td>
                    <strong>{entry.title}</strong>
                    <span>{entry.company}</span>
                  </td>
                  <td>{entry.platform}</td>
                  <td>{entry.status}</td>
                  <td>{entry.value}</td>
                  <td>{daysSince(entry.lastUpdated)}d ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EntryCard({
  entry,
  selectEntry,
  updateStatus,
  markFollowedUp,
  stages
}: {
  entry: Entry;
  selectEntry: (entry: Entry) => void;
  updateStatus: (id: Entry["id"], status: string) => void;
  markFollowedUp: (id: Entry["id"]) => void;
  stages: string[];
}) {
  return (
    <article
      className={isStale(entry) ? "entry-card stale" : "entry-card"}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(entry.id));
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => selectEntry(entry)}
    >
      <div className="card-topline">
        <span>{entry.platform}</span>
        <em>{daysSince(entry.lastUpdated)}d</em>
      </div>
      <strong>{entry.title}</strong>
      <p>{entry.company}</p>
      <div className="card-meta">
        <span>{entry.value}</span>
        <span>{entry.workType}</span>
      </div>
      <select
        value={entry.status}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => updateStatus(entry.id, event.target.value)}
      >
        {stages.map((stage) => (
          <option key={stage}>{stage}</option>
        ))}
      </select>
      <button
        className="card-action"
        onClick={(event) => {
          event.stopPropagation();
          markFollowedUp(entry.id);
        }}
      >
        Followed Up
      </button>
    </article>
  );
}

function Reminders({
  entries,
  markFollowedUp,
  updateStatus,
  snoozeReminder,
  clearSnooze,
  snoozedUntilMap
}: {
  entries: Entry[];
  markFollowedUp: (id: Entry["id"]) => void;
  updateStatus: (id: Entry["id"], status: string) => void;
  snoozeReminder: (id: Entry["id"], days: number) => void;
  clearSnooze: (id: Entry["id"]) => void;
  snoozedUntilMap: Record<string, string>;
}) {
  return (
    <section className="panel full">
      <div className="section-heading">
        <h2>Follow-up queue</h2>
        <p>Jobs stale after 14 days, freelance leads after 7 days</p>
      </div>
      <div className="reminder-list">
        {entries.length ? (
          entries.map((entry) => (
            <div className="reminder-row" key={entry.id}>
              <div>
                <strong>{entry.title}</strong>
                <span>
                  {entry.company} - {entry.status} - {daysSince(entry.lastUpdated)} days quiet
                </span>
              </div>
              <div className="row-actions">
                <button onClick={() => markFollowedUp(entry.id)}>Followed Up</button>
                <button onClick={() => snoozeReminder(entry.id, 3)}>Snooze 3d</button>
                <button onClick={() => snoozeReminder(entry.id, 7)}>Snooze 7d</button>
                {snoozedUntilMap[String(entry.id)] && <button onClick={() => clearSnooze(entry.id)}>Clear Snooze</button>}
                <button onClick={() => updateStatus(entry.id, entry.type === "job" ? "Ghosted" : "Lost")}>
                  {entry.type === "job" ? "Ghosted" : "Lost"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty">Nothing needs attention. Clean board.</p>
        )}
      </div>
    </section>
  );
}

function Settings({
  entries,
  activityLog,
  setEmptyMode,
  setSampleMode,
  mode,
  logCsvExport,
  dataMode,
  cloudSettings,
  settingsStatus,
  onSaveCloudSettings,
  healthStatus,
  onCheckCloudHealth,
  staleEntriesCount,
  snoozedEntriesCount,
  cloudDataStatus,
  resetLocalData
}: {
  entries: Entry[];
  activityLog: ActivityLog[];
  setEmptyMode: () => void;
  setSampleMode: () => void;
  mode: "sample" | "empty";
  logCsvExport: () => void;
  dataMode: DataMode;
  cloudSettings: CloudSettings;
  settingsStatus: "idle" | "saving" | "saved" | "error";
  onSaveCloudSettings: (next: CloudSettings) => Promise<void>;
  healthStatus: HealthStatus;
  onCheckCloudHealth: () => Promise<void>;
  staleEntriesCount: number;
  snoozedEntriesCount: number;
  cloudDataStatus: "idle" | "loading" | "ready" | "error";
  resetLocalData: () => void;
}) {
  const [exportTypeFilter, setExportTypeFilter] = useState<"all" | "job" | "freelance">("all");
  const [exportStatusFilter, setExportStatusFilter] = useState("all");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [activityActionFilter, setActivityActionFilter] = useState("all");
  const [activityQuery, setActivityQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const exportStatuses = Array.from(new Set(entries.map((entry) => entry.status))).sort();
  const filteredEntriesForExport = entries.filter((entry) => {
    if (exportTypeFilter !== "all" && entry.type !== exportTypeFilter) return false;
    if (exportStatusFilter !== "all" && entry.status !== exportStatusFilter) return false;
    if (exportFrom && entry.lastUpdated < exportFrom) return false;
    if (exportTo && entry.lastUpdated > exportTo) return false;
    return true;
  });
  const csv = buildEntriesCsv(filteredEntriesForExport);
  const activityActionOptions = Array.from(new Set(activityLog.map((activity) => activity.action))).sort();
  const visibleActivity = activityLog
    .filter((activity) => (activityActionFilter === "all" ? true : activity.action === activityActionFilter))
    .filter((activity) => {
      if (!activityQuery.trim()) return true;
      const q = activityQuery.toLowerCase();
      return activity.note.toLowerCase().includes(q) || activity.action.toLowerCase().includes(q);
    })
    .slice(0, 30);
  let healthMessage = "No health check yet.";
  if (healthStatus.status === "loading") {
    healthMessage = "Running health check...";
  } else if (healthStatus.status === "ok") {
    healthMessage = healthStatus.message;
  } else if (healthStatus.status === "error") {
    healthMessage = healthStatus.message ?? "Health check reported an issue.";
  }

  async function downloadCsv() {
    setIsExporting(true);
    try {
      if (dataMode === "cloud") {
        const search = new URLSearchParams();
        if (exportTypeFilter !== "all") search.set("type", exportTypeFilter);
        if (exportStatusFilter !== "all") search.set("status", exportStatusFilter);
        if (exportFrom) search.set("from", exportFrom);
        if (exportTo) search.set("to", exportTo);
        const response = await fetch(`/api/export?${search.toString()}`, { cache: "no-store" });
        if (!response.ok) return;
        const text = await response.text();
        const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `laju-entries-${currentDate}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        logCsvExport();
        return;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `laju-entries-${currentDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      logCsvExport();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="settings-grid">
      <div className="panel">
        <div className="section-heading">
          <h2>Onboarding mode</h2>
          <p>Choose validation mode for first-run behavior</p>
        </div>
        <p className="helper">Current mode: {mode === "empty" ? "Empty" : "Sample data"}</p>
        <div className="row-actions">
          <button onClick={setSampleMode}>Use Sample Data</button>
          <button onClick={setEmptyMode}>Start Empty</button>
        </div>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Reminder thresholds</h2>
          <p>MVP defaults</p>
        </div>
        <label>
          Jobs
          <input
            type="number"
            value={cloudSettings.jobReminderDays}
            min={1}
            max={60}
            onChange={(event) =>
              void onSaveCloudSettings({
                ...cloudSettings,
                jobReminderDays: Number(event.target.value || 14)
              })
            }
          />
        </label>
        <label>
          Freelance
          <input
            type="number"
            value={cloudSettings.freelanceReminderDays}
            min={1}
            max={60}
            onChange={(event) =>
              void onSaveCloudSettings({
                ...cloudSettings,
                freelanceReminderDays: Number(event.target.value || 7)
              })
            }
          />
        </label>
        <label>
          Default currency
          <select
            value={cloudSettings.currency}
            onChange={(event) =>
              void onSaveCloudSettings({
                ...cloudSettings,
                currency: event.target.value as "IDR" | "USD"
              })
            }
          >
            <option>IDR</option>
            <option>USD</option>
          </select>
        </label>
        <p className="helper">
          {dataMode === "cloud"
            ? settingsStatus === "saving"
              ? "Saving settings..."
              : settingsStatus === "saved"
                ? "Settings saved."
                : settingsStatus === "error"
                  ? "Failed to save settings."
                  : "Cloud settings active."
            : "Local demo mode active. Settings are not persisted to cloud."}
        </p>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Ops monitor</h2>
          <p>Live operational snapshot</p>
        </div>
        <div className="ops-grid">
          <article className="stat-card inline">
            <span>Cloud Data</span>
            <strong>{cloudDataStatus}</strong>
          </article>
          <article className="stat-card inline">
            <span>Needs Attention</span>
            <strong>{staleEntriesCount}</strong>
          </article>
          <article className="stat-card inline">
            <span>Snoozed Reminders</span>
            <strong>{snoozedEntriesCount}</strong>
          </article>
        </div>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Cloud health</h2>
          <p>Quick runtime checks for auth and database</p>
        </div>
        <button onClick={() => void onCheckCloudHealth()} disabled={healthStatus.status === "loading"}>
          {healthStatus.status === "loading" ? "Checking..." : "Run Health Check"}
        </button>
        <p className="helper">{healthMessage}</p>
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Invite whitelist</h2>
          <p>Manual invite control for v0.1</p>
        </div>
        <input placeholder="name@example.com" />
        <button>Add Invite</button>
      </div>
      <div className="panel wide">
        <div className="section-heading">
          <h2>CSV export</h2>
          <p>Download filtered export plus preview</p>
        </div>
        <div className="filter-row">
          <label>
            Type
            <select value={exportTypeFilter} onChange={(event) => setExportTypeFilter(event.target.value as "all" | "job" | "freelance")}>
              <option value="all">All</option>
              <option value="job">Job</option>
              <option value="freelance">Freelance</option>
            </select>
          </label>
          <label>
            Status
            <select value={exportStatusFilter} onChange={(event) => setExportStatusFilter(event.target.value)}>
              <option value="all">All</option>
              {exportStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input type="date" value={exportFrom} onChange={(event) => setExportFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={exportTo} onChange={(event) => setExportTo(event.target.value)} />
          </label>
        </div>
        <button onClick={() => void downloadCsv()} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Download CSV"}
        </button>
        <p className="helper">{filteredEntriesForExport.length} entries in export selection.</p>
        <textarea value={csv} readOnly />
      </div>
      <div className="panel wide">
        <div className="section-heading">
          <h2>Activity log</h2>
          <p>Search and filter recent audit trail</p>
        </div>
        <div className="filter-row">
          <label>
            Action
            <select value={activityActionFilter} onChange={(event) => setActivityActionFilter(event.target.value)}>
              <option value="all">All</option>
              {activityActionOptions.map((action) => (
                <option key={action} value={action}>
                  {action.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Search
            <input
              placeholder="Search note or action"
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="activity-list compact">
          {visibleActivity.map((activity) => (
            <div className="activity-row" key={activity.id}>
              <div>
                <strong>{activity.note}</strong>
                <span>{activity.action.replaceAll("_", " ")}</span>
              </div>
              <em>{activity.createdAt}</em>
            </div>
          ))}
          {!visibleActivity.length && <p className="empty">No activity matches this filter.</p>}
        </div>
      </div>
      <div className="panel danger-panel">
        <div className="section-heading">
          <h2>Local data</h2>
          <p>Reset only the browser prototype data</p>
        </div>
        <button onClick={resetLocalData}>Reset Local Data</button>
      </div>
    </section>
  );
}

type GateAStats = {
  thisWeekActiveDays: number;
  averagePerWeek: number;
  aligned: boolean;
};

type DataMode = "local" | "cloud";
type CloudSettings = {
  jobReminderDays: number;
  freelanceReminderDays: number;
  currency: "IDR" | "USD";
  aiEnabled: boolean;
};

type OperationNotice = {
  type: "success" | "error";
  message: string;
} | null;

type HealthStatus =
  | { status: "idle" | "loading" }
  | { status: "ok"; message: string }
  | { status: "error"; message?: string };

function sameId(a: Entry["id"], b: Entry["id"]) {
  return String(a) === String(b);
}

function addDaysIso(baseDate: string, days: number) {
  const base = new Date(`${baseDate}T12:00:00+08:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function buildGateAStats(activityLog: ActivityLog[]): GateAStats {
  const now = new Date(`${currentDate}T12:00:00+08:00`);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const daysByWeek = [0, 0, 0, 0];

  const uniqueActivityDays = new Set(
    activityLog
      .map((activity) => new Date(`${activity.createdAt}T12:00:00+08:00`))
      .filter((day) => !Number.isNaN(day.getTime()))
      .map((day) => day.toISOString().slice(0, 10))
  );

  Array.from(uniqueActivityDays).forEach((isoDay) => {
    const day = new Date(`${isoDay}T12:00:00+08:00`);
    const diffMs = now.getTime() - day.getTime();
    if (diffMs < 0 || diffMs >= 4 * weekMs) return;
    const weekIndex = Math.floor(diffMs / weekMs);
    daysByWeek[weekIndex] += 1;
  });

  const thisWeekActiveDays = daysByWeek[0];
  const averagePerWeek = daysByWeek.reduce((sum, value) => sum + value, 0) / daysByWeek.length;
  const aligned = daysByWeek.every((days) => days >= 4);

  return { thisWeekActiveDays, averagePerWeek, aligned };
}

function CreateEntry({ close, addEntry }: { close: () => void; addEntry: (formData: FormData) => void }) {
  return (
    <form action={addEntry} className="drawer-form">
      <div className="drawer-heading">
        <div>
          <p>New opportunity</p>
          <h2>Add entry</h2>
        </div>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      <label>
        Pipeline
        <select name="type" defaultValue="job">
          <option value="job">Job Application</option>
          <option value="freelance">Freelance Project</option>
        </select>
      </label>
      <label>
        Title
        <input name="title" placeholder="Role or project name" required />
      </label>
      <label>
        Company / Client
        <input name="company" placeholder="Company or client" required />
      </label>
      <label>
        Platform
        <input name="platform" placeholder="LinkedIn, Glints, Direct..." />
      </label>
      <label>
        Location
        <input name="location" placeholder="Remote, Jakarta, Singapore..." />
      </label>
      <label>
        Currency
        <select name="currency" defaultValue="IDR">
          <option>IDR</option>
          <option>USD</option>
        </select>
      </label>
      <label>
        Value
        <input name="value" placeholder="18-25m/mo or 900/project" />
      </label>
      <label>
        Notes
        <textarea name="notes" placeholder="Context, follow-up note, next step" />
      </label>
      <button className="primary" type="submit">
        Save Entry
      </button>
    </form>
  );
}

function EntryDetail({
  entry,
  updateEntry,
  deleteEntry,
  close
}: {
  entry: Entry;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: Entry["id"]) => void;
  close: () => void;
}) {
  const stages = getStages(entry.type);
  const [draft, setDraft] = useState<Entry>(entry);

  useEffect(() => {
    setDraft(entry);
  }, [entry]);

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.company.trim()) return;
    updateEntry({
      ...draft,
      title: draft.title.trim(),
      company: draft.company.trim(),
      platform: draft.platform.trim() || "Direct",
      location: draft.location.trim() || "Remote",
      value: draft.value.trim() || "TBD"
    });
  }

  return (
    <form className="drawer-form" onSubmit={saveEntry}>
      <div className="drawer-heading">
        <div>
          <p>{draft.platform}</p>
          <h2>{draft.title}</h2>
        </div>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      <div className="detail-stack">
        <span>{draft.company}</span>
        <span>{draft.location}</span>
        <span>{draft.value}</span>
      </div>
      <label>
        Title
        <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
      </label>
      <label>
        Company / Client
        <input value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} />
      </label>
      <label>
        Platform
        <input value={draft.platform} onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value }))} />
      </label>
      <label>
        Location
        <input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
      </label>
      <div className="form-row">
        <label>
          Currency
          <select value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as Entry["currency"] }))}>
            <option>IDR</option>
            <option>USD</option>
          </select>
        </label>
        <label>
          Work Type
          <select value={draft.workType} onChange={(event) => setDraft((current) => ({ ...current, workType: event.target.value as Entry["workType"] }))}>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>Onsite</option>
          </select>
        </label>
      </div>
      <label>
        Value
        <input value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} />
      </label>
      <label>
        Status
        <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
          {stages.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <section className="notes-block">
        <h3>Notes</h3>
        <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
      </section>
      <section className="timeline">
        <h3>Activity</h3>
        <div>
          <strong>{draft.status}</strong>
          <span>Updated {daysSince(draft.lastUpdated)} days ago</span>
        </div>
      </section>
      <div className="drawer-actions">
        <button className="primary" type="submit">
          Save Changes
        </button>
        <button className="danger-button" type="button" onClick={() => deleteEntry(entry.id)}>
          Delete Entry
        </button>
      </div>
    </form>
  );
}
