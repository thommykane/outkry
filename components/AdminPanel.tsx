"use client";

import { useState } from "react";
import AdminUsers from "./AdminUsers";
import AdminCategories from "./AdminCategories";
import AdminPosts from "./AdminPosts";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminSections from "./AdminSections";
import AdminSettings from "./AdminSettings";

type Tab = "users" | "sections" | "categories" | "posts" | "announcements" | "settings";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("users");

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "sections", label: "Sections" },
    { key: "categories", label: "Categories" },
    { key: "posts", label: "Posts" },
    { key: "announcements", label: "Announcements" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--glass-border)",
          paddingBottom: "0.75rem",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
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
      {tab === "users" && <AdminUsers />}
      {tab === "sections" && <AdminSections />}
      {tab === "categories" && <AdminCategories />}
      {tab === "posts" && <AdminPosts />}
      {tab === "announcements" && <AdminAnnouncements />}
      {tab === "settings" && <AdminSettings />}
    </div>
  );
}
