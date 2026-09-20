import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/hash";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`mahasiswa-login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSec} detik.` },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        }
      );
    }

    const { nim, password } = await req.json();

    if (!nim || !password) {
      return NextResponse.json(
        { error: "NIM dan password wajib diisi" },
        { status: 400 }
      );
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { nim } });

    if (!mahasiswa) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, mahasiswa.password);
    if (!valid) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: mahasiswa.id,
      nim: mahasiswa.nim,
      nama: mahasiswa.nama,
      role: "mahasiswa",
    });

    const res = NextResponse.json({
      success: true,
      nama: mahasiswa.nama,
      // Untuk client mobile (Expo) yang tidak pakai cookie jar seperti browser —
      // simpan ini di secure storage, kirim sebagai `Authorization: Bearer <token>`.
      token,
    });
    res.cookies.set("mahasiswa_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("MAHASISWA LOGIN ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
