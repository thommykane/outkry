import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../lib/db";
import { posts, users, categories } from "../lib/db/schema";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const POSTS_PER_CATEGORY = 200;
const IMAGE_ONLY_CATEGORY_IDS = ["humor-funny-memes", "humor-funny-caps"];
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n" +
  "Curabitur pretium tincidunt lacus. Nulla facilisi. Ut convallis, sem sit amet interdum consectetuer, odio augue aliquam leo, id molestie tortor magna et ipsum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\n" +
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aenean at risus vel nunc ullamcorper sodales. Integer varius nulla at nisl aliquet, eget feugiat mi tempus.";

const TITLE_TEMPLATES = [
  "Why this matters now",
  "The future of the industry",
  "What everyone gets wrong",
  "A closer look at the data",
  "Breaking down the latest",
  "Lessons from the past year",
  "The real story behind",
  "How things are changing",
  "What the numbers show",
  "Understanding the impact",
];

async function ensureSeedUser(): Promise<string> {
  const [existing] = await db.select().from(users).limit(1);
  if (existing) return existing.id;

  const passwordHash = await bcrypt.hash("seed-password", 10);
  const userId = uuid();
  await db.insert(users).values({
    id: userId,
    email: "seed@outkry.local",
    phone: "+15550000000",
    username: "seedbot",
    passwordHash,
    emailVerified: false,
    phoneVerified: false,
  });
  console.log("Created seed user:", userId);
  return userId;
}

async function downloadImage(dir: string): Promise<string> {
  const w = 400 + Math.floor(Math.random() * 200);
  const h = 300 + Math.floor(Math.random() * 150);
  const res = await fetch(`https://picsum.photos/${w}/${h}`);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const filename = `${uuid()}.jpg`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buf);
  return `/uploads/${filename}`;
}

function randomTitle(index: number): string {
  const t = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
  return `${t} #${index}`;
}

async function seed() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const authorId = await ensureSeedUser();
  const allCategories = await db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories);

  // Seed only child categories (posts are listed under these); fallback to all if none have parentId
  const childCategories = allCategories.filter((c) => c.parentId != null);
  const categoriesToSeed = childCategories.length > 0 ? childCategories : allCategories;
  console.log(`Seeding ${categoriesToSeed.length} categories (${childCategories.length} child).`);

  for (const cat of categoriesToSeed) {
    const [row] = await db.select({ count: count() }).from(posts).where(eq(posts.categoryId, cat.id));
    const current = Number(row?.count ?? 0);
    const toAdd = Math.max(0, POSTS_PER_CATEGORY - current);
    if (toAdd === 0) {
      console.log(`Category ${cat.id}: already ${current} posts, skip`);
      continue;
    }
    const isImageOnly = IMAGE_ONLY_CATEGORY_IDS.includes(cat.id);
    console.log(`Category ${cat.id}: adding ${toAdd} posts (image-only: ${isImageOnly})`);
    for (let i = 0; i < toAdd; i++) {
      const featuredImageUrl = await downloadImage(uploadsDir);
      const postId = uuid();
      await db.insert(posts).values({
        id: postId,
        categoryId: cat.id,
        authorId,
        title: randomTitle(current + i + 1),
        body: isImageOnly ? "" : LOREM,
        featuredImageUrl,
        linkCount: 0,
        score: 1,
        isArchived: false,
      });
      if ((i + 1) % 50 === 0) console.log(`  ${cat.id}: ${i + 1}/${toAdd}`);
    }
  }
  console.log("Posts seeded.");
}

seed().catch(console.error).finally(() => process.exit(0));
