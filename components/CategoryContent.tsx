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
  defaultTab: initialTab = "recent",
  isMainPage = false,
  isRandomPage = false,
}: {
  categoryId: string;
  categoryName: string;
  rulesGuidelines?: string | null;
  defaultTab?: "recent" | "top";
  isMainPage?: boolean;
  isRandomPage?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
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
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);

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
    const qs = isRandomPage ? "" : new URLSearchParams({ tab, sort, page: String(page) }).toString();
    const url = qs ? `/api/posts?categoryId=${categoryId}&${qs}` : `/api/posts?categoryId=${categoryId}`;
    const res = await fetch(url);
    const data = await res.json();
    setPosts(data.posts || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, [categoryId, tab, sort, page, isRandomPage]);

  async function handleRandomize() {
    if (isRandomizing) return;
    setIsRandomizing(true);
    await new Promise((r) => setTimeout(r, 2000));
    await loadPosts();
    setIsRandomizing(false);
  }

  useEffect(() => {
    if (!currentUserId || isMainPage) return;
    fetch(`/api/category-follows?categoryId=${categoryId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFollowing(!!d.following))
      .catch(() => setFollowing(false));
  }, [categoryId, currentUserId, isMainPage]);

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

  const IMAGE_ONLY_CATEGORIES = ["humor-funny-memes", "humor-funny-caps", "social-beautiful-people"];
  const isImageOnlyCategory = IMAGE_ONLY_CATEGORIES.includes(categoryId);

  const sorts: { key: Sort; label: string }[] = [
    { key: "score-desc", label: "Highest to Lowest" },
    { key: "score-asc", label: "Lowest to Highest" },
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
  ];

  return (
    <div style={{ maxWidth: "900px", marginLeft: "auto", marginRight: "auto", width: "100%", textAlign: "left" }}>
      <AnnouncementBanner />
      {isRandomPage && (
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
            }}
          >
            {categoryName}
          </h1>
          <button
            type="button"
            onClick={handleRandomize}
            disabled={isRandomizing}
            style={{
              padding: "0.4rem 0.9rem",
              fontSize: "0.85rem",
              background: "#2d5016",
              border: "1px solid #3d6b20",
              borderRadius: "6px",
              color: "#a8e06c",
              cursor: isRandomizing ? "wait" : "pointer",
            }}
          >
            Randomize
          </button>
        </div>
      )}
      {!isMainPage && !isRandomPage && (
      <>
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
        <button
          type="button"
          onClick={() => setShowPostForm((prev) => !prev)}
          style={{
            padding: "0.4rem 0.9rem",
            fontSize: "0.85rem",
            background: showPostForm ? "var(--glass)" : "#2d5016",
            border: showPostForm ? "1px solid var(--glass-border)" : "1px solid #3d6b20",
            borderRadius: "6px",
            color: showPostForm ? "var(--gold-dim)" : "#a8e06c",
            cursor: "pointer",
          }}
        >
          Post
        </button>
      </div>

      {/* Rules & Guidelines + Post form (expand downward when Post clicked) */}
      {showPostForm && (
      <>
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

      </>
      )}

      {/* Sort dropdown + top pagination + Purge (admin) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
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
        {totalPages > 1 && (
          <>
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
          </>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setPurgeModalOpen(true);
              setPurgeConfirmText("");
            }}
            style={{
              padding: "0.4rem 0.8rem",
              background: "var(--glass)",
              border: "1px solid #8b2a2a",
              borderRadius: "6px",
              color: "#e88",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Purge Category
          </button>
        )}
      </div>

      {/* Purge category modal (admin) */}
      {purgeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => e.target === e.currentTarget && setPurgeModalOpen(false)}
        >
          <div
            style={{
              background: "var(--glass-dark)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "1.25rem",
              maxWidth: "420px",
              width: "90%",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setPurgeModalOpen(false)}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "none",
                border: "none",
                color: "var(--gold-dim)",
                fontSize: "1.25rem",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--gold-bright)", lineHeight: 1.5 }}>
              Are you sure you wish to purge all posts in this category? This action cannot be undone. If not, click the X to close this window, if you truly wish to purge the category, please type the word &quot;Purge&quot; in the field below.
            </p>
            <input
              type="text"
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              placeholder='Type "Purge"'
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.5rem 0.75rem",
                background: "var(--glass)",
                border: "1px solid var(--glass-border)",
                borderRadius: "6px",
                color: "var(--gold-bright)",
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPurgeModalOpen(false)}
                style={{
                  padding: "0.4rem 0.8rem",
                  background: "var(--glass)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  color: "var(--gold-dim)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purgeConfirmText.trim() !== "Purge" || purgeLoading}
                onClick={async () => {
                  if (purgeConfirmText.trim() !== "Purge" || purgeLoading) return;
                  setPurgeLoading(true);
                  try {
                    const res = await fetch("/api/admin/purge-category", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ categoryId }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setPurgeModalOpen(false);
                      setPurgeConfirmText("");
                      setPosts([]);
                      setTotalPages(1);
                      setPage(1);
                      loadPosts();
                    } else {
                      alert(data.error || "Purge failed");
                    }
                  } finally {
                    setPurgeLoading(false);
                  }
                }}
                style={{
                  padding: "0.4rem 0.8rem",
                  background: purgeConfirmText.trim() === "Purge" && !purgeLoading ? "#8b2a2a" : "var(--glass)",
                  border: "1px solid #8b2a2a",
                  borderRadius: "6px",
                  color: purgeConfirmText.trim() === "Purge" && !purgeLoading ? "#fff" : "#e88",
                  cursor: purgeConfirmText.trim() === "Purge" && !purgeLoading ? "pointer" : "not-allowed",
                  opacity: purgeConfirmText.trim() === "Purge" && !purgeLoading ? 1 : 0.7,
                }}
              >
                {purgeLoading ? "Purging..." : "Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {isMainPage && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
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
          <span style={{ fontSize: "0.85rem", color: "var(--gold-dim)" }}>
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

      {/* Post rows / image grid */}
      <div style={isRandomPage ? { position: "relative" } : undefined}>
        <div className="glass-panel" style={{ padding: "1rem", background: "var(--glass-dark)" }}>
          {loading ? (
            <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ color: "var(--gold-dim)", padding: "2rem", textAlign: "center" }}>
              {isRandomPage ? "No posts yet." : "No posts yet. Be the first to post!"}
            </div>
          ) : isRandomPage ? (
            <div
              style={{
                position: "relative",
                marginBottom: "0.75rem",
                paddingTop: "1.5rem",
                paddingLeft: "0.5rem",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  background: "#000",
                  color: "#fff",
                  padding: "0.35rem 0.75rem 0.4rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                  boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={posts[0].categoryName ?? ""}
              >
                {posts[0].categoryName ?? "—"}
              </div>
              <div style={{ minWidth: 0 }}>
                <PostRow
                  post={posts[0]}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDeleted={() => setPosts([])}
                />
              </div>
            </div>
          ) : isMainPage ? (
          <>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  position: "relative",
                  marginBottom: "0.75rem",
                  paddingTop: "1.5rem",
                  paddingLeft: "0.5rem",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "#000",
                    color: "#fff",
                    padding: "0.35rem 0.75rem 0.4rem 0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                    boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    maxWidth: "160px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={post.categoryName ?? ""}
                >
                  {post.categoryName ?? "—"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <PostRow
                    post={post}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                  />
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
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
        {isRandomPage && isRandomizing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(80,80,80,0.75)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "8px",
            }}
          >
            <img
              src="/die.png"
              alt=""
              width={125}
              height={125}
              className="random-die-spin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
