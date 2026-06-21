import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Mengembalikan identitas admin yang sedang login (role + kategori)
// dipakai panel /admin untuk menentukan tampilan masing-masing admin.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json(null, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json(null, { status: 401 });

    return NextResponse.json({
      username: payload.username ?? null,
      role: payload.role ?? "ADMIN",
      kategori: payload.kategori ?? null,
    });
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
