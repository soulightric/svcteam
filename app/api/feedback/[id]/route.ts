import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Helper: cek apakah request dari admin atau mahasiswa pemilik aduan
async function getRequester() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  const mahasiswaToken = cookieStore.get("mahasiswa_token")?.value;

  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return { role: "admin", id: null };
  }
  if (mahasiswaToken) {
    const payload = await verifyToken(mahasiswaToken);
    if (payload && typeof payload.id === "string") return { role: "mahasiswa", id: payload.id };
  }
  return null;
}

// PATCH — admin: ubah status+balasan | mahasiswa: edit judul/deskripsi/kategori (hanya jika menunggu)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester();
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });

    if (requester.role === "admin") {
      // Admin bisa ubah status & balasan
      const { status, balasan } = body;
      const validStatus = ["menunggu", "diterima", "ditolak", "selesai"];
      if (status && !validStatus.includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }
      const updated = await prisma.feedback.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(balasan !== undefined && { balasan }),
        },
        include: { mahasiswa: { select: { nama: true, nim: true } } },
      });
      return NextResponse.json(updated);
    }

    if (requester.role === "mahasiswa") {
      // Mahasiswa hanya bisa edit jika aduan miliknya & masih menunggu
      if (feedback.mahasiswaId !== requester.id) {
        return NextResponse.json({ error: "Bukan aduan Anda" }, { status: 403 });
      }
      if (feedback.status !== "menunggu") {
        return NextResponse.json({ error: "Aduan yang sudah diproses tidak dapat diedit" }, { status: 400 });
      }
      const { kategori, judul, deskripsi } = body;
      const updated = await prisma.feedback.update({
        where: { id },
        data: {
          ...(kategori && { kategori }),
          ...(judul && { judul }),
          ...(deskripsi && { deskripsi }),
        },
        include: { mahasiswa: { select: { nama: true, nim: true } } },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui aduan" }, { status: 500 });
  }
}

// DELETE — admin: hapus apapun | mahasiswa: hapus milik sendiri jika masih menunggu
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester();
    if (!requester) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });

    if (requester.role === "mahasiswa") {
      if (feedback.mahasiswaId !== requester.id) {
        return NextResponse.json({ error: "Bukan aduan Anda" }, { status: 403 });
      }
      if (feedback.status !== "menunggu") {
        return NextResponse.json({ error: "Aduan yang sudah diproses tidak dapat dihapus" }, { status: 400 });
      }
    }

    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus aduan" }, { status: 500 });
  }
}
