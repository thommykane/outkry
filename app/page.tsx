import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        padding: "2rem 1.5rem",
        textAlign: "center",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem", color: "var(--gold-bright)" }}>
        Welcome to Outkry
      </h1>
      <p style={{ color: "var(--gold-dim)", marginBottom: "2rem" }}>
        Expression · Debate · Community · Ownership
      </p>

      <div
        style={{
          border: "2px solid var(--gold)",
          borderRadius: "12px",
          padding: "2rem 2.5rem",
          marginBottom: "2rem",
          textAlign: "left",
          background: "var(--glass-dark)",
          boxShadow:
            "0 0 20px rgba(201, 162, 39, 0.4), 0 0 40px rgba(201, 162, 39, 0.2), inset 0 0 60px rgba(201, 162, 39, 0.03)",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            textDecoration: "underline",
            marginBottom: "1rem",
            color: "var(--gold-bright)",
            fontSize: "1.35rem",
          }}
        >
          Welcome
        </h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          A Place to Speak Freely Again
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          The internet was supposed to be the greatest expansion of human
          expression in history.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Instead, it slowly became controlled.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          Controlled by algorithms.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          Controlled by corporations.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Controlled by a handful of tech giants who quietly decide what can be
          seen, what gets buried, and what disappears.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          Speech became filtered.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          Debate became managed.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Communities became sanitized.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Outkry was built because many of us feel that something important has
          been lost.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          This platform exists to restore open dialogue. To create a space where
          people can speak, debate, question, create, and connect without
          walking on eggshells or worrying about invisible hands shaping the
          conversation.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          We believe adults can handle disagreement.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          We believe ideas should compete openly.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          We believe communities should define themselves — not be micromanaged
          from a distant corporate boardroom.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          Outkry is not about chaos.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          It is about ownership.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff" }}>
          It is about transparency.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          It is about building something new.
        </p>
        <p style={{ marginBottom: "2rem", lineHeight: 1.7, color: "#fff" }}>
          This is a community shaped by its users.
        </p>
        <p style={{ marginBottom: "2rem", lineHeight: 1.7, color: "#fff" }}>
          Welcome to the conversation.
        </p>

        <h2
          style={{
            fontWeight: 700,
            textDecoration: "underline",
            marginBottom: "1rem",
            color: "var(--gold-bright)",
            fontSize: "1.35rem",
          }}
        >
          How to Use Outkry
        </h2>

        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff" }}>
          <strong>1. Create Your Account</strong>
        </p>
        <p style={{ marginBottom: "1.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Sign up and set up your profile. Once you&apos;re in, the platform
          opens up to you.
        </p>

        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff" }}>
          <strong>2. Explore Categories</strong>
        </p>
        <p style={{ marginBottom: "1.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Browse the boards and categories that interest you. Each board has its
          own focus and culture.
        </p>

        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff" }}>
          <strong>3. Follow What You Care About</strong>
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          You can follow any category you enjoy. When new posts are created in
          that category, you&apos;ll receive notifications.
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          You can also follow individual users whose content you value. When
          they post, you&apos;ll know.
        </p>
        <p style={{ marginBottom: "1.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Build your own custom feed based on what matters to you.
        </p>

        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff" }}>
          <strong>4. Post, Engage, Vote</strong>
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Every post can be voted up or down.
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Every post you create can be voted up or down.
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          A post&apos;s score equals:
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Positive Votes – Negative Votes
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Community feedback determines visibility.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          • Posts that reach –5 are automatically removed.
        </p>
        <p style={{ marginBottom: "0.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          • Posts that reach +25 are featured on the High Score Page.
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          • Posts that reach +100 are permanently preserved in the Archive Page.
        </p>
        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          The community decides what rises.
        </p>
        <p style={{ marginBottom: "1.25rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          The community decides what falls.
        </p>

        <p style={{ marginBottom: "0.5rem", lineHeight: 1.7, color: "#fff" }}>
          <strong>5. Respect Board Rules</strong>
        </p>
        <p style={{ marginBottom: "2rem", lineHeight: 1.7, color: "#fff", paddingLeft: "1rem" }}>
          Each board has its own rules and guidelines pinned at the top of the
          page. Before posting, review them. Communities thrive when
          expectations are clear.
        </p>
        <p style={{ marginBottom: "2rem", lineHeight: 1.7, color: "#fff" }}>
          Outkry is structured freedom — not disorder.
        </p>

        <h2
          style={{
            fontWeight: 700,
            textDecoration: "underline",
            marginBottom: "1rem",
            color: "var(--gold-bright)",
            fontSize: "1.35rem",
          }}
        >
          Legal Disclaimer
        </h2>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Outkry supports open dialogue and the broad exchange of ideas.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          However, freedom of expression does not mean freedom from the law.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          Any content that violates applicable local, state, federal, or
          international law is strictly prohibited. Users who post illegal
          material may face removal, account termination, and potential legal
          consequences.
        </p>
        <p style={{ marginBottom: "1rem", lineHeight: 1.7, color: "#fff" }}>
          By using Outkry, you agree to follow all applicable laws and the
          rules of each board.
        </p>
        <p style={{ marginBottom: "2rem", lineHeight: 1.7, color: "#fff" }}>
          Freedom requires responsibility.
        </p>

        <div style={{ textAlign: "center" }}>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              background: "var(--gold)",
              border: "1px solid var(--gold-bright)",
              borderRadius: "8px",
              color: "#000",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Join
          </Link>
        </div>
      </div>
    </main>
  );
}
