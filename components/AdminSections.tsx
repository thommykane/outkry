"use client";

import { useState, useEffect } from "react";

export default function AdminSections() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    setLoading(true);
    const res = await fetch("/api/admin/sections", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setSections(data.sections || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      loadSections();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function handleUpdate(id: string, name: string) {
    const res = await fetch("/api/admin/sections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sectionId: id, name }),
    });
    if (res.ok) {
      setEditingId(null);
      loadSections();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this section? Categories under it must be moved first.")) return;
    const res = await fetch(`/api/admin/sections?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      loadSections();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <input
          type="text"
          placeholder="New section name (e.g. Video Board)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            padding: "0.5rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            fontSize: "0.9rem",
            minWidth: "200px",
          }}
        />
        <button
          onClick={handleCreate}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--glass)",
            border: "1px solid var(--gold)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            cursor: "pointer",
          }}
        >
          Add Section
        </button>
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem" }}>
        Sections are the menu headers in the sidebar (e.g. Discussion Board, Image Board). Create new ones and assign categories to them in the Categories tab.
      </p>

      {loading ? (
        <div style={{ color: "var(--gold-dim)", padding: "2rem" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sections.map((s) => (
            <div
              key={s.id}
              className="glass-panel"
              style={{
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {editingId === s.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(s.id, editName)}
                    autoFocus
                    style={{
                      padding: "0.35rem 0.5rem",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--gold)",
                      borderRadius: "4px",
                      color: "var(--gold-bright)",
                      fontSize: "0.9rem",
                      flex: 1,
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(s.id, editName)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "var(--gold)",
                      border: "none",
                      borderRadius: "4px",
                      color: "#000",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "var(--glass)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "4px",
                      color: "var(--gold-dim)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--gold-bright)" }}>{s.name}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--gold-dim)", marginLeft: "0.5rem" }}>({s.id})</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(s.id);
                        setEditName(s.name);
                      }}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        background: "var(--glass)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "4px",
                        color: "var(--gold-dim)",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
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
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
