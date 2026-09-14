import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    admin: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/hash", () => ({
  verifyPassword: vi.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";

const findAdmin = vi.mocked(prisma.admin.findUnique);
const checkPassword = vi.mocked(verifyPassword);

function loginRequest(body: unknown, ip = "198.51.100.10") {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("admin login route", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
    vi.clearAllMocks();
  });

  it("rejects incomplete credentials", async () => {
    const response = await POST(loginRequest({ username: "admin" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Username dan password wajib diisi",
    });
    expect(findAdmin).not.toHaveBeenCalled();
  });

  it("does not reveal whether the username exists", async () => {
    findAdmin.mockResolvedValue(null);

    const response = await POST(
      loginRequest({ username: "unknown", password: "wrong" }, "198.51.100.11")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Username atau password salah",
    });
  });

  it("returns an httpOnly admin session cookie after valid credentials", async () => {
    findAdmin.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      password: "hashed-password",
      role: "SUPER_ADMIN",
      kategori: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    checkPassword.mockResolvedValue(true);

    const response = await POST(
      loginRequest(
        { username: "admin", password: "correct-password" },
        "198.51.100.12"
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      role: "SUPER_ADMIN",
      kategori: null,
    });
    expect(response.headers.get("set-cookie")).toMatch(
      /admin_token=.+;.*HttpOnly/i
    );
  });
});
