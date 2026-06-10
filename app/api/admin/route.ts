import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Helper untuk ambil admin yang sedang login
async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Super Admin yang bisa mengakses" }, { status: 403 });
  }

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hanya Super Admin yang bisa menambah admin baru" }, { status: 403 });
  }

  try {
    const { username, password, role = "ADMIN" } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    // Cek apakah username sudah ada
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    // Buat admin baru (sementara plain text, nanti bisa di-hash)
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password, // nanti kita ganti pakai hash
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin berhasil ditambahkan",
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambahkan admin" }, { status: 500 });
  }
}