import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users, categoryFollows, categories } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToFtp, isFtpConfigured } from "@/lib/ftp-upload";
import { uploadToBlob, isBlobConfigured } from "@/lib/blob-upload";
import { getScoreThresholds } from "@/lib/settings";

const POSTS_PER_PAGE = 20;
const MAX_PAGES = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const tab = searchParams.get("tab") || "recent";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.min(parseInt(searchParams.get("page") || "1", 10), MAX_PAGES);

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId required" }, { status: 400 });
    }

    const { topScoreThreshold, archiveScore } = await getScoreThresholds();
    const offset = (page - 1) * POSTS_PER_PAGE;

    const whereClause =
      tab === "archived"
        ? and(eq(posts.categoryId, categoryId), gte(posts.score, archiveScore))
        : tab === "top"
        ? and(eq(posts.categoryId, categoryId), gte(posts.score, topScoreThreshold))
        : eq(posts.categoryId, categoryId);

    const orderBy =
      sort === "score-desc"
        ? desc(posts.score)
        : sort === "score-asc"
        ? asc(posts.score)
        : sort === "oldest"
        ? asc(posts.createdAt)
        : desc(posts.createdAt);

    const result = await db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(POSTS_PER_PAGE + 1)
      .offset(offset);

    const hasMore = result.length > POSTS_PER_PAGE;
    const items = hasMore ? result.slice(0, POSTS_PER_PAGE) : result;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(whereClause);
    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.min(Math.ceil(total / POSTS_PER_PAGE), MAX_PAGES);

    const { users } = await import("@/lib/db/schema");
    const postsWithAuthor = await Promise.all(
      items.map(async (p) => {
        const [author] = await db.select().from(users).where(eq(users.id, p.authorId)).limit(1);
        return {
          ...p,
          author: author ? { username: author.username, avatarUrl: author.avatarUrl } : null,
        };
      })
    );

    return NextResponse.json({
      posts: postsWithAuthor,
      totalPages,
      total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ posts: [], totalPages: 1, total: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Login required to post" }, { status: 401 });
    }

    const { sessions, users } = await import("@/lib/db/schema");
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (user?.banned) {
      const stillBanned = !user.bannedUntil || new Date(user.bannedUntil) > new Date();
      if (stillBanned) {
        return NextResponse.json({ error: "You are banned from posting" }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const categoryId = formData.get("categoryId") as string;
    const file = formData.get("featuredImage") as File | null;

    const imageOnlyCategories = ["humor-funny-memes", "humor-funny-caps"];
    const isImageOnlyCategory = categoryId && imageOnlyCategories.includes(categoryId);

    if (!title?.trim() || !categoryId) {
      return NextResponse.json({ error: "Title and category required" }, { status: 400 });
    }
    if (!isImageOnlyCategory && !body?.trim()) {
      return NextResponse.json({ error: "Body required" }, { status: 400 });
    }

    const bodyText = isImageOnlyCategory ? "" : (body?.trim() ?? "");
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    if (wordCount > 5000) {
      return NextResponse.json({ error: "Max 5,000 words" }, { status: 400 });
    }

    const linkCount = (bodyText.match(/https?:\/\/[^\s<>\[\]()]+/gi) || []).length;
    if (linkCount > 3) {
      return NextResponse.json({ error: "Max 3 links per post" }, { status: 400 });
    }

    let featuredImageUrl: string | null = null;
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name) || ".jpg";
        const filename = `${uuid()}${ext}`;
        if (isBlobConfigured()) {
          featuredImageUrl = await uploadToBlob(buffer, `uploads/${filename}`);
        } else if (isFtpConfigured()) {
          featuredImageUrl = await uploadToFtp(buffer, filename, "");
        } else {
          const dir = path.join(process.cwd(), "public", "uploads");
          await mkdir(dir, { recursive: true });
          const filepath = path.join(dir, filename);
          await writeFile(filepath, buffer);
          featuredImageUrl = `/uploads/${filename}`;
        }
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
        featuredImageUrl = null;
      }
    }

    const postId = uuid();
    await db.insert(posts).values({
      id: postId,
      categoryId,
      authorId: session.userId,
      title: title.trim(),
      body: bodyText,
      featuredImageUrl,
      linkCount,
      score: 1,
      isArchived: false,
    });

    const [created] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    const [author] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

    // Notify category followers (don't block response)
    const { sendNewPostNotification } = await import("@/lib/email");
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
    const followerRows = await db
      .select({ email: users.email, userId: users.id })
      .from(categoryFollows)
      .innerJoin(users, eq(categoryFollows.userId, users.id))
      .where(eq(categoryFollows.categoryId, categoryId));
    const followers = followerRows.filter((f) => f.userId !== session.userId);
    const categoryName = category?.name ?? "Category";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const postUrl = `${baseUrl}/post/${postId}`;
    for (const f of followers) {
      if (f.email) {
        sendNewPostNotification({
          to: f.email,
          categoryName,
          postTitle: title.trim(),
          postUrl,
        }).catch((err) => console.error("Email notification failed:", err));
      }
    }

    return NextResponse.json({
      post: {
        ...created,
        author: author ? { username: author.username, avatarUrl: author.avatarUrl } : null,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
