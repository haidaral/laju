"use client";

import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from "react";
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
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(initialActivityLog);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pipelineView, setPipelineView] = useState<"kanban" | "table">("kanban");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LajuLocalState;
        setEntries(parsed.entries?.length ? parsed.entries : initialEntries);
        setActivityLog(parsed.activityLog?.length ? parsed.activityLog : initialActivityLog);
      } catch {
        setEntries(initialEntries);
        setActivityLog(initialActivityLog);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ entries, activityLog }));
  }, [activityLog, entries, isHydrated]);

  const activeEntries = entries.filter((entry) => !isTerminal(entry));
  const completedEntries = entries.filter((entry) => isTerminal(entry));
  const staleEntries = entries.filter(isStale);
  const wins = entries.filter((entry) => ["Accepted", "Paid"].includes(entry.status)).length;
  const winRate = completedEntries.length ? Math.round((wins / completedEntries.length) * 100) : 0;

  const recentActivity = useMemo(
    () => [...activityLog].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [activityLog]
  );

  function updateStatus(entryId: number, status: string) {
    const entryBeforeUpdate = entries.find((entry) => entry.id === entryId);
    if (!entryBeforeUpdate || entryBeforeUpdate.status === status) return;

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

  function markFollowedUp(entryId: number) {
    const entryBeforeUpdate = entries.find((entry) => entry.id === entryId);
    if (!entryBeforeUpdate) return;

    setEntries((current) => current.map((entry) => (entry.id === entryId ? { ...entry, lastUpdated: currentDate } : entry)));
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

  function updateEntry(updatedEntry: Entry) {
    const existingEntry = entries.find((entry) => entry.id === updatedEntry.id);
    if (!existingEntry) return;

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

  function deleteEntry(entryId: number) {
    const entryToDelete = entries.find((entry) => entry.id === entryId);
    if (!entryToDelete) return;

    setEntries((current) => current.filter((entry) => entry.id !== entryId));
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

  function addEntry(formData: FormData) {
    const type = formData.get("type") as PipelineType;
    const title = String(formData.get("title") || "").trim();
    const company = String(formData.get("company") || "").trim();

    if (!title || !company) return;

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
          <strong>{entries.length} entries tracked</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{activeView === "overview" ? "Today" : "Pipeline"}</p>
            <h1>{viewTitle(activeView)}</h1>
          </div>
          <button className="primary" onClick={() => setIsCreating(true)}>
            Add Entry
          </button>
        </header>

        {activeView === "overview" && (
          <Overview entries={entries} activeEntries={activeEntries} staleEntries={staleEntries} winRate={winRate} recentActivity={recentActivity} />
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
            selectEntry={setSelectedEntry}
          />
        )}

        {activeView === "reminders" && <Reminders entries={staleEntries} markFollowedUp={markFollowedUp} updateStatus={updateStatus} />}

        {activeView === "settings" && <Settings entries={entries} activityLog={activityLog} resetLocalData={() => {
          setEntries(initialEntries);
          setActivityLog(initialActivityLog);
          setSelectedEntry(null);
        }} />}
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
  recentActivity
}: {
  entries: Entry[];
  activeEntries: Entry[];
  staleEntries: Entry[];
  winRate: number;
  recentActivity: ActivityLog[];
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
  selectEntry
}: {
  entries: Entry[];
  type: PipelineType;
  filter: string;
  setFilter: (value: string) => void;
  view: "kanban" | "table";
  setView: (value: "kanban" | "table") => void;
  updateStatus: (id: number, status: string) => void;
  selectEntry: (entry: Entry) => void;
}) {
  const stages = getStages(type);
  const pipelineEntries = entries.filter((entry) => entry.type === type && (filter === "All" || entry.platform === filter));
  const platforms = ["All", ...Array.from(new Set(entries.filter((entry) => entry.type === type).map((entry) => entry.platform)))];

  function handleDrop(event: DragEvent<HTMLDivElement>, status: string) {
    const rawEntryId = event.dataTransfer.getData("text/plain");
    const entryId = Number(rawEntryId);
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
                  <EntryCard key={entry.id} entry={entry} selectEntry={selectEntry} updateStatus={updateStatus} stages={stages} />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
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
  stages
}: {
  entry: Entry;
  selectEntry: (entry: Entry) => void;
  updateStatus: (id: number, status: string) => void;
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
    </article>
  );
}

function Reminders({
  entries,
  markFollowedUp,
  updateStatus
}: {
  entries: Entry[];
  markFollowedUp: (id: number) => void;
  updateStatus: (id: number, status: string) => void;
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
  resetLocalData
}: {
  entries: Entry[];
  activityLog: ActivityLog[];
  resetLocalData: () => void;
}) {
  const csv = buildEntriesCsv(entries);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `laju-entries-${currentDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="settings-grid">
      <div className="panel">
        <div className="section-heading">
          <h2>Reminder thresholds</h2>
          <p>MVP defaults</p>
        </div>
        <label>
          Jobs
          <input type="number" defaultValue={14} min={1} max={60} />
        </label>
        <label>
          Freelance
          <input type="number" defaultValue={7} min={1} max={60} />
        </label>
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
          <p>Downloadable export plus local preview</p>
        </div>
        <button onClick={downloadCsv}>Download CSV</button>
        <textarea value={csv} readOnly />
      </div>
      <div className="panel wide">
        <div className="section-heading">
          <h2>Local activity log</h2>
          <p>Browser-persisted audit trail until Supabase is wired</p>
        </div>
        <div className="activity-list compact">
          {activityLog.slice(0, 8).map((activity) => (
            <div className="activity-row" key={activity.id}>
              <div>
                <strong>{activity.note}</strong>
                <span>{activity.action.replaceAll("_", " ")}</span>
              </div>
              <em>{activity.createdAt}</em>
            </div>
          ))}
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
  deleteEntry: (id: number) => void;
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
