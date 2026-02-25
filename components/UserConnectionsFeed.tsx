"use client";

import { useState, useEffect } from "react";
import PostRow from "./PostRow";

export default function UserConnectionsFeed({ userId, currentUserId }: { userId: string; currentUserId: string | null }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || currentUserId !== userId) {
      setLoading(false);
      return;
    }
    fetch(`/api/connections?userId=${userId}&mode=posts`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, [userId, currentUserId]);

  if (loading) return <div style={{ color: "var(--gold-dim)" }}>Loading...</div>;
  if (posts.length === 0) return <div style={{ color: "var(--gold-dim)" }}>No posts from connections yet.</div>;

  return (
    <div className="glass-panel" style={{ padding: "1rem" }}>
      {posts.map((post) => (
        <PostRow key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
