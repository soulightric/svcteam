import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mahasiswa_token")?.value;
    if (!token) return NextResponse.json([], { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || typeof payload.id !== "string") {
      return NextResponse.json([], { status: 401 });
    }

    // Ambil aduan milik mahasiswa yang sudah diterima/ditolak
    const feedbacks = await prisma.feedback.findMany({
      where: {
        mahasiswaId: payload.id,
        status: { in: ["diterima", "ditolak"] },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        judul: true,
        status: true,
        balasan: true,
        updatedAt: true,
        kategori: true,
      },
    });

    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
