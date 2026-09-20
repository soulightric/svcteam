import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { notifyStatusChange } from "@/lib/email";
import { recordAudit } from "@/lib/audit";

type Requester =
  | { role: "admin"; id: string | null; adminRole: string; kategori: string | null }
  | { role: "mahasiswa"; id: string }
  | null;

async function getRequester(req?: Request): Promise<Requester> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  const mahasiswaTokenCookie = cookieStore.get("mahasiswa_token")?.value;
  const authHeader = req?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  // Cookie diprioritaskan (web); header dipakai mobile yang tidak punya cookie.
  const mahasiswaToken = mahasiswaTokenCookie ?? bearerToken;

  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload && (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN")) {
      return {
        role: "admin",
        id: typeof payload.id === "string" ? payload.id : null,
        adminRole: (payload.role as string) ?? "ADMIN",
        kategori: (payload.kategori as string | null) ?? null,
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
      return { role: "mahasiswa", id: payload.id };
    }
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await getRequester(req);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { mahasiswa: { select: { nama: true, nim: true } } },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });
    }

    // Semua mahasiswa boleh melihat detail tiket siapapun (tab "Seluruh Aduan" — transparansi
    // ala forum pengaduan kampus). Ini cuma untuk GET/lihat; ubah (PATCH) dan hapus (DELETE)
    // tetap dibatasi ke pemilik tiket masing-masing di handler-nya sendiri.
    return NextResponse.json(feedback);
  } catch (error) {
    console.error("GET FEEDBACK DETAIL ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester(req);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { mahasiswa: { select: { nama: true, email: true } } },
    });
    if (!feedback) {
      return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });
    }

    if (requester.role === "admin") {
      const isSuper = requester.adminRole === "SUPER_ADMIN";

      if (!isSuper) {
        if (!requester.kategori || feedback.kategori !== requester.kategori) {
          return NextResponse.json({ error: "Bukan kategori Anda" }, { status: 403 });
        }
        if (!feedback.diteruskan) {
          return NextResponse.json(
            { error: "Aduan belum diteruskan ke Anda" },
            { status: 403 }
          );
        }
      }

      const { status, balasan, diteruskan, lampiranBalasan } = body;
      const validStatus = ["menunggu", "diterima", "ditolak", "selesai"];
      if (status && !validStatus.includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      if (diteruskan !== undefined && !isSuper) {
        return NextResponse.json(
          { error: "Hanya admin biasa yang dapat meneruskan aduan" },
          { status: 403 }
        );
      }

      const updated = await prisma.feedback.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(balasan !== undefined && { balasan }),
          ...(lampiranBalasan !== undefined && { lampiranBalasan }),
          ...(diteruskan !== undefined &&
            isSuper && {
              diteruskan: !!diteruskan,
              diteruskanAt: diteruskan ? new Date() : null,
            }),
        },
        include: { mahasiswa: { select: { nama: true, nim: true, email: true } } },
      });

      // Jika admin mengisi balasan, simpan juga sebagai komentar di thread
      if (typeof balasan === "string" && balasan.trim() && requester.id) {
        await prisma.comment.create({
          data: {
            isi: balasan.trim(),
            feedbackId: id,
            adminId: requester.id,
          },
        });
      }

      await recordAudit({
        action: "FEEDBACK_UPDATED",
        feedbackId: id,
        actor: { type: "ADMIN", id: requester.id },
        details: {
          ...(status && status !== feedback.status
            ? { fromStatus: feedback.status, toStatus: status }
            : {}),
          ...(balasan !== undefined ? { replyUpdated: true } : {}),
          ...(lampiranBalasan !== undefined ? { replyAttachmentUpdated: true } : {}),
          ...(diteruskan !== undefined && isSuper
            ? { forwarded: !!diteruskan }
            : {}),
        },
      });

      // Notifikasi email saat status berubah
      if (status && status !== feedback.status) {
        const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
        const trackUrl = baseUrl
          ? `${baseUrl}/lacak/${updated.nomorTiket}`
          : undefined;
        // fire-and-forget
        void notifyStatusChange({
          email: updated.mahasiswa.email,
          nama: updated.mahasiswa.nama,
          nomorTiket: updated.nomorTiket,
          judul: updated.judul,
          status: updated.status,
          balasan: updated.balasan,
          trackUrl,
        });
      }

      return NextResponse.json(updated);
    }

    if (requester.role === "mahasiswa") {
      if (feedback.mahasiswaId !== requester.id) {
        return NextResponse.json({ error: "Bukan aduan Anda" }, { status: 403 });
      }
      if (feedback.status !== "menunggu") {
        return NextResponse.json(
          { error: "Aduan yang sudah diproses tidak dapat diedit" },
          { status: 400 }
        );
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
      await recordAudit({
        action: "FEEDBACK_EDITED",
        feedbackId: id,
        actor: { type: "MAHASISWA", id: requester.id },
        details: {
          ...(kategori ? { categoryUpdated: true } : {}),
          ...(judul ? { titleUpdated: true } : {}),
          ...(deskripsi ? { descriptionUpdated: true } : {}),
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("PATCH /api/feedback/[id]:", error);
    return NextResponse.json({ error: "Gagal memperbarui aduan" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requester = await getRequester(req);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ error: "Aduan tidak ditemukan" }, { status: 404 });
    }

    if (requester.role === "mahasiswa") {
      if (feedback.mahasiswaId !== requester.id) {
        return NextResponse.json({ error: "Bukan aduan Anda" }, { status: 403 });
      }
      if (feedback.status !== "menunggu") {
        return NextResponse.json(
          { error: "Aduan yang sudah diproses tidak dapat dihapus" },
          { status: 400 }
        );
      }
    }

    // Penghapusan permanen dibatasi ke SUPER_ADMIN saja. Admin kategori
    // hanya berwenang menindaklanjuti aduan (PATCH), bukan menghapusnya.
    if (requester.role === "admin" && requester.adminRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya super admin yang dapat menghapus aduan" },
        { status: 403 }
      );
    }

    await recordAudit({
      action: "FEEDBACK_DELETED",
      feedbackId: id,
      actor: {
        type: requester.role === "admin" ? "ADMIN" : "MAHASISWA",
        id: requester.id,
      },
      details: {
        nomorTiket: feedback.nomorTiket,
        status: feedback.status,
        kategori: feedback.kategori,
      },
    });
    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus aduan" }, { status: 500 });
  }
}
