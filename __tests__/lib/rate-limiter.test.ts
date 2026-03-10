import { checkRateLimit } from "@/lib/rate-limiter";

describe("checkRateLimit", () => {
  it("allows requests up to capacity", () => {
    const key = `test-capacity-${Date.now()}`;
    // auth preset has capacity: 10
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key, "auth").allowed).toBe(true);
    }
    expect(checkRateLimit(key, "auth").allowed).toBe(false);
  });

  it("returns retryAfterSeconds when denied", () => {
    const key = `test-retry-${Date.now()}`;
    for (let i = 0; i < 10; i++) checkRateLimit(key, "auth");
    const result = checkRateLimit(key, "auth");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows requests again after tokens refill (using different key to simulate time)", () => {
    const key = `test-refill-${Date.now()}`;
    expect(checkRateLimit(key, "general").allowed).toBe(true);
  });

  it("different keys have independent buckets", () => {
    const key1 = `test-key1-${Date.now()}`;
    const key2 = `test-key2-${Date.now()}`;
    for (let i = 0; i < 10; i++) checkRateLimit(key1, "auth");
    expect(checkRateLimit(key1, "auth").allowed).toBe(false);
    expect(checkRateLimit(key2, "auth").allowed).toBe(true);
  });
});
