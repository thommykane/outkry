import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

const KEY_TOP_SCORE = "top_score_threshold";
const KEY_ARCHIVE_SCORE = "archive_score";
const KEY_AUTO_DELETE_SCORE = "auto_delete_score";
const KEY_MAIN_PAGE_ORDER = "main_page_default_order";
const DEFAULT_TOP = 25;
const DEFAULT_ARCHIVE = 500;
const DEFAULT_AUTO_DELETE = -10; // delete when score <= this (e.g. -10)

export type ScoreThresholds = {
  topScoreThreshold: number;
  archiveScore: number;
};

export async function getScoreThresholds(): Promise<ScoreThresholds> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, [KEY_TOP_SCORE, KEY_ARCHIVE_SCORE]));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    topScoreThreshold: map[KEY_TOP_SCORE] != null ? parseInt(String(map[KEY_TOP_SCORE]), 10) || DEFAULT_TOP : DEFAULT_TOP,
    archiveScore: map[KEY_ARCHIVE_SCORE] != null ? parseInt(String(map[KEY_ARCHIVE_SCORE]), 10) || DEFAULT_ARCHIVE : DEFAULT_ARCHIVE,
  };
}

export async function getAutoDeleteScore(): Promise<number> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, KEY_AUTO_DELETE_SCORE));
  const val = rows[0]?.value;
  return val != null ? parseInt(String(val), 10) : DEFAULT_AUTO_DELETE;
}

export async function setAutoDeleteScore(score: number): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: KEY_AUTO_DELETE_SCORE, value: String(score) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: String(score) } });
}

export type MainPageOrder = "recent" | "top";
export async function getMainPageOrder(): Promise<MainPageOrder> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, KEY_MAIN_PAGE_ORDER));
  const val = rows[0]?.value;
  return val === "top" ? "top" : "recent";
}

export async function setMainPageOrder(order: MainPageOrder): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: KEY_MAIN_PAGE_ORDER, value: order })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: order } });
}

export async function setScoreThresholds(thresholds: Partial<ScoreThresholds>): Promise<void> {
  if (thresholds.topScoreThreshold != null) {
    await db
      .insert(appSettings)
      .values({ key: KEY_TOP_SCORE, value: String(thresholds.topScoreThreshold) })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: String(thresholds.topScoreThreshold) } });
  }
  if (thresholds.archiveScore != null) {
    await db
      .insert(appSettings)
      .values({ key: KEY_ARCHIVE_SCORE, value: String(thresholds.archiveScore) })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: String(thresholds.archiveScore) } });
  }
}
