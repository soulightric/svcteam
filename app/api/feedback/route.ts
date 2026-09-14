import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOptionalAdmin,
  getOptionalMahasiswa,
  requireMahasiswa,
} from "@/lib/api-auth";
import { generateNomorTiket } from "@/lib/ticket";

export async function GET(req: Request) {
  try {
    const admin = await getOptionalAdmin();
    const mahasiswa = await getOptionalMahasiswa();

    if (!admin && !mahasiswa) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );
    const status = searchParams.get("status");
    const kategori = searchParams.get("kategori");
    const search = searchParams.get("q")?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (admin) {
      if (admin.role === "ADMIN" && typeof admin.kategori === "string") {
        where.kategori = admin.kategori;
        where.diteruskan = true;
      }
    }

    if (status) where.status = status;
    if (kategori && admin?.role === "SUPER_ADMIN") where.kategori = kategori;

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
        { nomorTiket: { contains: search, mode: "insensitive" } },
        ...(admin || mahasiswa
          ? [
              { mahasiswa: { nama: { contains: search, mode: "insensitive" } } },
              { mahasiswa: { nim: { contains: search, mode: "insensitive" } } },
            ]
          : []),
      ];
    }

    const [total, feedbacks] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          mahasiswa: { select: { nama: true, nim: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/feedback:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireMahasiswa();
    if (!auth.ok) return auth.response;

    const { kategori, judul, deskripsi, lampiran } = await req.json();
    if (!kategori || !judul || !deskripsi) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const nomorTiket = await generateNomorTiket();

    const feedback = await prisma.feedback.create({
      data: {
        nomorTiket,
        kategori,
        judul,
        deskripsi,
        mahasiswaId: auth.payload.id,
        ...(lampiran && { lampiran }),
      },
      include: { mahasiswa: { select: { nama: true, nim: true } } },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback:", error);
    return NextResponse.json({ error: "Gagal menyimpan aduan" }, { status: 500 });
  }
}
