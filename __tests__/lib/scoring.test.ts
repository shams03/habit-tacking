import { computeAlignmentScore, DEFAULT_CATEGORY_WEIGHTS } from "@/lib/scoring";
import type { ParsedActivity } from "@/lib/llmSchema";

describe("computeAlignmentScore", () => {
  it("returns 0 for empty activities", () => {
    expect(computeAlignmentScore([])).toBe(0);
  });

  it("scores study_ml positively and caps to +10", () => {
    const activities: ParsedActivity[] = [
      { name: "Deep Study", category: "study_ml", duration_minutes: 240, confidence: 0.9 }
    ];
    // 5 * (240/60) = 20 -> capped to 10, plus focus bonus (+1) = still 10
    expect(computeAlignmentScore(activities)).toBe(10);
  });

  it("scores gaming negatively", () => {
    const activities: ParsedActivity[] = [
      { name: "Play games", category: "gaming", duration_minutes: 120, confidence: 0.95 }
    ];
    // -3 * (120/60) = -6
    expect(computeAlignmentScore(activities)).toBe(-6);
  });

  it("applies passive consumption penalty when youtube > 60 min", () => {
    const activities: ParsedActivity[] = [
      { name: "YouTube binge", category: "youtube", duration_minutes: 90, confidence: 0.9 }
    ];
    // -2 * (90/60) = -3, then -1 passive penalty = -4
    expect(computeAlignmentScore(activities)).toBe(-4);
  });

  it("no passive penalty when youtube is exactly 60 min", () => {
    const activities: ParsedActivity[] = [
      { name: "YouTube", category: "youtube", duration_minutes: 60, confidence: 0.9 }
    ];
    // -2 * 1 = -2 (no additional -1 because exactly 60 is not > 60)
    expect(computeAlignmentScore(activities)).toBe(-2);
  });

  it("applies focus bonus for >= 90 min contiguous study with high confidence", () => {
    const activities: ParsedActivity[] = [
      { name: "Study ML", category: "study_ml", duration_minutes: 90, confidence: 0.85 },
      { name: "Study ML cont", category: "study_ml", duration_minutes: 30, confidence: 0.9 }
    ];
    // 5*(90/60) + 5*(30/60) = 7.5 + 2.5 = 10.0, then +1 focus -> still capped 10
    expect(computeAlignmentScore(activities)).toBe(10);
  });

  it("caps negative scores to -10", () => {
    const activities: ParsedActivity[] = [
      { name: "Gaming marathon", category: "gaming", duration_minutes: 300, confidence: 1 },
      { name: "YouTube", category: "youtube", duration_minutes: 120, confidence: 1 }
    ];
    // -3*(5) + -2*(2) = -15 + -1 passive = -16 -> capped to -10
    expect(computeAlignmentScore(activities)).toBe(-10);
  });

  it("uses custom category weights", () => {
    const activities: ParsedActivity[] = [
      { name: "Custom activity", category: "custom", duration_minutes: 60, confidence: 0.9 }
    ];
    const weights = { custom: 8 };
    // 8 * 1 = 8
    expect(computeAlignmentScore(activities, weights)).toBe(8);
  });
});
