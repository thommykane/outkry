import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, posts, sessions, categoryFollows, categories } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import UserPosts from "@/components/UserPosts";
import AvatarUpload from "@/components/AvatarUpload";

type Props = { params: Promise<{ username: string }> };

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) notFound();

  let isOwnProfile = false;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (sessionId) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (session && new Date(session.expiresAt) > new Date() && session.userId === user.id) {
      isOwnProfile = true;
    }
  }

  const postStats = await db
    .select({
      total: sql<number>`count(*)::int`,
      avgScore: sql<number>`coalesce(avg(${posts.score})::int, 0)`,
      maxScore: sql<number>`coalesce(max(${posts.score})::int, 0)`,
      minScore: sql<number>`coalesce(min(${posts.score})::int, 0)`,
    })
    .from(posts)
    .where(eq(posts.authorId, user.id));

  const categoryBreakdown = await db
    .select({
      categoryId: posts.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(posts)
    .where(eq(posts.authorId, user.id))
    .groupBy(posts.categoryId);

  const followedCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categoryFollows)
    .innerJoin(categories, eq(categoryFollows.categoryId, categories.id))
    .where(eq(categoryFollows.userId, user.id));

  const total = postStats[0]?.total ?? 0;
  const avgScore = postStats[0]?.avgScore ?? 0;
  const maxScore = postStats[0]?.maxScore ?? 0;
  const minScore = postStats[0]?.minScore ?? 0;

  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", maxWidth: "1000px" }}>
      <div
        className="glass-panel"
        style={{
          flex: "0 0 280px",
          padding: "1.5rem",
          height: "fit-content",
        }}
      >
        <h2 style={{ marginBottom: "1rem", color: "var(--gold)", fontSize: "1.1rem" }}>
          {user.username}
        </h2>
        {isOwnProfile ? (
          <AvatarUpload currentAvatarUrl={user.avatarUrl} />
        ) : user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              marginBottom: "1rem",
              objectFit: "cover",
            }}
          />
        ) : null}
        {user.bio && (
          <p style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem", lineHeight: 1.4 }}>
            {user.bio}
          </p>
        )}
      </div>

      {followedCategories.length > 0 && (
        <div
          className="glass-panel"
          style={{
            flex: "1 1 300px",
            padding: "1.5rem",
            minWidth: 0,
          }}
        >
          <h3 style={{ marginBottom: "1rem", color: "var(--gold)", fontSize: "1rem" }}>
            Following
          </h3>
          <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            {followedCategories.map((c) => (
              <li key={c.id}>
                <Link href={`/c/${c.id}`} style={{ color: "var(--gold-dim)" }}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="glass-panel"
        style={{
          flex: "1 1 300px",
          padding: "1.5rem",
          minWidth: 0,
        }}
      >
        <h3 style={{ marginBottom: "1rem", color: "var(--gold)", fontSize: "1rem" }}>
          Stats
        </h3>
        <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.9rem", lineHeight: 1.8 }}>
          <li>Total posts: {total}</li>
          <li>Average score per post: {avgScore}</li>
          <li>Highest score: {maxScore}</li>
          <li>Lowest score: {minScore}</li>
          {categoryBreakdown.length > 0 && (
            <li style={{ marginTop: "0.5rem" }}>
              Categories: {categoryBreakdown.map((c) => `${c.categoryId} (${c.count})`).join(", ")}
            </li>
          )}
        </ul>
      </div>

      <div style={{ flex: "1 1 100%", minWidth: 0 }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--gold)", fontSize: "1rem" }}>
          Recent posts
        </h3>
        <UserPosts userId={user.id} />
      </div>
    </div>
  );
}
