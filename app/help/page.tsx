import { PublicShell } from "../components/PublicShell";

export default function HelpPage() {
  return (
    <PublicShell>
      <section className="public-main">
        <section className="public-section">
          <h1>Getting Started</h1>
          <p>Laju v0.1 is an invite-stage tracker. The goal is simple: replace scattered spreadsheets with one daily career pipeline.</p>
        </section>

        <section className="doc-grid">
          <article className="doc-panel">
            <h2>First 4 steps</h2>
            <ul>
              <li>Open the app dashboard.</li>
              <li>Add a job application or freelance lead.</li>
              <li>Move it through Kanban or table status controls.</li>
              <li>Check Reminders for stale opportunities.</li>
            </ul>
          </article>
          <article className="doc-panel">
            <h2>Pipeline rules</h2>
            <p>Job entries use application stages from Applied through Accepted, Rejected, or Ghosted. Freelance entries use lead stages from Lead through Paid or Lost.</p>
            <p>Every status change writes an activity event so the tracker can show what actually happened over time.</p>
          </article>
          <article className="doc-panel">
            <h2>Data ownership</h2>
            <p>The current build uses browser-local storage. Export CSV from Settings whenever you want a portable backup.</p>
          </article>
          <article className="doc-panel">
            <h2>What is not in v0.1</h2>
            <p>Authentication, remote Supabase persistence, AI scoring, document generation, Chrome extension, and billing are intentionally later phases.</p>
          </article>
        </section>
      </section>
    </PublicShell>
  );
}
