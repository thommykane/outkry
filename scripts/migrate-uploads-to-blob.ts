/**
 * One-time migration: upload local public/uploads images to Vercel Blob
 * and update post featuredImageUrl in the database.
 *
 * Run from your machine where public/uploads/ exists (after seed) and with
 * DATABASE_URL (production) + BLOB_READ_WRITE_TOKEN in .env.
 *
 * Usage: npm run migrate:uploads-to-blob
 */
import path from "node:path";
import { readFile } from "node:fs/promises";
import { db } from "../lib/db";
import { posts } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";
import { uploadToBlob } from "../lib/blob-upload";

async function migrate() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set BLOB_READ_WRITE_TOKEN in .env (e.g. from Vercel Storage or vercel env pull)");
    process.exit(1);
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  const rows = await db
    .select({ id: posts.id, featuredImageUrl: posts.featuredImageUrl })
    .from(posts)
    .where(like(posts.featuredImageUrl, "/uploads/%"));

  console.log(`Found ${rows.length} posts with /uploads/ images.`);

  let ok = 0;
  let skip = 0;
  let err = 0;

  for (let i = 0; i < rows.length; i++) {
    const post = rows[i];
    const url = post.featuredImageUrl;
    if (!url || url.startsWith("http")) continue;

    const filename = path.basename(url);
    const localPath = path.join(uploadsDir, filename);

    try {
      const buffer = await readFile(localPath);
      const blobUrl = await uploadToBlob(buffer, `uploads/${filename}`);
      await db.update(posts).set({ featuredImageUrl: blobUrl }).where(eq(posts.id, post.id));
      ok++;
      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${rows.length} done`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        skip++;
      } else {
        err++;
        console.error(`  Post ${post.id} (${filename}):`, (e as Error).message);
      }
    }
  }

  console.log(`Done. Updated: ${ok}, skipped (file missing): ${skip}, errors: ${err}`);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => process.exit(0));
