import { PublicShell } from "../components/PublicShell";

export default function ChangelogPage() {
  return (
    <PublicShell>
      <section className="public-main">
        <section className="public-section">
          <h1>Changelog</h1>
          <p>Honest version notes for the invite-stage build.</p>
        </section>

        <article className="changelog-item">
          <h2>v0.1 invite build</h2>
          <p>May 2026</p>
          <h3>What is new</h3>
          <ul>
            <li>Dual job and freelance pipeline modes.</li>
            <li>Overview dashboard with stale-entry count and recent activity.</li>
            <li>Kanban and table views.</li>
            <li>Add, edit, delete, and drag-to-stage interactions.</li>
            <li>Reminder queue for stale opportunities.</li>
            <li>Local activity log and CSV export.</li>
            <li>Supabase migration contract and backend route stubs.</li>
          </ul>
          <h3>Known limits</h3>
          <ul>
            <li>Data is browser-local until Clerk and Supabase are configured.</li>
            <li>API routes return `not_configured` by design.</li>
            <li>AI profile scoring and document guidance are not part of v0.1.</li>
          </ul>
        </article>
      </section>
    </PublicShell>
  );
}
