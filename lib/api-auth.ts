import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, type AdminTokenPayload, type MahasiswaTokenPayload } from "@/lib/auth";

/**
 * Ambil token mahasiswa dari cookie (web) ATAU header `Authorization: Bearer <token>`
 * (mobile/Expo — yang tidak punya cookie jar seperti browser).
 * Cookie diprioritaskan supaya perilaku web tidak berubah.
 */
async function getMahasiswaToken(req?: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("mahasiswa_token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }
  return null;
}

export async function requireAdmin(
  options?: { superOnly?: boolean },
  req?: Request
): Promise<
  | { ok: true; payload: AdminTokenPayload }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_token")?.value;
  const authHeader = req?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const token = cookieToken ?? bearerToken;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = (await verifyToken(token)) as AdminTokenPayload | null;
  if (!payload || (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Token tidak valid" }, { status: 401 }),
    };
  }

  if (options?.superOnly && payload.role !== "SUPER_ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Hanya Super Admin yang bisa mengakses" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, payload };
}

export async function requireMahasiswa(req?: Request): Promise<
  | { ok: true; payload: MahasiswaTokenPayload }
  | { ok: false; response: NextResponse }
> {
  const token = await getMahasiswaToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const payload = (await verifyToken(token)) as MahasiswaTokenPayload | null;
  if (!payload || payload.role !== "mahasiswa" || typeof payload.id !== "string") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Token tidak valid" }, { status: 401 }),
    };
  }

  return { ok: true, payload };
}

export async function getOptionalAdmin(req?: Request): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("admin_token")?.value;
  const authHeader = req?.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const token = cookieToken ?? bearerToken;
  if (!token) return null;
  const payload = (await verifyToken(token)) as AdminTokenPayload | null;
  if (!payload || (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN")) {
    return null;
  }
  return payload;
}

export async function getOptionalMahasiswa(req?: Request): Promise<MahasiswaTokenPayload | null> {
  const token = await getMahasiswaToken(req);
  if (!token) return null;
  const payload = (await verifyToken(token)) as MahasiswaTokenPayload | null;
  if (!payload || payload.role !== "mahasiswa" || typeof payload.id !== "string") {
    return null;
  }
  return payload;
}
