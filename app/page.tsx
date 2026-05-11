"use client";

import { useEffect, useMemo, useState } from "react";
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
              <EntryDetail entry={selectedEntry} updateStatus={updateStatus} close={() => setSelectedEntry(null)} />
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
            <div className="kanban-column" key={stage}>
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
    <article className={isStale(entry) ? "entry-card stale" : "entry-card"} onClick={() => selectEntry(entry)}>
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
  updateStatus,
  close
}: {
  entry: Entry;
  updateStatus: (id: number, status: string) => void;
  close: () => void;
}) {
  const stages = getStages(entry.type);
  return (
    <div className="drawer-form">
      <div className="drawer-heading">
        <div>
          <p>{entry.platform}</p>
          <h2>{entry.title}</h2>
        </div>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      <div className="detail-stack">
        <span>{entry.company}</span>
        <span>{entry.location}</span>
        <span>{entry.value}</span>
      </div>
      <label>
        Status
        <select value={entry.status} onChange={(event) => updateStatus(entry.id, event.target.value)}>
          {stages.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </select>
      </label>
      <section className="notes-block">
        <h3>Notes</h3>
        <p>{entry.notes || "No notes yet."}</p>
      </section>
      <section className="timeline">
        <h3>Activity</h3>
        <div>
          <strong>{entry.status}</strong>
          <span>Updated {daysSince(entry.lastUpdated)} days ago</span>
        </div>
      </section>
    </div>
  );
}
