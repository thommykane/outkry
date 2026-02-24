"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDeletePostButton({
  postId,
  categoryId,
  style,
}: {
  postId: string;
  categoryId: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.user?.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        router.push(`/c/${categoryId}`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete post");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      style={{
        marginTop: "1rem",
        padding: "0.4rem 0.75rem",
        fontSize: "0.85rem",
        background: "transparent",
        border: "1px solid #e5534b",
        borderRadius: "6px",
        color: "#e5534b",
        cursor: deleting ? "not-allowed" : "pointer",
        opacity: deleting ? 0.6 : 1,
        ...style,
      }}
    >
      {deleting ? "Deleting…" : "Delete post"}
    </button>
  );
}
