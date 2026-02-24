import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

const KEY_TOP_SCORE = "top_score_threshold";
const KEY_ARCHIVE_SCORE = "archive_score";
const DEFAULT_TOP = 25;
const DEFAULT_ARCHIVE = 500;

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
