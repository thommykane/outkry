import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const W = 1200;
const H = 630;
const IMG_SIZE = 630;
const PAD = 40;
const RIGHT_W = W - IMG_SIZE - PAD * 2;

function teaser(text: string, maxChars: number) {
  const cleaned = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > maxChars ? cleaned.slice(0, maxChars) + "..." : cleaned;
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d0d0d",
            color: "#c9a227",
            fontSize: 32,
          }}
        >
          Outkry
        </div>
      ),
      { width: W, height: H }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const imageUrl = post.featuredImageUrl
    ? post.featuredImageUrl.startsWith("http")
      ? post.featuredImageUrl
      : `${origin}${post.featuredImageUrl}`
    : null;
  const title = post.title.slice(0, 80) + (post.title.length > 80 ? "..." : "");
  const description = teaser(post.body, 140);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#0d0d0d",
          fontFamily: "system-ui, sans-serif",
          border: "2px solid #c9a227",
          borderRadius: 16,
        }}
      >
        {/* Left: thumbnail */}
        <div
          style={{
            width: IMG_SIZE,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={IMG_SIZE}
              height={H}
              style={{ objectFit: "cover", width: IMG_SIZE, height: H }}
            />
          ) : (
            <span style={{ color: "#c9a227", fontSize: 48, opacity: 0.5 }}>—</span>
          )}
        </div>
        {/* Right: title + teaser */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: PAD,
            paddingLeft: PAD + 24,
          }}
        >
          <div style={{ color: "#c9a227", fontSize: 22, fontWeight: 600, marginBottom: 12, letterSpacing: "0.05em" }}>
            OUTKRY
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 16,
              display: "flex",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "rgba(201, 162, 39, 0.9)",
              fontSize: 22,
              lineHeight: 1.4,
              display: "flex",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    }
  );
}
