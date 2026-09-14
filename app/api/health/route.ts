import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check untuk Docker / load balancer.
 * GET /api/health → { status, db, uptime, version }
 */
export async function GET() {
  const started = process.uptime();
  let db: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    db = "error";
    console.error("Health check database error:", e);
  }

  const healthy = db === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      db,
      uptimeSec: Math.round(started),
      version: process.env.npm_package_version || "0.2.0",
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
