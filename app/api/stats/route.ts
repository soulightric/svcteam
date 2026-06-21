import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, menunggu, diterima, ditolak, selesai] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "menunggu" } }),
      prisma.feedback.count({ where: { status: "diterima" } }),
      prisma.feedback.count({ where: { status: "ditolak" } }),
      prisma.feedback.count({ where: { status: "selesai" } })
    ]);
    return NextResponse.json({ total, menunggu, diterima, ditolak, selesai });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil statistik" }, { status: 500 });
  }
}
