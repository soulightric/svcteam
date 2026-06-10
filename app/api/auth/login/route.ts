import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    // Coba cek dari database (jika model Admin sudah ada)
    let dbAdmin = null;
    try {
      if (prisma.admin) {
        dbAdmin = await prisma.admin.findUnique({
          where: { username },
        });
      }
    } catch (e) {
      // Jika tabel belum ada, abaikan dan pakai .env
      console.log("Admin table belum siap, pakai fallback .env");
    }

    if (dbAdmin) {
      if (dbAdmin.password !== password) {
        return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
      }

      const token = await signToken({
        id: dbAdmin.id,
        username: dbAdmin.username,
        role: dbAdmin.role,
      });

      const res = NextResponse.json({ success: true, role: dbAdmin.role });
      res.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
      return res;
    }

    // Fallback ke admin dari .env
    const envUser = process.env.ADMIN_USERNAME ?? "admin";
    const envPass = process.env.ADMIN_PASSWORD ?? "Admin1234";

    if (username === envUser && password === envPass) {
      const token = await signToken({
        username: envUser,
        role: "SUPER_ADMIN",
      });

      const res = NextResponse.json({ success: true, role: "SUPER_ADMIN" });
      res.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
      return res;
    }

    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}