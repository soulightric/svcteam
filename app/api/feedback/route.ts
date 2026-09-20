import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOptionalAdmin,
  getOptionalMahasiswa,
  requireMahasiswa,
} from "@/lib/api-auth";
import { generateNomorTiket } from "@/lib/ticket";
import { classifyFeedback } from "@/lib/ai-classifier";
import { KATEGORI_LIST } from "@/lib/constants";
import { deleteGarageObject, garageKeyFromPublicUrl } from "@/lib/garage";

export async function GET(req: Request) {
  try {
    const admin = await getOptionalAdmin(req);
    const mahasiswa = await getOptionalMahasiswa(req);

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
    const mineOnly = searchParams.get("mine") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (admin) {
      if (admin.role === "ADMIN" && typeof admin.kategori === "string") {
        where.kategori = admin.kategori;
        where.diteruskan = true;
      }
    }

    // Tab "Aduan Saya" di mobile/web — mahasiswa cuma mau lihat tiket miliknya sendiri.
    // Tanpa parameter ini, endpoint tetap mengembalikan seluruh aduan (dipakai tab "Seluruh Aduan").
    if (mineOnly && mahasiswa) {
      where.mahasiswaId = mahasiswa.id;
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
    const auth = await requireMahasiswa(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { kategori, judul, deskripsi, lampiran } = body ?? {};
    const kategoriValues = KATEGORI_LIST.map((item) => item.value);
    if (
      typeof kategori !== "string" ||
      !kategoriValues.includes(kategori as (typeof kategoriValues)[number]) ||
      typeof judul !== "string" ||
      !judul.trim() ||
      judul.trim().length > 200 ||
      typeof deskripsi !== "string" ||
      deskripsi.trim().length < 20 ||
      deskripsi.trim().length > 5000
    ) {
      return NextResponse.json(
        { error: "Kategori, judul, dan deskripsi tidak valid" },
        { status: 400 }
      );
    }
    if (
      lampiran !== undefined &&
      lampiran !== null &&
      (typeof lampiran !== "string" || !garageKeyFromPublicUrl(lampiran))
    ) {
      return NextResponse.json({ error: "URL lampiran tidak valid" }, { status: 400 });
    }

    const nomorTiket = await generateNomorTiket();

    // Sistem Cerdas: minta AI menilai prioritas & membandingkan kategori pilihan
    // mahasiswa. Fail-safe — kalau AI tidak merespons, tiket tetap dibuat normal
    // dengan prioritas default "sedang".
    const aiResult = await classifyFeedback(judul, deskripsi);

    let feedback;
    try {
      feedback = await prisma.feedback.create({
        data: {
          nomorTiket,
          kategori,
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          mahasiswaId: auth.payload.id,
          ...(lampiran && { lampiran }),
          ...(aiResult && {
            prioritas: aiResult.prioritas,
            sumberPrioritas: "ai",
            kategoriSaranAi: aiResult.kategori,
          }),
        },
        include: { mahasiswa: { select: { nama: true, nim: true } } },
      });
    } catch (error) {
      if (typeof lampiran === "string") {
        void deleteGarageObject(lampiran).catch((cleanupError) =>
          console.error("POST /api/feedback attachment cleanup:", cleanupError)
        );
      }
      throw error;
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback:", error);
    return NextResponse.json({ error: "Gagal menyimpan aduan" }, { status: 500 });
  }
}
