![svc by algorithmics](https://db.etherthink.xyz/etherthink/svcalgo.png)

# Student Voice ITH Campus

Platform pengaduan dan feedback fasilitas kampus berbasis web untuk mahasiswa ITH. Sistem ini memungkinkan mahasiswa melaporkan permasalahan fasilitas, sementara admin dapat memantau, menindaklanjuti, dan membalas laporan secara terstruktur.

---

## Ringkasan Proyek

Project ini dibangun dengan Next.js App Router dan Prisma, serta menggunakan PostgreSQL sebagai basis data utama melalui Supabase. Aplikasi mencakup:

- Portal publik untuk melihat statistik kampus dan akses login
- Portal mahasiswa untuk mengirim dan memantau aduan
- Panel admin untuk mengelola aduan, mahasiswa, dan admin
- Dashboard statistik dengan grafik tren aduan
- Fitur komentar, notifikasi, dan audit log
- Upload lampiran ke storage S3-compatible (Garage)

---

## Stack Teknologi

| Teknologi | Versi / Keterangan |
|---|---|
| Next.js | 16.x |
| React | 19.x |
| TypeScript | 5.x |
| Prisma | 5.x |
| PostgreSQL | Supabase Postgres |
| Tailwind CSS | 4.x |
| Jose | JWT auth |
| Recharts | dashboard charts |
| Lucide React | icon set |
| bcryptjs | password hashing |
| Garage / S3-compatible storage | upload lampiran |
| Vitest | testing |

---

## Fitur Utama

### 1. Halaman Publik (`/`)
- Hero section dan branding kampus
- Statistik aduan real-time
- Animasi counter total, menunggu, diterima, ditolak, dan selesai
- Link login mahasiswa dan admin
- Menu navigasi publik, top aduan, dan akses ke portal lain

### 2. Portal Mahasiswa (`/login`, `/feedback`)
- Login menggunakan NIM dan password
- Melihat daftar aduan sendiri dan seluruh aduan umum sesuai aturan akses
- Mengirim aduan baru dengan kategori, judul, deskripsi, dan lampiran
- Melihat status aduan dalam bentuk progres
- Mengedit atau menghapus aduan yang masih berstatus `menunggu`
- Filter berdasarkan status dan kategori
- Komentar thread per aduan
- Notifikasi dan tampilan status login pengguna

### 3. Panel Admin (`/admin`)
- Login admin dengan username dan password
- Role admin: `SUPER_ADMIN` dan `ADMIN`
- Kelola data aduan: lihat, ubah status, balas, hapus
- Kelola mahasiswa: tambah, hapus, reset password, import CSV
- Kelola admin: tambah admin biasa
- Pencarian aduan berdasarkan judul, nama, dan NIM
- Sistem komentar untuk komunikasi internal / status update

### 4. Dashboard Statistik (`/admin/dashboard`)
- Tren aduan dalam 6 bulan terakhir
- Distribusi status aduan
- Top kategori aduan
- Ringkasan statistik: total aduan, response rate, acceptance rate, completion rate, dan rata-rata aduan per mahasiswa

### 5. Fitur Pendukung
- Unique ticket number: `ADU-YYYY-0001`
- Follow-up status `menunggu`, `diterima`, `ditolak`, `selesai`
- Audit log untuk perubahan / aksi penting
- Upload file ke Garage/S3 compatible
- AI-based classification for feedback via `lib/ai-classifier.ts`

---

## Struktur Direktori

```bash
svcteam/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── export/
│   │   ├── feedback/
│   │   ├── health/
│   │   ├── lacak/
│   │   ├── mahasiswa/
│   │   ├── notifications/
│   │   ├── stats/
│   │   ├── top/
│   │   └── upload/
│   ├── components/
│   ├── feedback/
│   ├── lacak/
│   ├── login/
│   ├── top/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
├── lib/
│   ├── ai-classifier.ts
│   ├── api-auth.ts
│   ├── audit.ts
│   ├── auth.ts
│   ├── constants.ts
│   ├── email.ts
│   ├── garage.ts
│   ├── hash.ts
│   ├── prisma.ts
│   └── rate-limit.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.mjs
│   └── migrations/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── template-mahasiswa.csv
├── tests/
│   ├── auth.test.ts
│   ├── core.test.ts
│   ├── feedback-list.test.ts
│   └── ticket.test.ts
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.mts
├── README.md
└── middleware.ts
```

---

## Persiapan Environment

Buat file `.env` berdasarkan `.env.example`.

```bash
cp .env.example .env
```

Contoh isi `.env`:

```env
# Database Supabase
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"

# JWT secret
JWT_SECRET="ganti-dengan-secret-minimal-32-karakter-acak"

# Seed admin (opsional)
SEED_ADMIN_PASSWORD="GantiPasswordKuat123!"

# Storage Garage / S3-compatible
GARAGE_ENDPOINT="https://storage.algorithmics.web.id"
GARAGE_REGION="garage"
GARAGE_BUCKET="svc-uploads"
GARAGE_ACCESS_KEY_ID=""
GARAGE_SECRET_ACCESS_KEY=""
GARAGE_PUBLIC_BASE_URL="https://uploads.algorithmics.web.id"

# App URL untuk notifikasi / email
APP_URL="https://svc.example.com"

# Email via Resend (opsional)
RESEND_API_KEY=""
EMAIL_FROM="Student Voice <noreply@example.com>"

NODE_ENV="development"
```

### Generate JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Pastikan `JWT_SECRET` minimal 32 karakter agar login berfungsi.

---

## Setup Lokal

### 1. Install dependency

```bash
npm install
```

### 2. Generate Prisma client dan setup database

```bash
npx prisma generate
npx prisma db push
```

Jika ingin mengisi data awal admin/mahasiswa (opsional):

```bash
npm run seed
```

### 3. Jalankan aplikasi

```bash
npm run dev
```

Buka:

- http://localhost:3000

---

## Testing dan Validasi

Project menyediakan script berikut:

```bash
npm run test
npm run lint
npm run typecheck
```

Gunakan ini untuk memeriksa kualitas dan konsistensi sebelum deploy.

---

## Database dan Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Pilih region yang sesuai untuk project Anda
3. Masuk ke **Project Settings → Database → Connection string**
4. Ambil connection string untuk:
   - Transaction pooler (port 6543) → `DATABASE_URL`
   - Session / direct connection (port 5432) → `DIRECT_URL`
5. Jalankan Prisma push setelah konfigurasi selesai

---

## Deploy ke Vercel

### Persiapan

```bash
git add .
git commit -m "chore: setup project"
git push origin main
```

### Langkah deploy

1. Buka [Vercel](https://vercel.com)
2. Pilih **New Project**
3. Import repository GitHub
4. Tambahkan semua variable environment dari `.env`
5. Jalankan deploy

> Jika schema Prisma berubah, jalankan `npx prisma db push` secara manual pada lingkungan target.

---

## Alur Akses Aplikasi

```bash
/                 → Landing page + statistik publik
/login            → Login mahasiswa
/feedback         → Portal aduan mahasiswa
/admin/login      → Login admin
/admin            → Kelola aduan dan data mahasiswa
/admin/dashboard  → Dashboard statistik admin
/lacak/[nomor]   → Lacak status aduan berdasarkan nomor tiket
```

---

## Status Aduan

| Status | Warna | Keterangan |
|---|---|---|
| `menunggu` | Kuning | Aduan baru masuk dan belum diproses |
| `diterima` | Biru | Aduan diterima dan sedang ditindaklanjuti |
| `ditolak` | Merah | Aduan tidak dapat diproses |
| `selesai` | Hijau | Aduan sudah ditangani dan selesai |

---

## Admin Default

Pada saat project di-seed, admin default dapat dibuat berdasarkan konfigurasi `SEED_ADMIN_PASSWORD` atau variabel admin yang Anda atur di sistem. Pastikan password yang digunakan kuat dan aman.

---

## Catatan Penting

- Aplikasi mengandalkan Prisma database Postgres.
- Jika ada perubahan pada `prisma/schema.prisma`, jalankan `npx prisma db push`.
- Untuk upload lampiran, pastikan service Garage/S3 tersedia dan variable `GARAGE_*` telah diisi dengan benar.
- Notifikasi email bersifat opsional; jika `RESEND_API_KEY` kosong, sistem akan melewati pengiriman email.

---

## Lisensi

Project ini digunakan untuk kebutuhan internal / campus service platform dan belum dipublikasikan dengan lisensi umum.

> Mahasiswa hanya bisa mengedit atau menghapus aduan yang masih berstatus **Menunggu**.

---

## Environment Variables

| Key | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Supabase (port 6543, Transaction mode) |
| `DIRECT_URL` | Connection string Supabase (port 5432, Session mode) |
| `ADMIN_USERNAME` | Username untuk login admin panel |
| `ADMIN_PASSWORD` | Password untuk login admin panel |
| `JWT_SECRET` | Secret key untuk signing JWT token |

---

## Lisensi

Project ini dibuat untuk keperluan akademik.

---

## Keamanan (setelah audit)

Perubahan kritis yang sudah diterapkan:

1. **Password di-hash** dengan bcrypt (`lib/hash.ts`) pada create/login/reset admin & mahasiswa.
2. **API `/api/mahasiswa`** dilindungi — hanya admin terautentikasi.
3. **`GET /api/feedback`** filter di server: mahasiswa hanya data sendiri; admin sesuai role/kategori. Response berpaginasi `{ data, pagination }`.
4. **TLS reject unauthorized** hanya aktif di `NODE_ENV=development`.
5. **Tidak ada kredensial admin hardcoded** di login — seed database wajib.
6. **`JWT_SECRET`** divalidasi (minimal 32 karakter) saat sign/verify.
7. **Middleware** memvalidasi `payload.role` (admin vs mahasiswa).
8. **Rate limiting** 10 percobaan / 15 menit per IP pada endpoint login.
9. Index Prisma pada status, kategori, mahasiswaId, dll.
10. `.env.example`, error/not-found/loading pages, `remotePatterns` Cloudinary.

### Setelah deploy / clone baru

```bash
cp .env.example .env
# isi JWT_SECRET, DATABASE_URL, CLOUDINARY_*, SEED_ADMIN_PASSWORD

npx prisma db push   # atau prisma migrate deploy
npm run seed         # buat admin (password sudah di-hash)
# Jika sudah ada data plain-text lama:
npm run hash-passwords
```

