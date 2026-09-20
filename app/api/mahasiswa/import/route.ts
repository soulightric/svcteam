import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { requireAdmin } from "@/lib/api-auth";

/**
 * Bulk import mahasiswa dari CSV.
 * Body JSON: { rows: [{ nim, nama, password?, email? }], defaultPassword? }
 * atau text/csv raw body dengan header: nim,nama,password,email
 *
 * Hanya SUPER_ADMIN (via requireAdmin — admin kategori juga boleh kelola mahasiswa
 * di sistem ini; audit bilang admin tab mahasiswa untuk super, tapi API mahasiswa
 * sudah requireAdmin umum).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin({ superOnly: true }, req);
    if (!auth.ok) return auth.response;

    const contentType = req.headers.get("content-type") || "";
    let rows: { nim: string; nama: string; password?: string; email?: string }[] = [];
    let defaultPassword = "Mahasiswa123";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      rows = Array.isArray(body.rows) ? body.rows : [];
      if (body.defaultPassword) defaultPassword = String(body.defaultPassword);
    } else {
      // CSV text
      const text = await req.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV kosong atau hanya header" },
          { status: 400 }
        );
      }
      const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const idx = {
        nim: header.indexOf("nim"),
        nama: header.indexOf("nama"),
        password: header.indexOf("password"),
        email: header.indexOf("email"),
      };
      if (idx.nim < 0 || idx.nama < 0) {
        return NextResponse.json(
          { error: "Header CSV wajib punya kolom: nim,nama (opsional: password,email)" },
          { status: 400 }
        );
      }
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const nim = cols[idx.nim]?.trim();
        const nama = cols[idx.nama]?.trim();
        if (!nim || !nama) continue;
        rows.push({
          nim,
          nama,
          password: idx.password >= 0 ? cols[idx.password]?.trim() : undefined,
          email: idx.email >= 0 ? cols[idx.email]?.trim() : undefined,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Tidak ada baris data" }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maksimal 500 baris per import" },
        { status: 400 }
      );
    }

    let created = 0;
    let skipped = 0;
    const errors: { nim: string; reason: string }[] = [];

    for (const row of rows) {
      const nim = String(row.nim || "").trim();
      const nama = String(row.nama || "").trim();
      if (!nim || !nama) {
        skipped++;
        continue;
      }

      const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
      if (existing) {
        skipped++;
        errors.push({ nim, reason: "NIM sudah terdaftar" });
        continue;
      }

      const plain = (row.password && String(row.password).trim()) || defaultPassword;
      if (plain.length < 6) {
        skipped++;
        errors.push({ nim, reason: "Password minimal 6 karakter" });
        continue;
      }

      try {
        const hashed = await hashPassword(plain);
        await prisma.mahasiswa.create({
          data: {
            nim,
            nama,
            password: hashed,
            ...(row.email && { email: String(row.email).trim() }),
          },
        });
        created++;
      } catch (e) {
        skipped++;
        errors.push({
          nim,
          reason: e instanceof Error ? e.message : "Gagal insert",
        });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("IMPORT mahasiswa:", error);
    return NextResponse.json({ error: "Gagal import" }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.replace(/^"|"$/g, "").trim());
}
