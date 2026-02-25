import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users, categoryFollows, categories, votes } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, sql, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToFtp, isFtpConfigured } from "@/lib/ftp-upload";
import { uploadToBlob, isBlobConfigured } from "@/lib/blob-upload";
import { getScoreThresholds, getMainPageOrder } from "@/lib/settings";

const POSTS_PER_PAGE = 20;
const MAX_PAGES = 10;
const ARCHIVED_POSTS_PER_PAGE = 20;
const ARCHIVED_MAX_PAGES = 100;
const ARCHIVED_MAX_TOTAL = 2000;
const MAIN_PAGE_POSTS_LIMIT = 200;
const MAIN_PAGE_PER_PAGE = 20;
const MAIN_PAGE_MAX_PAGES = 10;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const tab = searchParams.get("tab") || "recent";
    const sort = searchParams.get("sort") || "newest";
    const isArchivedTab = tab === "archived";
    const isMainPage = categoryId === "all-main-page";
    const perPage = isArchivedTab ? ARCHIVED_POSTS_PER_PAGE : isMainPage ? MAIN_PAGE_PER_PAGE : POSTS_PER_PAGE;
    const maxPages = isArchivedTab ? ARCHIVED_MAX_PAGES : isMainPage ? MAIN_PAGE_MAX_PAGES : MAX_PAGES;
    const page = Math.min(parseInt(searchParams.get("page") || "1", 10), maxPages);

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId required" }, { status: 400 });
    }

    if (isMainPage) {
      const [mainOrder, allCats, { topScoreThreshold }] = await Promise.all([
        getMainPageOrder(),
        db.select({ id: categories.id, name: categories.name }).from(categories),
        getScoreThresholds(),
      ]);
      const catIds = allCats.filter((c) => c.id !== "all-main-page").map((c) => c.id);
      const catNameById = new Map(allCats.map((c) => [c.id, c.name]));
      if (catIds.length === 0) {
        const res = NextResponse.json({ posts: [], totalPages: 1, total: 0 });
        res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
        return res;
      }
      const whereClause =
        mainOrder === "top"
          ? and(inArray(posts.categoryId, catIds), gte(posts.score, topScoreThreshold))
          : inArray(posts.categoryId, catIds);
      const orderBy = mainOrder === "top" ? desc(posts.score) : desc(posts.createdAt);
      const rows = await db
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(MAIN_PAGE_POSTS_LIMIT);
      const combined = rows.map((r) => ({
        ...r,
        categoryName: catNameById.get(r.categoryId) ?? "—",
      })) as (typeof posts.$inferSelect & { categoryName: string })[];
      const shuffled = shuffle(combined);
      const total = shuffled.length;
      const totalPages = Math.min(Math.ceil(total / MAIN_PAGE_PER_PAGE), MAIN_PAGE_MAX_PAGES);
      const offset = (page - 1) * MAIN_PAGE_PER_PAGE;
      const items = shuffled.slice(offset, offset + MAIN_PAGE_PER_PAGE);
      const authorIds = [...new Set(items.map((p) => p.authorId))];
      const authorMap = new Map<string, { username: string; avatarUrl: string | null }>();
      if (authorIds.length > 0) {
        const authorRows = await db
          .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, authorIds));
        for (const u of authorRows) {
          authorMap.set(u.id, { username: u.username, avatarUrl: u.avatarUrl });
        }
      }
      const postsWithAuthor = items.map((p) => ({
        ...p,
        author: authorMap.get(p.authorId) ?? null,
      }));
      const res = NextResponse.json({ posts: postsWithAuthor, totalPages, total });
      res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
      return res;
    }

    const { topScoreThreshold, archiveScore } = await getScoreThresholds();
    const offset = (page - 1) * perPage;

    const whereClause =
      tab === "archived"
        ? and(eq(posts.categoryId, categoryId), gte(posts.score, archiveScore))
        : tab === "top"
        ? and(eq(posts.categoryId, categoryId), gte(posts.score, topScoreThreshold))
        : eq(posts.categoryId, categoryId);

    if (isArchivedTab) {
      const archivedIds = await db
        .select({ id: posts.id })
        .from(posts)
        .where(whereClause)
        .orderBy(asc(posts.createdAt));
      if (archivedIds.length > ARCHIVED_MAX_TOTAL) {
        const toDelete = archivedIds.slice(0, archivedIds.length - ARCHIVED_MAX_TOTAL).map((r) => r.id);
        if (toDelete.length > 0) {
          await db.delete(votes).where(inArray(votes.postId, toDelete));
          await db.delete(posts).where(inArray(posts.id, toDelete));
        }
      }
    }

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
      .limit(perPage + 1)
      .offset(offset);

    const hasMore = result.length > perPage;
    const items = hasMore ? result.slice(0, perPage) : result;

    const [countResult, authorRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(posts).where(whereClause),
      items.length > 0
        ? db
            .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
            .from(users)
            .where(inArray(users.id, [...new Set(items.map((p) => p.authorId))]))
        : Promise.resolve([]),
    ]);
    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.min(Math.ceil(total / perPage), maxPages);
    const authorMap = new Map<string, { username: string; avatarUrl: string | null }>();
    for (const u of authorRows) {
      authorMap.set(u.id, { username: u.username, avatarUrl: u.avatarUrl });
    }
    const postsWithAuthor = items.map((p) => ({
      ...p,
      author: authorMap.get(p.authorId) ?? null,
    }));

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

    const imageOnlyCategories = ["humor-funny-memes", "humor-funny-caps", "social-beautiful-people"];
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
