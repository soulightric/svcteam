import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const payload = token ? await verifyAdminToken(token) : null;

  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  // Jika pakai env admin (id = "env-admin"), skip DB update
  if (payload.id === "env-admin") {
    return NextResponse.json({ error: "Admin dari .env tidak bisa ganti password via fitur ini. Ubah langsung di .env" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
  if (!admin) return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });

  const valid = await verifyPassword(currentPassword, admin.password);
  if (!valid) return NextResponse.json({ error: "Password lama salah" }, { status: 400 });

  const hashed = await hashPassword(newPassword);
  await prisma.admin.update({
    where: { id: payload.id },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}