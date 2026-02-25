"use client";

import { useState, useEffect } from "react";

export default function AdminSettings() {
  const [topScoreThreshold, setTopScoreThreshold] = useState<number>(25);
  const [archiveScore, setArchiveScore] = useState<number>(500);
  const [autoDeleteScore, setAutoDeleteScore] = useState<number>(-10);
  const [mainPageOrder, setMainPageOrder] = useState<"recent" | "top">("recent");
  const [settingsSection, setSettingsSection] = useState<"score" | "main" | "auto">("score");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) {
        setTopScoreThreshold(data.topScoreThreshold ?? 25);
        setArchiveScore(data.archiveScore ?? 500);
        setAutoDeleteScore(data.autoDeleteScore ?? -10);
        setMainPageOrder(data.mainPageOrder === "top" ? "top" : "recent");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topScoreThreshold: topScoreThreshold,
          archiveScore: archiveScore,
          autoDeleteScore: autoDeleteScore,
          mainPageOrder: mainPageOrder,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Saved. Changes take effect on refresh.");
      } else {
        setMessage(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <p style={{ color: "var(--gold-dim)" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", color: "var(--gold)", marginBottom: "0.75rem" }}>
        Settings
      </h3>
      <div style={{ marginBottom: "1rem" }}>
        <select
          value={settingsSection}
          onChange={(e) => setSettingsSection(e.target.value as "score" | "main" | "auto")}
          style={{
            padding: "0.4rem 0.75rem",
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          <option value="score">Score thresholds</option>
          <option value="auto">Auto-delete at score</option>
          <option value="main">Main page settings</option>
        </select>
      </div>

      {settingsSection === "score" && (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
            Which posts appear in the &quot;Highest Score&quot; and &quot;Archived&quot; tabs. Changes take effect after refresh.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "0.35rem" }}>
                Minimum score for &quot;Highest Score&quot; tab
              </label>
              <input
                type="number"
                min={0}
                value={topScoreThreshold}
                onChange={(e) => setTopScoreThreshold(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--gold-bright)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "0.35rem" }}>
                Minimum score for &quot;Archived&quot; tab
              </label>
              <input
                type="number"
                min={0}
                value={archiveScore}
                onChange={(e) => setArchiveScore(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--gold-bright)",
                }}
              />
            </div>
          </div>
        </>
      )}

      {settingsSection === "auto" && (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
            When a post&apos;s score reaches this number or lower, it is automatically deleted. Use a negative number (e.g. -10).
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "0.35rem" }}>
                Auto-delete when score reaches
              </label>
              <input
                type="number"
                value={autoDeleteScore}
                onChange={(e) => setAutoDeleteScore(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--gold-bright)",
                }}
              />
            </div>
          </div>
        </>
      )}

      {settingsSection === "main" && (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
            Default order for the main page (/c/all-main-page): most recent first or highest voted first.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "320px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "0.35rem" }}>
                Main page default order
              </label>
              <select
                value={mainPageOrder}
                onChange={(e) => setMainPageOrder(e.target.value as "recent" | "top")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--gold-bright)",
                }}
              >
                <option value="recent">Most recent first</option>
                <option value="top">Highest voted first</option>
              </select>
            </div>
          </div>
        </>
      )}

      {message != null && (
        <p style={{ fontSize: "0.85rem", color: message.startsWith("Saved") ? "var(--gold)" : "#e5534b", marginTop: "1rem" }}>
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "0.5rem 1rem",
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          borderRadius: "6px",
          color: "var(--gold-bright)",
          cursor: saving ? "wait" : "pointer",
          marginTop: "1rem",
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
