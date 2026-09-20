import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(undefined, req);
    if (!auth.ok) return auth.response;

    const list = await prisma.mahasiswa.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nim: true,
        nama: true,
        createdAt: true,
        _count: { select: { feedbacks: true } },
      },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(undefined, req);
    if (!auth.ok) return auth.response;

    const { nim, nama, password, email } = await req.json();
    if (!nim || !nama || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (existing) {
      return NextResponse.json({ error: "NIM sudah terdaftar" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const mahasiswa = await prisma.mahasiswa.create({
      data: { nim, nama, password: hashed, ...(email && { email: String(email).trim() }) },
      select: {
        id: true,
        nim: true,
        nama: true,
        email: true,
        createdAt: true,
      },
    });
    return NextResponse.json(mahasiswa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
