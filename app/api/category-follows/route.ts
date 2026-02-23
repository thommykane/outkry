import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categoryFollows, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const userId = searchParams.get("userId");

    if (categoryId) {
      const sessionId = req.cookies.get("session")?.value;
      if (!sessionId) {
        return NextResponse.json({ following: false });
      }
      const { sessions } = await import("@/lib/db/schema");
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session || new Date(session.expiresAt) < new Date()) {
        return NextResponse.json({ following: false });
      }
      const [row] = await db
        .select()
        .from(categoryFollows)
        .where(and(eq(categoryFollows.userId, session.userId), eq(categoryFollows.categoryId, categoryId)))
        .limit(1);
      return NextResponse.json({ following: !!row });
    }

    if (userId) {
      const rows = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categoryFollows)
        .innerJoin(categories, eq(categoryFollows.categoryId, categories.id))
        .where(eq(categoryFollows.userId, userId));
      return NextResponse.json({ categories: rows });
    }

    return NextResponse.json({ error: "categoryId or userId required" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { sessions } = await import("@/lib/db/schema");
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const body = await req.json();
    const { categoryId, action } = body as { categoryId?: string; action?: "follow" | "unfollow" };

    if (!categoryId || !action || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json({ error: "categoryId and action (follow|unfollow) required" }, { status: 400 });
    }

    if (action === "follow") {
      const [existing] = await db
        .select()
        .from(categoryFollows)
        .where(and(eq(categoryFollows.userId, session.userId), eq(categoryFollows.categoryId, categoryId)))
        .limit(1);
      if (!existing) {
        await db.insert(categoryFollows).values({
          userId: session.userId,
          categoryId,
        });
      }
    } else {
      await db
        .delete(categoryFollows)
        .where(and(eq(categoryFollows.userId, session.userId), eq(categoryFollows.categoryId, categoryId)));
    }

    return NextResponse.json({ ok: true, following: action === "follow" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update follow" }, { status: 500 });
  }
}
