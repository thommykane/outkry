import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategoryById } from "@/lib/categories";
import { isAnonymousCategory, getAnonymousDisplayName } from "@/lib/anonymous";
import ShareButtons from "@/components/ShareButtons";
import FeaturedImage from "@/components/FeaturedImage";

function renderPostBody(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const urlRegex = /(https?:\/\/[^\s<>\[\]()]+)/gi;
  return escaped.replace(urlRegex, (url) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return `<div class="youtube-embed" style="margin: 1rem 0;"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%; border-radius: 8px;"></iframe></div>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--gold-bright); text-decoration: underline;">${url}</a>`;
  });
}

type Props = { params: Promise<{ id: string }> };

async function getSiteOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
  return env.startsWith("http") ? env : `https://${env}`;
}

export async function generateMetadata({ params }: Props) {
  const siteOrigin = await getSiteOrigin();
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return { title: "Post" };
  const description = post.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) + (post.body.length > 160 ? "..." : "");
  return {
    title: `${post.title} · Outkry`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `${siteOrigin}/post/${id}`,
      siteName: "Outkry",
      type: "article",
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) notFound();
  const siteOrigin = await getSiteOrigin();
  const postUrl = `${siteOrigin}/post/${id}`;

  const [author] = await db.select().from(users).where(eq(users.id, post.authorId)).limit(1);
  const cat = getCategoryById(post.categoryId);
  const isAnon = isAnonymousCategory(post.categoryId);
  const displayName = isAnon ? getAnonymousDisplayName(post.authorId) : author?.username;

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", maxWidth: "800px", background: "var(--glass-dark)" }}>
      <Link
        href={cat ? `/c/${post.categoryId}` : "/"}
        style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem", display: "block" }}
      >
        ← Back to {cat?.child.name || "category"}
      </Link>
      {post.featuredImageUrl && (
        <FeaturedImage
          src={post.featuredImageUrl}
          alt=""
          style={{
            width: "100%",
            maxHeight: "300px",
            objectFit: "cover",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        />
      )}
      <h1 style={{ fontSize: "1.5rem", color: "var(--gold-bright)", marginBottom: "0.5rem" }}>
        {post.title}
      </h1>
      {(author || isAnon) && (
        isAnon ? (
          <span style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem", display: "block" }}>
            by {displayName}
          </span>
        ) : (
          <Link href={`/u/${author!.username}`} style={{ fontSize: "0.85rem", color: "var(--gold-dim)", marginBottom: "1rem", display: "block" }}>
            by {displayName}
          </Link>
        )
      )}
      <div
        style={{
          fontSize: "0.95rem",
          lineHeight: 1.6,
          color: "#fff",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          wordBreak: "break-word",
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{
          __html: renderPostBody(post.body),
        }}
      />
      <ShareButtons url={postUrl} title={post.title} />
    </div>
  );
}
