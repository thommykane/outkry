"use client";

import { useState, useEffect } from "react";

export default function AdminSettings() {
  const [topScoreThreshold, setTopScoreThreshold] = useState<number>(25);
  const [archiveScore, setArchiveScore] = useState<number>(500);
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
        Score thresholds
      </h3>
      <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
        These values control which posts appear in the &quot;Highest Score&quot; and &quot;Archived&quot; tabs on category pages. Changes take effect after users refresh.
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
        {message != null && (
          <p style={{ fontSize: "0.85rem", color: message.startsWith("Saved") ? "var(--gold)" : "#e5534b" }}>
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
            alignSelf: "flex-start",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
