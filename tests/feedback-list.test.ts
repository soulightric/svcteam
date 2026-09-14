import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-auth", () => ({
  getOptionalAdmin: vi.fn(),
  getOptionalMahasiswa: vi.fn(),
  requireMahasiswa: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedback: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/feedback/route";
import { getOptionalAdmin, getOptionalMahasiswa } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const getAdmin = vi.mocked(getOptionalAdmin);
const getStudent = vi.mocked(getOptionalMahasiswa);
const countFeedback = vi.mocked(prisma.feedback.count);
const findFeedback = vi.mocked(prisma.feedback.findMany);

describe("feedback list visibility", () => {
  it("returns feedback from all students for an authenticated student", async () => {
    getAdmin.mockResolvedValue(null);
    getStudent.mockResolvedValue({
      id: "student-1",
      nim: "20260001",
      nama: "Student One",
      role: "mahasiswa",
    });
    countFeedback.mockResolvedValue(2);
    findFeedback.mockResolvedValue([
      { id: "feedback-1", mahasiswaId: "student-1" },
      { id: "feedback-2", mahasiswaId: "student-2" },
    ] as never);

    const response = await GET(
      new Request("http://localhost/api/feedback?limit=100")
    );

    expect(response.status).toBe(200);
    expect((await response.json()).pagination.total).toBe(2);
    expect(countFeedback).toHaveBeenCalledWith({ where: {} });
    expect(findFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});
