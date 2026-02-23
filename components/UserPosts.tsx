"use client";

import { useState, useEffect } from "react";
import PostRow from "./PostRow";

export default function UserPosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    fetch(`/api/posts/user/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts || []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ color: "var(--gold-dim)" }}>Loading...</div>;
  if (posts.length === 0) return <div style={{ color: "var(--gold-dim)" }}>No posts yet.</div>;

  return (
    <div className="glass-panel" style={{ padding: "1rem" }}>
      {posts.map((post) => (
        <PostRow key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
