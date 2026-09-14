import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { recordAudit } from "@/lib/audit";

type Requester =
  | { role: "admin"; id: string; adminRole: string; kategori: string | null; username: string }
  | { role: "mahasiswa"; id: string; nama: string }
  | null;

async function getRequester(): Promise<Requester> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  const mahasiswaToken = cookieStore.get("mahasiswa_token")?.value;

  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (
      payload &&
      (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN") &&
      typeof payload.id === "string"
    ) {
      return {
        role: "admin",
        id: payload.id,
        adminRole: payload.role as string,
        kategori: (payload.kategori as string | null) ?? null,
        username: (payload.username as string) ?? "Admin",
      };
    }
  }
  if (mahasiswaToken) {
    const payload = await verifyToken(mahasiswaToken);
    if (
      payload &&
      payload.role === "mahasiswa" &&
      typeof payload.id === "string"
    ) {
      return {
        role: "mahasiswa",
        id: payload.id,
        nama: (payload.nama as string) ?? "Mahasiswa",
      };
    }
  }
  return null;
}

async function canAccessFeedback(
  feedback: { mahasiswaId: string; kategori: string; diteruskan: boolean },
  requester: NonNullable<Requester>
): Promise<boolean> {
  if (requester.role === "mahasiswa") {
    return feedback.mahasiswaId === requester.id;
  }
  // admin
  if (requester.adminRole === "SUPER_ADMIN") return true;
  return (
    !!requester.kategori &&
    feedback.kategori === requester.kategori &&
    feedback.diteruskan
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester();
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });
    }
    if (!(await canAccessFeedback(feedback, requester))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { feedbackId: id },
      orderBy: { createdAt: "asc" },
      include: {
        admin: { select: { username: true, role: true } },
        mahasiswa: { select: { nama: true, nim: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET comments:", error);
    return NextResponse.json({ error: "Gagal mengambil komentar" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester();
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });
    }
    if (!(await canAccessFeedback(feedback, requester))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mahasiswa tidak boleh komentar jika aduan sudah ditolak
    if (requester.role === "mahasiswa" && feedback.status === "ditolak") {
      return NextResponse.json(
        { error: "Aduan ditolak — komentar ditutup" },
        { status: 400 }
      );
    }

    const { isi } = await req.json();
    if (!isi || typeof isi !== "string" || !isi.trim()) {
      return NextResponse.json({ error: "Isi komentar wajib diisi" }, { status: 400 });
    }
    if (isi.trim().length > 2000) {
      return NextResponse.json(
        { error: "Komentar maksimal 2000 karakter" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        isi: isi.trim(),
        feedbackId: id,
        ...(requester.role === "admin"
          ? { adminId: requester.id }
          : { mahasiswaId: requester.id }),
      },
      include: {
        admin: { select: { username: true, role: true } },
        mahasiswa: { select: { nama: true, nim: true } },
      },
    });

    // Update ringkasan balasan jika dari admin
    if (requester.role === "admin") {
      await prisma.feedback.update({
        where: { id },
        data: { balasan: isi.trim() },
      });
    }

    await recordAudit({
      action: "COMMENT_CREATED",
      feedbackId: id,
      actor: {
        type: requester.role === "admin" ? "ADMIN" : "MAHASISWA",
        id: requester.id,
      },
      details: { actorRole: requester.role },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST comments:", error);
    return NextResponse.json({ error: "Gagal mengirim komentar" }, { status: 500 });
  }
}
