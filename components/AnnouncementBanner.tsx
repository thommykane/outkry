"use client";

import { useState, useEffect } from "react";

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements || []));
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {announcements.map((a) => (
        <div
          key={a.id}
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "0.5rem",
            borderLeft: "4px solid var(--gold)",
          }}
        >
          <h4 style={{ color: "var(--gold)", fontSize: "0.95rem", marginBottom: "0.35rem" }}>{a.title}</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
            {a.body}
          </p>
        </div>
      ))}
    </div>
  );
}
