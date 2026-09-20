import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

/**
 * Export aduan sebagai CSV.
 * Query: ?status=&kategori=&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(undefined, req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const kategori = searchParams.get("kategori");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (auth.payload.role === "ADMIN" && auth.payload.kategori) {
      where.kategori = auth.payload.kategori;
      where.diteruskan = true;
    } else if (kategori) {
      where.kategori = kategori;
    }

    if (status) where.status = status;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const rows = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { mahasiswa: { select: { nim: true, nama: true } } },
    });

    const header = [
      "Nomor Tiket",
      "Tanggal",
      "NIM",
      "Nama",
      "Kategori",
      "Judul",
      "Deskripsi",
      "Status",
      "Balasan",
      "Diteruskan",
      "Updated At",
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.nomorTiket,
          r.createdAt.toISOString(),
          r.mahasiswa.nim,
          r.mahasiswa.nama,
          r.kategori,
          r.judul,
          r.deskripsi,
          r.status,
          r.balasan ?? "",
          r.diteruskan ? "ya" : "tidak",
          r.updatedAt.toISOString(),
        ]
          .map(escape)
          .join(",")
      ),
    ];

    // BOM agar Excel Windows mengenali UTF-8
    const csv = "\uFEFF" + lines.join("\r\n");

    const filename = `aduan-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/export:", error);
    return NextResponse.json({ error: "Gagal export" }, { status: 500 });
  }
}
