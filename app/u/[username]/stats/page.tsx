import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, posts, categories, categoryFollows, userConnections } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

type Props = { params: Promise<{ username: string }> };

export default async function UserStatsPage({ params }: Props) {
  const { username } = await params;
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) notFound();

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
      categoryId: categories.id,
      categoryName: categories.name,
      count: sql<number>`count(*)::int`,
    })
    .from(posts)
    .innerJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.authorId, user.id))
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sql`count(*)`));

  const followedCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categoryFollows)
    .innerJoin(categories, eq(categoryFollows.categoryId, categories.id))
    .where(eq(categoryFollows.userId, user.id));

  const connections = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(userConnections)
    .innerJoin(users, eq(userConnections.connectedUserId, users.id))
    .where(eq(userConnections.userId, user.id));

  const total = postStats[0]?.total ?? 0;
  const avgScore = postStats[0]?.avgScore ?? 0;
  const maxScore = postStats[0]?.maxScore ?? 0;
  const minScore = postStats[0]?.minScore ?? 0;

  return (
    <div style={{ maxWidth: "800px" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <Link href={`/u/${username}`} style={{ color: "var(--gold)" }}>
          ← Back to {user.username}
        </Link>
      </p>

      <h1 style={{ color: "var(--gold)", marginBottom: "1.5rem", fontSize: "1.25rem" }}>
        Stats — {user.username}
      </h1>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
      >
        <h2 style={{ color: "var(--gold)", fontSize: "1rem", marginBottom: "1rem" }}>
          Post stats
        </h2>
        <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.95rem", lineHeight: 1.9 }}>
          <li>Total posts: {total}</li>
          <li>Average score per post: {avgScore}</li>
          <li>Highest score: {maxScore}</li>
          <li>Lowest score: {minScore}</li>
        </ul>
      </div>

      {followedCategories.length > 0 && (
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <h2 style={{ color: "var(--gold)", fontSize: "1rem", marginBottom: "1rem" }}>
            Categories followed
          </h2>
          <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.95rem", lineHeight: 1.9 }}>
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

      {connections.length > 0 && (
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <h2 style={{ color: "var(--gold)", fontSize: "1rem", marginBottom: "1rem" }}>
            Connected users
          </h2>
          <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.95rem", lineHeight: 1.9 }}>
            {connections.map((u) => (
              <li key={u.id}>
                <Link href={`/u/${u.username}`} style={{ color: "var(--gold-dim)" }}>
                  {u.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="glass-panel"
        style={{ padding: "1.5rem" }}
      >
        <h2 style={{ color: "var(--gold)", fontSize: "1rem", marginBottom: "1rem" }}>
          Posts per category
        </h2>
        {categoryBreakdown.length === 0 ? (
          <p style={{ color: "var(--gold-dim)", fontSize: "0.95rem" }}>No posts yet.</p>
        ) : (
          <ul style={{ listStyle: "none", color: "var(--gold-dim)", fontSize: "0.95rem", lineHeight: 1.9 }}>
            {categoryBreakdown.map((row) => (
              <li key={row.categoryId}>
                <Link href={`/c/${row.categoryId}`} style={{ color: "var(--gold-dim)" }}>
                  {row.categoryName}
                </Link>
                : {row.count}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
