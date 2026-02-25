"use client";

import { useState, useEffect } from "react";

export default function ProfileConnectButton({
  profileUserId,
  currentUserId,
}: {
  profileUserId: string;
  currentUserId: string | null;
}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!currentUserId || currentUserId === profileUserId) {
      setChecking(false);
      return;
    }
    fetch(`/api/connections?mode=check&checkConnectedUserId=${profileUserId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setConnected(!!d.connected))
      .finally(() => setChecking(false));
  }, [profileUserId, currentUserId]);

  const handleClick = async () => {
    if (!currentUserId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          connectedUserId: profileUserId,
          action: connected ? "disconnect" : "connect",
        }),
      });
      const data = await res.json();
      if (res.ok) setConnected(data.connected);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === profileUserId || checking) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        marginTop: "0.5rem",
        padding: "0.4rem 0.9rem",
        fontSize: "0.85rem",
        background: connected ? "var(--glass)" : "var(--gold)",
        border: `1px solid ${connected ? "var(--glass-border)" : "var(--gold)"}`,
        borderRadius: "6px",
        color: connected ? "var(--gold-bright)" : "#000",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "..." : connected ? "Connected" : "Connect"}
    </button>
  );
}
