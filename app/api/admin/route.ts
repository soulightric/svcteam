import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await requireAdmin({ superOnly: true }, req);
  if (!auth.ok) return auth.response;

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      kategori: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const auth = await requireAdmin({ superOnly: true }, req);
  if (!auth.ok) return auth.response;

  try {
    const { username, password, role = "ADMIN", kategori = null } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const KATEGORI_VALID = [
      "akademik",
      "perpustakaan",
      "internet",
      "kantin",
      "gedung",
      "keamanan",
      "laboratorium",
      "transportasi",
    ];

    const finalRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

    let finalKategori: string | null = null;
    if (finalRole === "ADMIN") {
      if (!kategori || !KATEGORI_VALID.includes(kategori)) {
        return NextResponse.json(
          { error: "Kategori admin tidak valid" },
          { status: 400 }
        );
      }
      finalKategori = kategori;
    }

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: hashed,
        role: finalRole,
        kategori: finalKategori,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin berhasil ditambahkan",
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        role: newAdmin.role,
        kategori: newAdmin.kategori,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambahkan admin" }, { status: 500 });
  }
}
