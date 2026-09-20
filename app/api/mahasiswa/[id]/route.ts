import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(undefined, _req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    await prisma.feedback.deleteMany({ where: { mahasiswaId: id } });
    await prisma.mahasiswa.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(undefined, req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);
    const updated = await prisma.mahasiswa.update({
      where: { id },
      data: { password: hashed },
      select: { id: true, nim: true, nama: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui" }, { status: 500 });
  }
}
