"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PostForm from "./PostForm";
import PostRow from "./PostRow";
import PostImageCard from "./PostImageCard";
import AnnouncementBanner from "./AnnouncementBanner";

type Tab = "recent" | "top" | "archived";
type Sort = "score-desc" | "score-asc" | "newest" | "oldest";

export default function CategoryContent({
  categoryId,
  categoryName,
  rulesGuidelines: initialRules = null,
}: {
  categoryId: string;
  categoryName: string;
  rulesGuidelines?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("recent");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rulesGuidelines, setRulesGuidelines] = useState<string | null>(initialRules ?? null);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesEditValue, setRulesEditValue] = useState(initialRules ?? "");
  const [savingRules, setSavingRules] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setRulesGuidelines(initialRules ?? null);
    setRulesEditValue(initialRules ?? "");
  }, [initialRules, categoryId]);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setCurrentUserId(d.user?.id ?? null);
        setIsAdmin(!!d.user?.isAdmin);
      })
      .catch(() => setCurrentUserId(null));
  }, []);

  async function loadPosts() {
    setLoading(true);
    const qs = new URLSearchParams({ tab, sort, page: String(page) });
    const res = await fetch(`/api/posts?categoryId=${categoryId}&${qs}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, [categoryId, tab, sort, page]);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/category-follows?categoryId=${categoryId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFollowing(!!d.following))
      .catch(() => setFollowing(false));
  }, [categoryId, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/category-follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryId, action: following ? "unfollow" : "follow" }),
      });
      const data = await res.json();
      if (res.ok) setFollowing(data.following);
    } finally {
      setFollowLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "recent", label: "Most Recent" },
    { key: "top", label: "Highest Score" },
    { key: "archived", label: "Archived" },
  ];

  const IMAGE_ONLY_CATEGORIES = ["humor-funny-memes", "humor-funny-caps"];
  const isImageOnlyCategory = IMAGE_ONLY_CATEGORIES.includes(categoryId);

  const sorts: { key: Sort; label: string }[] = [
    { key: "score-desc", label: "Highest to Lowest" },
    { key: "score-asc", label: "Lowest to Highest" },
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
  ];

  return (
    <div style={{ maxWidth: "900px" }}>
      <AnnouncementBanner />
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--glass-border)",
          paddingBottom: "0.5rem",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            style={{
              background: tab === t.key ? "var(--glass)" : "transparent",
              border: "1px solid var(--glass-border)",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              color: tab === t.key ? "var(--gold-bright)" : "var(--gold-dim)",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--gold)",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {categoryName}
        </h1>
        {currentUserId && (
          <button
            type="button"
            onClick={handleFollow}
            disabled={followLoading}
            style={{
              padding: "0.4rem 0.9rem",
              fontSize: "0.85rem",
              background: following ? "var(--glass)" : "transparent",
              border: "1px solid var(--gold)",
              borderRadius: "6px",
              color: following ? "var(--gold-bright)" : "var(--gold-dim)",
              cursor: followLoading ? "wait" : "pointer",
            }}
          >
            {followLoading ? "..." : following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Rules & Guidelines */}
      <div
        className="glass-panel"
        style={{
          padding: "0.5rem 0.65rem",
          marginBottom: "0.75rem",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-dim)", margin: 0 }}>
            Rules & Guidelines
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (editingRules) {
                  setEditingRules(false);
                  setRulesEditValue(rulesGuidelines ?? "");
                } else {
                  setRulesEditValue(rulesGuidelines ?? "");
                  setEditingRules(true);
                }
              }}
              style={{
                background: "none",
                border: "none",
                padding: "0.2rem",
                cursor: "pointer",
                color: "var(--gold-dim)",
                fontSize: "0.9rem",
              }}
              title="Edit rules"
            >
              ✎
            </button>
          )}
        </div>
        {editingRules && isAdmin ? (
          <div>
            <textarea
              value={rulesEditValue}
              onChange={(e) => setRulesEditValue(e.target.value)}
              style={{
                width: "100%",
                minHeight: "48px",
                padding: "0.35rem 0.5rem",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--glass-border)",
                borderRadius: "4px",
                color: "var(--gold-bright)",
                fontSize: "0.75rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
              <button
                type="button"
                onClick={async () => {
                  setSavingRules(true);
                  const res = await fetch("/api/admin/categories", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ categoryId, rulesGuidelines: rulesEditValue }),
                  });
                  if (res.ok) {
                    setRulesGuidelines(rulesEditValue || null);
                    setEditingRules(false);
                  }
                  setSavingRules(false);
                }}
                disabled={savingRules}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.7rem",
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "4px",
                  color: "#000",
                  cursor: savingRules ? "wait" : "pointer",
                }}
              >
                {savingRules ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingRules(false);
                  setRulesEditValue(rulesGuidelines ?? "");
                }}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.7rem",
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
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "var(--gold-dim)",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            {rulesGuidelines || "No rules or guidelines set."}
          </p>
        )}
      </div>

      {/* Post form */}
      <PostForm categoryId={categoryId} onPostCreated={() => setPage(1)} />

      {/* Sort dropdown */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "1.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <label style={{ fontSize: "0.8rem", color: "var(--gold-dim)" }}>
          Sort:
        </label>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as Sort);
            setPage(1);
          }}
          style={{
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            borderRadius: "6px",
            padding: "0.35rem 0.75rem",
            color: "var(--gold-bright)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Post rows / image grid */}
      <div className="glass-panel" style={{ padding: "1rem", background: "var(--glass-dark)" }}>
        {loading ? (
          <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>
            No posts yet. Be the first to post!
          </div>
        ) : isImageOnlyCategory ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: "900px" }}>
              {posts.map((post) => (
                <PostImageCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: "var(--gold-bright)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--gold-dim)" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: "var(--gold-bright)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: "var(--gold-bright)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--gold-dim)" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "var(--glass)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    color: "var(--gold-bright)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
