import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import cloudinary from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  try {
    // Cek auth: boleh mahasiswa (lampiran aduan) ATAU admin (lampiran balasan/tindak lanjut)
    const cookieStore = await cookies();
    const mahasiswaToken = cookieStore.get("mahasiswa_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;
    const token = mahasiswaToken ?? adminToken;
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

    // Pastikan kredensial Cloudinary tersedia di runtime.
    // Penyebab umum 500: env CLOUDINARY_* tidak ter-load (mis. menjalankan
    // build standalone `node server.js` tanpa env, atau .env tidak di-inject).
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("UPLOAD ERROR: Kredensial Cloudinary tidak ditemukan di environment.");
      return NextResponse.json(
        { error: "Konfigurasi Cloudinary belum di-set di server (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)." },
        { status: 500 }
      );
    }

    // Upload ke Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "siaduan-kampus",
          resource_type: "image",
          transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload Cloudinary gagal tanpa hasil"));
          else resolve(result as { secure_url: string; public_id: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (e: unknown) {
    // Tampilkan pesan asli supaya mudah di-debug (mis. masalah kredensial / jaringan)
    const msg =
      (e as { error?: { message?: string } })?.error?.message ||
      (e as { message?: string })?.message ||
      "Gagal mengupload foto";
    console.error("UPLOAD ERROR:", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
