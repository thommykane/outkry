import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { CATEGORY_TREE } from "@/lib/categories";

function fallbackTree() {
  return CATEGORY_TREE.map((cat) => ({
    ...cat,
    menuSection: "discussion" as const,
  }));
}

export async function GET() {
  try {
    const dbCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));

    if (dbCategories.length === 0) {
      const res = NextResponse.json({ tree: fallbackTree() });
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.headers.set("Pragma", "no-cache");
      return res;
    }

    const parents = dbCategories.filter((c) => !c.parentId);
    const children = dbCategories.filter((c) => c.parentId);

    const tree = parents
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((p) => ({
        id: p.id,
        name: p.name,
        menuSection: p.menuSection || "discussion",
        children: children
          .filter((c) => c.parentId === p.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((ch) => ({
            id: ch.id,
            slug: ch.slug,
            name: ch.name,
          })),
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
