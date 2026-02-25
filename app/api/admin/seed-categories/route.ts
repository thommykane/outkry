import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CATEGORY_TREE } from "@/lib/categories";
import { getAdminSession } from "@/lib/admin";

export async function POST() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const cat of CATEGORY_TREE) {
    const parentExists = (await db.select().from(categories).where(eq(categories.id, cat.id))).length > 0;
    if (!parentExists) {
      await db.insert(categories).values({
        id: cat.id,
        slug: cat.id,
        name: cat.name,
        parentId: null,
        sortOrder: 0,
      });
    }
    for (let i = 0; i < cat.children.length; i++) {
      const ch = cat.children[i];
      const childExists = (await db.select().from(categories).where(eq(categories.id, ch.id))).length > 0;
      if (!childExists) {
        await db.insert(categories).values({
          id: ch.id,
          slug: ch.slug,
          name: ch.name,
          parentId: cat.id,
          sortOrder: i,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
