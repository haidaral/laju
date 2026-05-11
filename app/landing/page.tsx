import Link from "next/link";
import { PublicShell } from "../components/PublicShell";

export default function LandingPage() {
  return (
    <PublicShell>
      <section className="public-main">
        <div className="public-hero">
          <div className="public-copy">
            <h1>Keep every career opportunity moving.</h1>
            <p>
              Laju is a dual-pipeline tracker for people managing job applications and freelance leads at the same time. It keeps follow-ups, status changes, and outcomes in one place.
            </p>
            <div className="public-actions">
              <Link className="primary" href="/">
                Open App
              </Link>
              <Link className="text-link" href="/help">
                Read the v0.1 guide
              </Link>
            </div>
          </div>
          <div className="product-preview" aria-label="Laju product preview">
            <div className="preview-topbar">
              <strong>Today</strong>
              <span>2 need attention</span>
            </div>
            <div className="preview-body">
              <div className="preview-row">
                <div>
                  <strong>Jobs</strong>
                  <span>Applications</span>
                </div>
                <span>Applied to Interview to Offer</span>
                <strong>14d rule</strong>
              </div>
              <div className="preview-row">
                <div>
                  <strong>Freelance</strong>
                  <span>Client leads</span>
                </div>
                <span>Lead to Proposal to Paid</span>
                <strong>7d rule</strong>
              </div>
              <div className="preview-row">
                <div>
                  <strong>Export</strong>
                  <span>CSV backup</span>
                </div>
                <span>Entries and activity log stay portable</span>
                <strong>v0.1</strong>
              </div>
            </div>
          </div>
        </div>

        <section className="public-section">
          <h2>Built for the habit first.</h2>
          <p>
            v0.1 is deliberately focused: add opportunities quickly, move them through the right pipeline, and see what needs a follow-up today.
          </p>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Two real pipelines</h3>
              <p>Jobs and freelance leads have different stages, fields, and follow-up expectations.</p>
            </article>
            <article className="feature-card">
              <h3>Reminder queue</h3>
              <p>Jobs become stale after 14 days. Freelance leads become stale after 7 days.</p>
            </article>
            <article className="feature-card">
              <h3>Portable data</h3>
              <p>CSV export and activity history make the tracker useful before deeper integrations exist.</p>
            </article>
          </div>
        </section>
      </section>
    </PublicShell>
  );
}
