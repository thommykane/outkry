"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
type UserInfo = { username: string; isAdmin: boolean; isModerator: boolean };

type CategoryChild = { id: string; name: string; slug?: string; children?: CategoryChild[] };
type CategoryWithSection = { id: string; name: string; menuSection?: string; children: CategoryChild[] };
type Section = { id: string; name: string; sortOrder?: number };

export default function Sidebar() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [categoryTree, setCategoryTree] = useState<CategoryWithSection[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  function loadData() {
    const cacheBust = `_t=${Date.now()}`;
    Promise.all([
      fetch(`/api/categories?${cacheBust}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/menu-sections?${cacheBust}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([catData, secData]) => {
        setCategoryTree(Array.isArray(catData.tree) ? catData.tree : []);
        setSections(Array.isArray(secData.sections) ? secData.sections : []);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("categories-updated", handler);
    return () => window.removeEventListener("categories-updated", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      fetch("/api/me", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setUser(d.user))
        .catch(() => setUser(null));
    };
    window.addEventListener("user-updated", handler);
    return () => window.removeEventListener("user-updated", handler);
  }, []);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside
      className="glass-panel scrollbar-thin"
      style={{
        width: "260px",
        minWidth: "260px",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        borderRadius: 0,
        borderRight: "1px solid var(--glass-border)",
      }}
    >
<Link
          href="/"
        style={{
          padding: "1rem",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Image
          src="/logo.png"
          alt="Outkry"
          width={150}
          height={150}
          style={{ objectFit: "contain" }}
        />
      </Link>

      {user && (
        <Link
          href={user.isAdmin ? "/admin" : `/u/${user.username}`}
          style={{ display: "block", padding: "0.5rem 1rem", fontSize: "0.8rem", color: "var(--gold-dim)", borderBottom: "1px solid var(--glass-border)" }}
        >
          {user.isAdmin ? "Admin" : user.isModerator ? "Moderator" : "Member"}
        </Link>
      )}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {(sections.length > 0 || categoryTree.length > 0)
          ? (() => {
              const sectionList = sections.length > 0 ? sections : [{ id: "discussion", name: "Categories", sortOrder: 0 }];
              const sectionIds = new Set(sectionList.map((s) => s.id));
              const hasOther =
                sectionList.length > 0 &&
                categoryTree.some(
                  (cat) => !sectionIds.has((cat.menuSection ?? "discussion").trim() || "discussion")
                );
              const sectionsWithOther =
                sectionList.length > 0
                  ? [...sectionList, ...(hasOther ? [{ id: "__other__", name: "Other", sortOrder: 999 }] : [])]
                  : sectionList;
              return sectionsWithOther.map((sec) => {
                const catsInSection =
                  sectionList.length > 0
                    ? categoryTree
                        .filter((cat) => {
                          const ms = (cat.menuSection ?? "discussion").trim() || "discussion";
                          if (sec.id === "__other__") return !sectionIds.has(ms);
                          return ms === sec.id;
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                    : [...categoryTree].sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div key={sec.id}>
                  <div
                    style={{
                      background: "#000",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textAlign: "left",
                      marginTop: sec.id !== (sectionList[0] || { id: "" }).id ? "0.5rem" : 0,
                    }}
                  >
                    {sec.name}
                  </div>
                  {catsInSection.map((cat) => {
                    const isOpen = openIds.has(cat.id);
                    return (
                      <div key={cat.id}>
                        <button
                          onClick={() => toggle(cat.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5rem 1rem",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--glass-border)",
                            color: "var(--gold-bright)",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            textAlign: "left",
                            minWidth: 0,
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0, overflowWrap: "break-word", wordBreak: "break-word" }}>{cat.name}</span>
                          <span style={{ color: "var(--gold-dim)", fontSize: "1rem", lineHeight: 1 }}>
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              paddingLeft: "1rem",
                              paddingRight: "1rem",
                              paddingBottom: "0.5rem",
                              animation: "fadeIn 0.3s ease-out",
                            }}
                          >
                            {cat.children.map((ch) =>
                              ch.children && ch.children.length > 0 ? (
                                <div key={ch.id}>
                                  <button
                                    type="button"
                                    onClick={() => toggle(ch.id)}
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "0.35rem 0",
                                      background: "none",
                                      border: "none",
                                      color: "var(--gold-dim)",
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                      textAlign: "left",
                                    }}
                                  >
                                    <span>{ch.name}</span>
                                    <span style={{ fontSize: "0.9rem" }}>{openIds.has(ch.id) ? "−" : "+"}</span>
                                  </button>
                                  {openIds.has(ch.id) && (
                                    <div style={{ paddingLeft: "0.75rem", paddingBottom: "0.35rem" }}>
                                      {ch.children.map((gch) => (
                                        <Link
                                          key={gch.id}
                                          href={`/c/${gch.id}`}
                                          style={{
                                            display: "block",
                                            padding: "0.3rem 0",
                                            fontSize: "0.8rem",
                                            color: "var(--gold-dim)",
                                            overflowWrap: "break-word",
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {gch.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Link
                                  key={ch.id}
                                  href={`/c/${ch.id}`}
                                  style={{
                                    display: "block",
                                    padding: "0.4rem 0",
                                    fontSize: "0.85rem",
                                    color: "var(--gold-dim)",
                                    borderBottom: "1px solid var(--glass-border)",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {ch.name}
                                </Link>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            });
            })()
          : (
            <div style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--gold-dim)" }}>
              Loading menu...
            </div>
          )}
      </nav>
    </aside>
  );
}
