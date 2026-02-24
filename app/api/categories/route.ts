import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { CATEGORY_TREE } from "@/lib/categories";

export const dynamic = "force-dynamic";

function fallbackTree() {
  return CATEGORY_TREE.map((cat) => ({
    ...cat,
    menuSection: "discussion" as const,
  }));
}

type FlatCat = { id: string; parentId: string | null; name: string; slug: string; sortOrder: number | null; menuSection?: string | null };
type TreeChild = { id: string; slug: string; name: string; children?: TreeChild[] };

export async function GET() {
  try {
    const dbCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));

    if (dbCategories.length === 0) {
      const res = NextResponse.json({ tree: fallbackTree() });
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.headers.set("Pragma", "no-cache");
      return res;
    }

    const flat = dbCategories as FlatCat[];
    const norm = (s: string | null | undefined) => (s == null ? "" : String(s).trim().toLowerCase());
    const parentIdMatches = (childParentId: string | null | undefined, pid: string) =>
      norm(childParentId) === norm(pid);
    const buildChildren = (parentId: string, all: FlatCat[]): TreeChild[] =>
      all
        .filter((c) => parentIdMatches(c.parentId, parentId))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((ch) => {
          const nested = buildChildren(ch.id, all);
          return {
            id: ch.id,
            slug: ch.slug,
            name: ch.name,
            ...(nested.length > 0 ? { children: nested } : {}),
          };
        });
    const parents = flat.filter((c) => c.parentId == null || String(c.parentId).trim() === "");
    const tree = parents
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((p) => ({
        id: p.id,
        name: p.name,
        menuSection: p.menuSection || "discussion",
        children: buildChildren(p.id, flat),
      }));

    const res = NextResponse.json({ tree });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  } catch (err) {
    console.error("[api/categories]", err);
    const fallback = NextResponse.json({ tree: fallbackTree() });
    fallback.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    fallback.headers.set("Pragma", "no-cache");
    return fallback;
  }
}
