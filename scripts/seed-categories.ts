import { db } from "../lib/db";
import { categories } from "../lib/db/schema";
import { CATEGORY_TREE } from "../lib/categories";
import { eq } from "drizzle-orm";

async function seed() {
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
  console.log("Categories seeded.");
}

seed().catch(console.error).finally(() => process.exit(0));
