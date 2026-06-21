// Seed 1 admin biasa (SUPER_ADMIN / penerus) + 8 admin kategori.
// Jalankan: node prisma/seed.mjs
// Idempoten (pakai upsert) -> aman dijalankan berulang.
//
// CATATAN: password disimpan plain text agar cocok dengan logika login
// saat ini (app/api/auth/login/route.ts membandingkan password langsung).
// Ganti password default di bawah sebelum dipakai produksi.

import { PrismaClient } from "@prisma/client";

// Supabase + sertifikat SSL (sama seperti lib/prisma.ts)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin1234";

// 8 kategori feedback (harus sama persis dengan KATEGORI_LIST di frontend)
const KATEGORI = [
  "akademik",
  "perpustakaan",
  "internet",
  "kantin",
  "gedung",
  "keamanan",
  "laboratorium",
  "transportasi",
];

async function main() {
  // 1) Admin biasa / penerus (SUPER_ADMIN)
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { role: "SUPER_ADMIN", kategori: null },
    create: {
      username: "admin",
      password: DEFAULT_PASSWORD,
      role: "SUPER_ADMIN",
      kategori: null,
    },
  });
  console.log("✓ SUPER_ADMIN  : admin");

  // 2) 8 admin kategori
  for (const kategori of KATEGORI) {
    const username = `admin_${kategori}`;
    await prisma.admin.upsert({
      where: { username },
      update: { role: "ADMIN", kategori },
      create: {
        username,
        password: DEFAULT_PASSWORD,
        role: "ADMIN",
        kategori,
      },
    });
    console.log(`✓ ADMIN ${kategori.padEnd(13)}: ${username}`);
  }

  console.log(`\nSelesai. Password default semua admin: "${DEFAULT_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
