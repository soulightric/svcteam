import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Cek dari database dulu
    const admin = await prisma.admin.findUnique({ where: { username } });

    if (admin) {
      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
      }

      const token = await signAdminToken({
        id: admin.id,
        username: admin.username,
        role: admin.role as "SUPER_ADMIN" | "ADMIN",
      });

      const res = NextResponse.json({ success: true, role: admin.role });
      res.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
      return res;
    }

    // 2. Fallback ke .env (untuk transisi / super admin pertama)
    const envUser = process.env.ADMIN_USERNAME ?? "admin";
    const envPass = process.env.ADMIN_PASSWORD ?? "Admin1234";

    if (username === envUser && password === envPass) {
      // Bisa auto-create sebagai SUPER_ADMIN jika belum ada
      const token = await signAdminToken({
        id: "env-admin",
        username: envUser,
        role: "SUPER_ADMIN",
      });

      const res = NextResponse.json({ success: true, role: "SUPER_ADMIN" });
      res.cookies.set("admin_token", token, { /* ... same options */ });
      return res;
    }

    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}