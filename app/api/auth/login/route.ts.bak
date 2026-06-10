import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const validUser = process.env.ADMIN_USERNAME ?? "admin";
    const validPass = process.env.ADMIN_PASSWORD ?? "admin123";

    if (username !== validUser || password !== validPass) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const token = await signToken({ username, role: "admin" });

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 jam
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
