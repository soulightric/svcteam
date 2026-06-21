import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    // Tentukan scope berdasarkan admin yang login
    let where: { kategori?: string; diteruskan?: boolean } = {};
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload && payload.role === "ADMIN" && typeof payload.kategori === "string") {
        // Admin kategori: hanya melihat feedback kategorinya yang sudah DITERUSKAN
        // oleh admin biasa (SUPER_ADMIN).
        where = { kategori: payload.kategori, diteruskan: true };
      }
      // SUPER_ADMIN (admin biasa/penerus) -> where kosong = semua feedback
    }
    // Tanpa admin_token (mahasiswa/publik) -> perilaku lama: kembalikan semua
    // (halaman mahasiswa memfilter miliknya sendiri di sisi klien).

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { mahasiswa: { select: { nama: true, nim: true } } },
    });
    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mahasiswa_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || typeof payload.id !== "string") {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const { kategori, judul, deskripsi, lampiran } = await req.json();
    if (!kategori || !judul || !deskripsi) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: { kategori, judul, deskripsi, mahasiswaId: payload.id, ...(lampiran && { lampiran }) },
      include: { mahasiswa: { select: { nama: true, nim: true } } },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan aduan" }, { status: 500 });
  }
}
