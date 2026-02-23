"use client";

import Link from "next/link";
import { useState } from "react";
import { isAnonymousCategory, getAnonymousDisplayName } from "@/lib/anonymous";
import FeaturedImage from "@/components/FeaturedImage";

export default function PostImageCard({ post, currentUserId }: { post: any; currentUserId?: string | null }) {
  const [score, setScore] = useState(post.score ?? 0);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwnPost = Boolean(currentUserId && post.authorId === currentUserId);
  const isAnon = isAnonymousCategory(post.categoryId || "");
  const displayName = isAnon ? getAnonymousDisplayName(post.authorId) : post.author?.username;

  const handleVote = async (e: React.MouseEvent, value: 1 | -1) => {
    e.preventDefault();
    e.stopPropagation();
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
        setScore(data.newScore);
        setVoted(value === 1 ? "up" : "down");
      }
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = score >= 0 ? "#fff" : "#e5534b";

  return (
    <Link
      href={`/post/${post.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid var(--glass-border)",
          marginBottom: "1.5rem",
        }}
      >
        {post.featuredImageUrl ? (
          <FeaturedImage
            src={post.featuredImageUrl}
            alt={post.title}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "85vh",
              objectFit: "contain",
              display: "block",
              verticalAlign: "bottom",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-dim)",
              fontSize: "3rem",
            }}
          >
            —
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "1rem 1.25rem",
            background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
            color: "#fff",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {post.title}
          </h3>
          {(post.author || isAnon) && (
            <span style={{ fontSize: "0.75rem", color: "var(--gold-dim)", marginTop: "0.25rem", display: "block" }}>
              {displayName}
            </span>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              onClick={(e) => handleVote(e, 1)}
              disabled={loading || isOwnPost}
              style={{
                background: "none",
                border: "none",
                color: voted === "up" ? "var(--gold)" : "rgba(255,255,255,0.7)",
                cursor: loading || isOwnPost ? "not-allowed" : "pointer",
                padding: "0.15rem",
                fontSize: "0.9rem",
                opacity: isOwnPost ? 0.5 : 1,
              }}
            >
              ▲
            </button>
            <span style={{ color: scoreColor, fontWeight: 600, fontSize: "0.9rem", minWidth: "1.5rem" }}>{score}</span>
            <button
              onClick={(e) => handleVote(e, -1)}
              disabled={loading || isOwnPost}
              style={{
                background: "none",
                border: "none",
                color: voted === "down" ? "#e5534b" : "rgba(255,255,255,0.7)",
                cursor: loading || isOwnPost ? "not-allowed" : "pointer",
                padding: "0.15rem",
                fontSize: "0.9rem",
                opacity: isOwnPost ? 0.5 : 1,
              }}
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
