import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ marginBottom: "1rem", color: "var(--gold-bright)" }}>
        Welcome to Outkry
      </h1>
      <p style={{ color: "var(--gold-dim)", marginBottom: "2rem" }}>
        Community · Reddit · Discord · 4chan
      </p>
      <Link
        href="/c/us-politics-white-house"
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          borderRadius: "8px",
          color: "var(--gold-bright)",
        }}
      >
        Browse Categories →
      </Link>
    </main>
  );
}
