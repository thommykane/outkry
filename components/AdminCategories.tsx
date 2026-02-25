"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [newMenuSection, setNewMenuSection] = useState("");
  const [newDefaultTab, setNewDefaultTab] = useState<"recent" | "top">("recent");
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggingSubId, setDraggingSubId] = useState<string | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    function loadSections() {
      fetch("/api/menu-sections")
        .then((r) => r.json())
        .then((d) => {
          const secs = d.sections || [];
          setSections(secs);
          setNewMenuSection((prev) => prev || secs[0]?.id || "discussion");
        })
        .catch(() => {});
    }
    loadSections();
    window.addEventListener("categories-updated", loadSections);
    return () => window.removeEventListener("categories-updated", loadSections);
  }, []);

  async function loadCategories() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      const text = await res.text();
      let data: { categories?: unknown[]; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setLoadError(res.ok ? "Invalid response" : `Failed to load (${res.status}). Try refreshing.`);
        setCategories([]);
        setLoading(false);
        return;
      }
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      if (!res.ok && data.error) setLoadError(data.error);
    } catch {
      setLoadError("Network error");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveSubcategoryOrder(parentId: string, orderedIds: string[]) {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ parentId, subcategoryOrder: orderedIds }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id !== parentId || !c.children) return c;
            const byId = new Map(c.children.map((ch: any) => [ch.id, ch]));
            return { ...c, children: orderedIds.map((id) => byId.get(id)).filter(Boolean) };
          })
        );
        window.dispatchEvent(new Event("categories-updated"));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Failed to reorder (${res.status})`);
      }
    } catch (err) {
      alert("Network error");
    }
  }

  function handleSubDragStart(e: React.DragEvent, subId: string) {
    setDraggingSubId(subId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", subId);
  }

  function handleSubDragOver(e: React.DragEvent, subId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSubId(subId);
  }

  function handleSubDragLeave() {
    setDragOverSubId(null);
  }

  function handleSubDrop(e: React.DragEvent, dropSubId: string, parentId: string, children: any[]) {
    e.preventDefault();
    setDragOverSubId(null);
    setDraggingSubId(null);
    const dragId = e.dataTransfer.getData("text/plain");
    if (!dragId || dragId === dropSubId) return;
    const ids = children.map((ch: any) => ch.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(dropSubId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId);
    saveSubcategoryOrder(parentId, reordered);
  }

  function handleSubDragEnd() {
    setDraggingSubId(null);
    setDragOverSubId(null);
  }

  async function changeSection(catId: string, section: string) {
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ categoryId: catId, menuSection: section }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, menuSection: section } : c))
      );
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function changeDefaultTab(catId: string, defaultTab: "recent" | "top") {
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ categoryId: catId, defaultTab }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          ...(c.id === catId ? { defaultTab } : {}),
          children: c.children?.map((ch: any) => (ch.id === catId ? { ...ch, defaultTab } : ch)) ?? [],
        }))
      );
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    const body: { name: string; parentId?: string; menuSection?: string; defaultTab?: "recent" | "top" } = {
      name: newName.trim(),
      parentId: newParentId || undefined,
      defaultTab: newDefaultTab,
    };
    if (!newParentId) body.menuSection = newMenuSection || sections[0]?.id || "discussion";
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewName("");
      setNewParentId("");
      loadCategories();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      loadCategories();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return cancelEditing();
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: editingId, name: editName.trim() }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === editingId) return { ...c, name: editName.trim() };
          if (c.children) {
            return {
              ...c,
              children: c.children.map((ch: any) =>
                ch.id === editingId ? { ...ch, name: editName.trim() } : ch
              ),
            };
          }
          return c;
        })
      );
      cancelEditing();
      window.dispatchEvent(new Event("categories-updated"));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update name");
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-categories", { method: "POST", credentials: "include" });
      if (res.ok) {
        await loadCategories();
        window.dispatchEvent(new Event("categories-updated"));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Seed failed (${res.status})`);
      }
    } finally {
      setSeeding(false);
    }
  }

  const allSubIds = categories.flatMap((c) => c.children?.map((ch: any) => ch.id) || []);

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--glass)",
            border: "1px solid var(--gold)",
            borderRadius: "6px",
            color: "var(--gold-bright)",
            cursor: seeding ? "wait" : "pointer",
          }}
        >
          {seeding ? "Seeding..." : "Seed default categories"}
        </button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: "0.5rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--glass-border)",
              borderRadius: "6px",
              color: "var(--gold-bright)",
              fontSize: "0.9rem",
              minWidth: "160px",
            }}
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            style={{
              padding: "0.5rem",
              background: "var(--glass)",
              border: "1px solid var(--glass-border)",
              borderRadius: "6px",
              color: "var(--gold-bright)",
              fontSize: "0.85rem",
            }}
          >
            <option value="">Top-level (parent)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!newParentId && sections.length > 0 && (
            <select
              value={newMenuSection || sections[0]?.id}
              onChange={(e) => setNewMenuSection(e.target.value)}
              style={{
                padding: "0.5rem",
                background: "var(--glass)",
                border: "1px solid var(--glass-border)",
                borderRadius: "6px",
                color: "var(--gold-bright)",
                fontSize: "0.85rem",
              }}
              title="Menu section"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={newDefaultTab}
            onChange={(e) => setNewDefaultTab(e.target.value as "recent" | "top")}
            style={{
              padding: "0.5rem",
              background: "var(--glass)",
              border: "1px solid var(--glass-border)",
              borderRadius: "6px",
              color: "var(--gold-bright)",
              fontSize: "0.85rem",
            }}
            title="Default tab on category page"
          >
            <option value="recent">Default: Most Recent</option>
            <option value="top">Default: Highest Voted</option>
          </select>
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
            Add
          </button>
        </div>
      </div>

      {loadError && (
        <div style={{ color: "#e5534b", padding: "0.75rem 0", fontSize: "0.9rem" }}>
          {loadError}
          <button
            type="button"
            onClick={() => loadCategories()}
            style={{ marginLeft: "0.5rem", padding: "0.25rem 0.5rem", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div style={{ color: "var(--gold-dim)", padding: "2rem" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {categories.length === 0 && !loadError ? (
            <p style={{ color: "var(--gold-dim)", padding: "1rem 0" }}>No categories yet. Create one above or use &quot;Seed default categories&quot;.</p>
          ) : null}
          {categories.map((cat) => (
            <div key={cat.id} className="glass-panel" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                {editingId === cat.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
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
                      onClick={saveEdit}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        background: "var(--gold)",
                        border: "1px solid var(--gold)",
                        borderRadius: "4px",
                        color: "#000",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
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
                    <Link href={`/c/${cat.id}`} style={{ color: "var(--gold)", fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                      {cat.name}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEditing(cat.id, cat.name); }}
                      style={{
                        padding: "0.2rem 0.4rem",
                        fontSize: "0.75rem",
                        background: "var(--glass)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "4px",
                        color: "var(--gold-dim)",
                        cursor: "pointer",
                      }}
                      title="Edit name"
                    >
                      Edit
                    </button>
                  </>
                )}
                <span style={{ fontSize: "0.8rem", color: "var(--gold-dim)" }}>{cat.id}</span>
                <select
                  value={cat.menuSection || "discussion"}
                  onChange={(e) => changeSection(cat.id, e.target.value)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "4px",
                    color: "var(--gold-bright)",
                    cursor: "pointer",
                  }}
                  title="Section in sidebar"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {sections.length === 0 && (
                    <>
                      <option value="discussion">Discussion Board</option>
                      <option value="image">Image Board</option>
                    </>
                  )}
                </select>
                <select
                  value={cat.defaultTab || "recent"}
                  onChange={(e) => changeDefaultTab(cat.id, e.target.value as "recent" | "top")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "4px",
                    color: "var(--gold-bright)",
                    cursor: "pointer",
                  }}
                  title="Default tab on category page"
                >
                  <option value="recent">Most Recent</option>
                  <option value="top">Highest Voted</option>
                </select>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={!!editingId}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    background: "rgba(229,83,75,0.2)",
                    border: "1px solid #e5534b",
                    borderRadius: "4px",
                    color: "#e5534b",
                    cursor: editingId ? "not-allowed" : "pointer",
                    opacity: editingId ? 0.6 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
              {cat.children?.length > 0 && (
                <div style={{ paddingLeft: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {cat.children.map((ch: any) => (
                    <div
                      key={ch.id}
                      draggable={editingId !== ch.id}
                      onDragStart={(e) => editingId !== ch.id && handleSubDragStart(e, ch.id)}
                      onDragOver={(e) => handleSubDragOver(e, ch.id)}
                      onDragLeave={handleSubDragLeave}
                      onDrop={(e) => handleSubDrop(e, ch.id, cat.id, cat.children ?? [])}
                      onDragEnd={handleSubDragEnd}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        padding: "0.2rem 0",
                        cursor: editingId === ch.id ? "default" : "grab",
                        opacity: draggingSubId === ch.id ? 0.6 : 1,
                        borderTop: dragOverSubId === ch.id ? "2px solid var(--gold)" : "2px solid transparent",
                      }}
                    >
                      <span style={{ color: "var(--gold-dim)", marginRight: "0.35rem", cursor: editingId === ch.id ? "default" : "grab" }} title="Drag to reorder">
                        ⋮⋮
                      </span>
                      {editingId === ch.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flex: 1, minWidth: 0 }}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                            autoFocus
                            style={{
                              padding: "0.25rem 0.4rem",
                              background: "rgba(0,0,0,0.3)",
                              border: "1px solid var(--gold)",
                              borderRadius: "4px",
                              color: "var(--gold-bright)",
                              fontSize: "0.85rem",
                              flex: 1,
                              minWidth: 0,
                            }}
                          />
                          <button type="button" onClick={saveEdit} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", background: "var(--gold)", border: "none", borderRadius: "4px", color: "#000", cursor: "pointer" }}>
                            Save
                          </button>
                          <button type="button" onClick={cancelEditing} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "4px", color: "var(--gold-dim)", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link href={`/c/${ch.id}`} style={{ color: "var(--gold-dim)", fontSize: "0.9rem", flex: 1 }}>
                            {ch.name}
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startEditing(ch.id, ch.name); }}
                            style={{
                              padding: "0.15rem 0.3rem",
                              fontSize: "0.7rem",
                              background: "var(--glass)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "4px",
                              color: "var(--gold-dim)",
                              cursor: "pointer",
                            }}
                            title="Edit name"
                          >
                            Edit
                          </button>
                          <select
                            value={ch.defaultTab || "recent"}
                            onChange={(e) => { e.stopPropagation(); changeDefaultTab(ch.id, e.target.value as "recent" | "top"); }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: "0.15rem 0.3rem",
                              fontSize: "0.7rem",
                              background: "var(--glass)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "4px",
                              color: "var(--gold-bright)",
                              cursor: "pointer",
                            }}
                            title="Default tab"
                          >
                            <option value="recent">Most Recent</option>
                            <option value="top">Highest Voted</option>
                          </select>
                        </>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--gold-dim)" }}>{ch.id}</span>
                      <button
                        onClick={() => handleDelete(ch.id)}
                        disabled={!!editingId}
                        style={{
                          padding: "0.2rem 0.4rem",
                          fontSize: "0.7rem",
                          background: "rgba(229,83,75,0.2)",
                          border: "1px solid #e5534b",
                          borderRadius: "4px",
                          color: "#e5534b",
                          cursor: editingId ? "not-allowed" : "pointer",
                          opacity: editingId ? 0.6 : 1,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
