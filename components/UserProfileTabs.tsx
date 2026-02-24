"use client";

import { useState } from "react";
import UserPosts from "./UserPosts";
import UserSaves from "./UserSaves";
import UserConnectionsFeed from "./UserConnectionsFeed";

type Tab = "posts" | "saves" | "connections";

export default function UserProfileTabs({
  userId,
  currentUserId,
  isOwnProfile,
}: {
  userId: string;
  currentUserId: string | null;
  isOwnProfile: boolean;
}) {
  const [tab, setTab] = useState<Tab>("posts");

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "posts", label: "My Posts", show: true },
    { key: "saves", label: "My Saves", show: isOwnProfile },
    { key: "connections", label: "My Connections", show: isOwnProfile },
  ].filter((t) => t.show);

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 1rem",
              background: tab === t.key ? "var(--glass)" : "transparent",
              border: "1px solid var(--glass-border)",
              borderRadius: "6px",
              color: tab === t.key ? "var(--gold-bright)" : "var(--gold-dim)",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "posts" && <UserPosts userId={userId} />}
      {tab === "saves" && <UserSaves userId={userId} currentUserId={currentUserId} />}
      {tab === "connections" && <UserConnectionsFeed userId={userId} currentUserId={currentUserId} />}
    </>
  );
}
