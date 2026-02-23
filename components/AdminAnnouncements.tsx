"use client";

import { useState, useEffect } from "react";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      loadAnnouncements();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    if (res.ok) loadAnnouncements();
  }

  async function handleToggle(id: string, active: boolean) {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) loadAnnouncements();
  }

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", color: "var(--gold)", marginBottom: "0.75rem" }}>
          Create announcement (pinned at top of all categories)
        </h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "0.5rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
          }}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "0.5rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            resize: "vertical",
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || !body.trim()}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--glass)",
            border: "1px solid var(--gold)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            cursor: creating ? "wait" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create announcement"}
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--gold-dim)", padding: "2rem" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              className="glass-panel"
              style={{
                padding: "1rem",
                opacity: a.active ? 1 : 0.6,
                borderLeft: a.active ? "3px solid var(--gold)" : "3px solid var(--gold-dim)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <h4 style={{ color: "var(--gold-bright)", marginBottom: "0.25rem" }}>{a.title}</h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--gold-dim)", whiteSpace: "pre-wrap" }}>{a.body}</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--gold-dim)" }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggle(a.id, a.active)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "var(--glass)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "4px",
                      color: "var(--gold-bright)",
                      cursor: "pointer",
                    }}
                  >
                    {a.active ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "rgba(229,83,75,0.2)",
                      border: "1px solid #e5534b",
                      borderRadius: "4px",
                      color: "#e5534b",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>
              No announcements. Create one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
