# Student Voice ITH Campus

Platform pengaduan dan feedback fasilitas kampus berbasis web. Mahasiswa yang terdaftar dapat menyampaikan aduan terkait fasilitas kampus, dan admin dapat mengelola serta merespons setiap aduan.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|---|---|---|
| Next.js | 16.2 | Framework utama (App Router) |
| React | 19 | UI library |
| Prisma | 5.x | ORM database |
| PostgreSQL | — | Database (via Supabase) |
| Tailwind CSS | 4 | Styling |
| Jose | 6 | JWT authentication |
| Recharts | 3 | Grafik dashboard |
| Lucide React | latest | Icon library |

---

## Fitur

### Halaman Publik (`/`)
- Statistik aduan real-time (total, menunggu, diterima, ditolak)
- Animasi counter angka
- Tombol login mahasiswa

### Portal Mahasiswa (`/feedback`)
- Login dengan NIM dan password
- Form kirim aduan (kategori, judul, deskripsi)
- Lihat semua aduan beserta status
- **Search** aduan by judul, nama, atau NIM
- **Edit** aduan sendiri selama masih berstatus Menunggu
- **Hapus** aduan sendiri selama masih berstatus Menunggu
- Filter by status dan kategori

### Panel Admin (`/admin`)
- Login dengan username dan password
- Tabel aduan lengkap dengan filter status
- Ubah status aduan (Menunggu → Diterima / Ditolak)
- Tambahkan balasan atau alasan penolakan
- Hapus aduan
- **Tab Kelola Mahasiswa** — tambah, hapus, reset password mahasiswa
- Search aduan by judul, nama, NIM

### Dashboard Statistik (`/admin/dashboard`)
- Line chart tren aduan 6 bulan terakhir
- Pie chart distribusi status
- Bar chart aduan per kategori
- Ringkasan: response rate, acceptance rate, rata-rata aduan per mahasiswa

### Kategori Aduan
Akademik, Perpustakaan, Internet & Teknologi, Kantin, Gedung & Ruang Kelas, Keamanan, Laboratorium, Transportasi & Parkir

---

## Struktur Direktori

```
svc.cujud.xyz/
├── app/
│   ├── page.tsx                        # Halaman publik (statistik)
│   ├── layout.tsx
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx                    # Login mahasiswa
│   ├── feedback/
│   │   └── page.tsx                    # Portal mahasiswa (protected)
│   ├── admin/
│   │   ├── page.tsx                    # Admin panel (protected)
│   │   ├── login/
│   │   │   └── page.tsx                # Login admin
│   │   └── dashboard/
│   │       └── page.tsx                # Dashboard statistik
│   └── api/
│       ├── feedback/
│       │   ├── route.ts                # GET semua aduan, POST aduan baru
│       │   └── [id]/route.ts           # PATCH ubah status/edit, DELETE hapus
│       ├── mahasiswa/
│       │   ├── route.ts                # GET list, POST tambah mahasiswa
│       │   └── [id]/route.ts           # PATCH reset password, DELETE hapus
│       ├── auth/
│       │   ├── login/route.ts          # Login admin
│       │   ├── logout/route.ts         # Logout admin
│       │   ├── mahasiswa-login/route.ts
│       │   ├── mahasiswa-logout/route.ts
│       │   └── me/route.ts             # Ambil info user dari token
│       ├── stats/route.ts              # Statistik publik
│       └── dashboard/route.ts          # Data lengkap untuk dashboard
├── lib/
│   ├── prisma.ts                       # Prisma client singleton
│   └── auth.ts                         # JWT sign & verify
├── prisma/
│   └── schema.prisma                   # Schema database
├── middleware.ts                        # Proteksi route /admin & /feedback
├── public/
│   └── logo.png                        # Logo kampus
└── .env                                # Environment variables
```

---

## Setup Lokal

### 1. Clone dan install dependencies

```bash
git clone https://github.com/soulightric/svc.cujud.xyz.git
cd svc.cujud.xyz
npm install
```

### 2. Konfigurasi environment variables

```bash
cp .env.example .env # or add .env
```

Isi `.env` dengan nilai yang sesuai:

```env
# Database Supabase — Transaction mode (port 6543) untuk query normal
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"

# Database Supabase — Session mode (port 5432) untuk migrate/push schema
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres?sslmode=require"

# Kredensial admin panel
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="passwordkamu"

# Secret key JWT — generate dengan perintah di bawah
JWT_SECRET="random-string-panjang"
```

Generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Setup database

```bash
# Generate Prisma client
npx prisma@5 generate

# Push schema ke Supabase
npx prisma@5 db push
```

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Setup Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Pilih region **Southeast Asia**
3. Masuk ke **Project Settings → Database → Connection string**
4. Salin **Transaction** (port 6543) → isi ke `DATABASE_URL`
5. Salin **Session** (port 5432) → isi ke `DIRECT_URL`

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "initial commit"
git push
```

### 2. Import project di Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project**
2. Import repository dari GitHub
3. Masuk ke **Settings → Environment Variables**
4. Tambahkan semua variabel dari `.env`
5. Klik **Deploy**

### Catatan penting

Setiap kali ada **perubahan schema** (`prisma/schema.prisma`), jalankan manual:
```bash
npx prisma@5 db push
```
Vercel tidak otomatis migrate database.

---

## Alur Penggunaan

```
/                   → Statistik publik + tombol login
/login              → Login mahasiswa (NIM + password)
/feedback           → 🔒 Form aduan + daftar aduan
/admin/login        → Login admin
/admin              → 🔒 Kelola aduan + kelola mahasiswa
/admin/dashboard    → 🔒 Dashboard statistik grafik
```

### Tambah mahasiswa pertama

1. Login ke `/admin` dengan kredensial dari `.env`
2. Klik tab **Kelola Mahasiswa**
3. Klik **Tambah Mahasiswa** → isi NIM, nama, password
4. Mahasiswa sudah bisa login di `/login`

---

## Status Aduan

| Status | Warna | Keterangan |
|---|---|---|
| **Menunggu** | 🟡 Kuning | Aduan baru masuk, belum diproses |
| **Diterima** | 🟢 Hijau | Aduan diterima dan ditindaklanjuti |
| **Ditolak** | 🔴 Merah | Aduan tidak dapat diproses |

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
