"use client";

import { useState, useEffect, useCallback } from "react";
import PostRow from "./PostRow";

export default function UserSaves({ userId, currentUserId }: { userId: string; currentUserId: string | null }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(() => {
    if (!currentUserId || currentUserId !== userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/saves?userId=${encodeURIComponent(userId)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, [userId, currentUserId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSaved = useCallback((postId: string, saved: boolean) => {
    if (!saved) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  if (loading) return <div style={{ color: "var(--gold-dim)" }}>Loading...</div>;
  if (posts.length === 0) return <div style={{ color: "var(--gold-dim)" }}>No saved posts.</div>;

  return (
    <div className="glass-panel" style={{ padding: "1rem" }}>
      {posts.map((post) => (
        <PostRow
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isSaved
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
}
