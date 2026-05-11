import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="public-shell">
      <header className="public-nav">
        <Link className="brand" href="/landing" aria-label="Laju landing page">
          <div className="brand-mark">L</div>
          <div>
            <strong>Laju</strong>
            <span>Career pipeline</span>
          </div>
        </Link>
        <nav className="public-nav-links" aria-label="Public navigation">
          <Link href="/help">Help</Link>
          <Link href="/changelog">Changelog</Link>
          <Link href="/">Open App</Link>
        </nav>
      </header>
      {children}
      <footer className="public-footer">
        <span>Laju v0.1 invite build</span>
        <span>Tracker first. AI later, after usage is proven.</span>
      </footer>
    </main>
  );
}
