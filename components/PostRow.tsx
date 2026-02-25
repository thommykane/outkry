"use client";

import Link from "next/link";
import { useState } from "react";
import { isAnonymousCategory, getAnonymousDisplayName } from "@/lib/anonymous";
import FeaturedImage from "@/components/FeaturedImage";

const MAX_EXCERPT_CHARS = 300;

function excerpt(text: string) {
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > MAX_EXCERPT_CHARS ? cleaned.slice(0, MAX_EXCERPT_CHARS) + "..." : cleaned;
}

export default function PostRow({
  post,
  currentUserId,
  isAdmin,
  onDeleted,
  isSaved: initialSaved,
  onSaved,
}: {
  post: any;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onDeleted?: (postId: string) => void;
  isSaved?: boolean;
  onSaved?: (postId: string, saved: boolean) => void;
}) {
  const [score, setScore] = useState(post.score ?? 0);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [saveLoading, setSaveLoading] = useState(false);

  const isOwnPost = Boolean(currentUserId && post.authorId === currentUserId);
  const isAnon = isAnonymousCategory(post.categoryId || "");
  const displayName = isAnon ? getAnonymousDisplayName(post.authorId) : post.author?.username;

  const handleVote = async (value: 1 | -1) => {
    if (loading || isOwnPost) return;
    setLoading(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, value }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.deleted && onDeleted) onDeleted(post.id);
        else {
          setScore(data.newScore);
          setVoted(value === 1 ? "up" : "down");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = score >= 0 ? "#fff" : "#e5534b";

  const handleDelete = async () => {
    if (!isAdmin || !onDeleted) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) onDeleted(post.id);
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete post");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId || isOwnPost || saveLoading) return;
    setSaveLoading(true);
    try {
      const action = saved ? "unsave" : "save";
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId: post.id, action }),
      });
      if (res.ok) {
        const next = !saved;
        setSaved(next);
        onSaved?.(post.id, next);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const showSave = Boolean(currentUserId && !isOwnPost);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.25rem",
        padding: "1.25rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        minHeight: "180px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: "170px",
        }}
      >
        {(post.author || isAnon) && (
          isAnon ? (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--gold-dim)",
                marginBottom: "0.5rem",
              }}
            >
              {displayName}
            </span>
          ) : (
            <Link
              href={`/u/${post.author.username}`}
              style={{
                fontSize: "0.85rem",
                color: "var(--gold-dim)",
                marginBottom: "0.5rem",
              }}
            >
              {displayName}
            </Link>
          )
        )}
        <div
          style={{
            width: 150,
            height: 150,
            background: "rgba(0,0,0,0.4)",
            borderRadius: "8px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {post.featuredImageUrl ? (
            <FeaturedImage
              src={post.featuredImageUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold-dim)",
                fontSize: "1rem",
              }}
            >
              —
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            onClick={() => handleVote(1)}
            disabled={loading || isOwnPost}
            style={{
              background: "none",
              border: "none",
              color: voted === "up" ? "var(--gold)" : "var(--gold-dim)",
              cursor: loading || isOwnPost ? "not-allowed" : "pointer",
              padding: 0,
              fontSize: "1.1rem",
              lineHeight: 1,
              opacity: isOwnPost ? 0.5 : 1,
            }}
          >
            ▲
          </button>
          <span
            style={{
              color: scoreColor,
              fontWeight: 600,
              fontSize: "1.1rem",
              minWidth: "2rem",
              textAlign: "center",
            }}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={loading || isOwnPost}
            style={{
              background: "none",
              border: "none",
              color: voted === "down" ? "#e5534b" : "var(--gold-dim)",
              cursor: loading || isOwnPost ? "not-allowed" : "pointer",
              padding: 0,
              fontSize: "1.1rem",
              lineHeight: 1,
              opacity: isOwnPost ? 0.5 : 1,
            }}
          >
            ▼
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <Link
            href={`/post/${post.id}`}
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: 700,
              fontSize: "1.15rem",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {post.title}
          </Link>
          {showSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              style={{
                flexShrink: 0,
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                background: "transparent",
                border: `1px solid ${saved ? "var(--gold)" : "var(--gold-dim)"}`,
                borderRadius: "4px",
                color: saved ? "var(--gold)" : "var(--gold-dim)",
                cursor: saveLoading ? "not-allowed" : "pointer",
                opacity: saveLoading ? 0.6 : 1,
              }}
            >
              {saveLoading ? "…" : saved ? "Saved" : "Save"}
            </button>
          )}
          {isAdmin && onDeleted && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flexShrink: 0,
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                background: "transparent",
                border: "1px solid #e5534b",
                borderRadius: "4px",
                color: "#e5534b",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "…" : "Delete"}
            </button>
          )}
        </div>
        <p
          style={{
            fontSize: "0.95rem",
            color: "#fff",
            lineHeight: 1.5,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {excerpt(post.body)}
        </p>
      </div>
    </div>
  );
}
