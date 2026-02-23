"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const res = await fetch("/api/admin/posts");
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  async function handleDelete(postId: string) {
    if (!confirm("Permanently delete this post?")) return;
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    if (res.ok) loadPosts();
  }

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      {loading ? (
        <div style={{ color: "var(--gold-dim)", padding: "2rem" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {posts.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <Link href={`/post/${p.id}`} style={{ color: "var(--gold-bright)", flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{p.title}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--gold-dim)", marginLeft: "0.5rem" }}>
                  {p.categoryId} · by {p.author?.username || "?"}
                </span>
              </Link>
              <span style={{ fontSize: "0.8rem", color: "var(--gold-dim)", marginRight: "0.5rem" }}>
                score: {p.score}
              </span>
              <button
                onClick={() => handleDelete(p.id)}
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
          ))}
          {posts.length === 0 && (
            <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>No posts yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
