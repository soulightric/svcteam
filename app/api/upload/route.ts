import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { garageClient, GARAGE_BUCKET, garagePublicUrl } from "@/lib/garage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Cek signature (magic bytes) file. `file.type` dikirim oleh klien
 * sehingga mudah dipalsukan — isi file harus diverifikasi sendiri.
 */
function detectImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    // Cek auth: boleh mahasiswa (lampiran aduan) ATAU admin (lampiran balasan/tindak lanjut).
    // Dukung cookie (web) atau `Authorization: Bearer <token>` (mobile/Expo).
    const cookieStore = await cookies();
    const mahasiswaToken = cookieStore.get("mahasiswa_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined;
    const token = mahasiswaToken ?? adminToken ?? bearerToken;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Hanya file JPG, PNG, atau WebP yang diizinkan" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 });
    }

    // Convert file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verifikasi isi file, bukan sekadar Content-Type dari klien
    const realType = detectImageType(buffer);
    if (!realType || !ALLOWED_TYPES.includes(realType)) {
      return NextResponse.json(
        { error: "File bukan gambar JPG, PNG, atau WebP yang valid" },
        { status: 400 }
      );
    }

    // Pastikan kredensial Garage tersedia di runtime.
    // Penyebab umum 500: env GARAGE_* tidak ter-load (mis. menjalankan
    // build standalone `node server.js` tanpa env, atau .env tidak di-inject).
    if (
      !process.env.GARAGE_ENDPOINT ||
      !process.env.GARAGE_ACCESS_KEY_ID ||
      !process.env.GARAGE_SECRET_ACCESS_KEY ||
      !process.env.GARAGE_PUBLIC_BASE_URL
    ) {
      console.error("UPLOAD ERROR: Kredensial/konfigurasi Garage tidak ditemukan di environment.");
      return NextResponse.json(
        { error: "Konfigurasi Garage belum di-set di server (GARAGE_ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY / PUBLIC_BASE_URL)." },
        { status: 500 }
      );
    }

    // Kompres & resize sebelum upload (dulu ditangani otomatis oleh Cloudinary,
    // sekarang dilakukan manual karena Garage cuma nyimpen file mentah).
    // Semua format diseragamkan jadi JPEG kualitas tinggi — hasil jauh lebih
    // kecil dari file asli tapi masih jelas untuk keperluan bukti aduan.
    const MAX_DIMENSION = 1600; // sisi terpanjang, cukup jelas untuk dizoom di admin
    let compressedBuffer: Buffer;
    try {
      compressedBuffer = await sharp(buffer)
        .rotate() // auto-orientasi berdasarkan EXIF (foto dari HP kadang kesimpen miring)
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true, // jangan perbesar gambar yang sudah kecil
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
    } catch (compressErr) {
      console.error("UPLOAD ERROR (compress):", compressErr);
      return NextResponse.json({ error: "Gagal memproses gambar" }, { status: 500 });
    }

    // Upload ke Garage (S3-compatible)
    const key = `svcteam/${randomUUID()}.jpg`;

    try {
      await garageClient.send(
        new PutObjectCommand({
          Bucket: GARAGE_BUCKET,
          Key: key,
          Body: compressedBuffer,
          ContentType: "image/jpeg",
        })
      );
    } catch (uploadErr) {
      console.error("UPLOAD ERROR (Garage):", uploadErr);
      return NextResponse.json({ error: "Gagal mengupload foto ke storage" }, { status: 500 });
    }

    return NextResponse.json({ url: garagePublicUrl(key), public_id: key });
  } catch (e: unknown) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Gagal mengupload foto" }, { status: 500 });
  }
}
