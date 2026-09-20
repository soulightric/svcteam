import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("mahasiswa_token")?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice("Bearer ".length);
      }
    }
    if (!token) return NextResponse.json(null, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json(null, { status: 401 });

    // Sertakan id agar client bisa tahu aduan mana miliknya
    return NextResponse.json({ id: payload.id, nama: payload.nama, nim: payload.nim });
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
