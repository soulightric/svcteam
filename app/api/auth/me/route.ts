import { NextResponse } from "next/server";
import { requireMahasiswa } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const auth = await requireMahasiswa(req);
    if (!auth.ok) return auth.response;

    // Sertakan id agar client bisa tahu aduan mana miliknya
    return NextResponse.json({
      id: auth.payload.id,
      nama: auth.payload.nama,
      nim: auth.payload.nim,
    });
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
