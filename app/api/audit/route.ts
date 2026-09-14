import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAdmin({ superOnly: true });
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const feedbackId = url.searchParams.get("feedbackId") || undefined;
  const requestedLimit = Number(url.searchParams.get("limit") || 100);
  const take = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 200)
    : 100;

  const logs = await prisma.auditLog.findMany({
    where: feedbackId ? { entityId: feedbackId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(logs);
}