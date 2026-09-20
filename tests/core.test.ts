import { describe, expect, it } from "vitest";

import { signToken, verifyToken } from "@/lib/auth";
import { garageKeyFromPublicUrl } from "@/lib/garage";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

process.env.GARAGE_PUBLIC_BASE_URL = "https://uploads.example.com";

describe("JWT authentication", () => {
  it("round-trips a signed token", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";

    const token = await signToken({ id: "student-1", role: "mahasiswa" });
    const payload = await verifyToken(token);

    expect(payload).toMatchObject({ id: "student-1", role: "mahasiswa" });
  });

  it("rejects a token signed with a different secret", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
    const token = await signToken({ role: "ADMIN" });

    process.env.JWT_SECRET = "another-test-secret-with-32-characters";

    await expect(verifyToken(token)).resolves.toBeNull();
  });
});

describe("rate limiter", () => {
  it("blocks requests after the configured limit", () => {
    const key = `test-rate-limit-${Date.now()}`;

    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    expect(rateLimit(key, 2, 60_000).success).toBe(true);

    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("prefers the first forwarded client IP", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.8, 198.51.100.2",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.8");
  });
});

describe("Garage attachment URLs", () => {
  it("extracts the Garage object key from a public URL", () => {
    const publicBaseUrl = process.env.GARAGE_PUBLIC_BASE_URL;
    expect(
      garageKeyFromPublicUrl(`${publicBaseUrl}/svcteam/photo%201.jpg`)
    ).toBe("svcteam/photo 1.jpg");
  });

  it("rejects URLs outside the configured Garage public base", () => {
    expect(garageKeyFromPublicUrl("https://evil.example.com/svcteam/photo.jpg")).toBeNull();
    expect(garageKeyFromPublicUrl(`${process.env.GARAGE_PUBLIC_BASE_URL}/other/photo.jpg`)).toBeNull();
  });
});
