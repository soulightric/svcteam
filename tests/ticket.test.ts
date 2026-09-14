import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ticketCounter: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { generateNomorTiket } from "@/lib/ticket";
import { prisma } from "@/lib/prisma";

const counter = vi.mocked(prisma.ticketCounter);

describe("ticket number generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    counter.upsert.mockResolvedValue({ year: new Date().getFullYear(), last: 0 });
  });

  it("creates the expected yearly ticket format", async () => {
    counter.update.mockResolvedValue({
      year: new Date().getFullYear(),
      last: 7,
    });

    const ticket = await generateNomorTiket();

    expect(ticket).toMatch(/^ADU-\d{4}-0007$/);
    expect(counter.upsert).toHaveBeenCalledOnce();
    expect(counter.update).toHaveBeenCalledOnce();
  });
});
