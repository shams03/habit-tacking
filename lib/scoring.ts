import type { ParsedActivity } from "./llmSchema";

export type CategoryWeightMap = Record<string, number>;

// Default category weights — positive = aligned, negative = misaligned.
export const DEFAULT_CATEGORY_WEIGHTS: CategoryWeightMap = {
  study_ml: 5,
  study: 4,
  coding: 4,
  exercise: 2,
  meditation: 2,
  reading: 2,
  work: 3,
  gaming: -3,
  social_media: -2,
  passive_consumption: -2,
  youtube: -2,
  sleep_in: -1
};

const PASSIVE_CONSUMPTION_CATEGORIES = new Set([
  "youtube",
  "passive_consumption",
  "social_media"
]);

export function computeAlignmentScore(
  activities: ParsedActivity[],
  categoryWeights: CategoryWeightMap = DEFAULT_CATEGORY_WEIGHTS
): number {
  let score = 0;
  let totalPassiveMinutes = 0;
  let maxContigStudyMinutes = 0;
  let contigStudyMinutes = 0;
  let prevCategory: string | null = null;

  for (const activity of activities) {
    const category = (activity.category ?? "").toLowerCase();
    const weight = categoryWeights[category] ?? 0;

    score += weight * (activity.duration_minutes / 60);

    if (PASSIVE_CONSUMPTION_CATEGORIES.has(category)) {
      totalPassiveMinutes += activity.duration_minutes;
    }

    // Track contiguous study blocks for focus bonus.
    if (category === "study_ml" || category === "study" || category === "coding") {
      if (prevCategory === category) {
        contigStudyMinutes += activity.duration_minutes;
      } else {
        contigStudyMinutes = activity.duration_minutes;
      }
      maxContigStudyMinutes = Math.max(maxContigStudyMinutes, contigStudyMinutes);
    } else {
      contigStudyMinutes = 0;
    }
    prevCategory = category;
  }

  // Focus bonus: +1 if >= 90 min contiguous study with high confidence.
  const highConfStudy = activities.some(
    a =>
      ["study_ml", "study", "coding"].includes((a.category ?? "").toLowerCase()) &&
      (a.confidence ?? 0) >= 0.8
  );
  if (maxContigStudyMinutes >= 90 && highConfStudy) {
    score += 1;
  }

  // Passive consumption penalty: -1 if > 60 min of passive content.
  if (totalPassiveMinutes > 60) {
    score -= 1;
  }

  // Cap to [-10, +10] and round to integer.
  return Math.max(-10, Math.min(10, Math.round(score)));
}
