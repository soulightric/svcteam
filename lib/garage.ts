import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Client S3 untuk Garage (self-hosted, ganti Cloudinary).
 * Endpoint ini dipakai untuk UPLOAD (PUT) lewat S3 API Garage.
 * File yang sudah diupload dibaca publik lewat domain terpisah
 * (lihat PUBLIC_BASE_URL di route upload) yang di-proxy ke
 * fitur website-hosting Garage, bukan lewat endpoint S3 API ini.
 */
export const garageClient = new S3Client({
  endpoint: process.env.GARAGE_ENDPOINT, // https://storage.algorithmics.web.id
  region: process.env.GARAGE_REGION ?? "garage",
  credentials: {
    accessKeyId: process.env.GARAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.GARAGE_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true,
});

export const GARAGE_BUCKET = process.env.GARAGE_BUCKET ?? "svc-uploads";

/** Base URL publik untuk baca file (domain website-hosting Garage). */
export const GARAGE_PUBLIC_BASE_URL = process.env.GARAGE_PUBLIC_BASE_URL ?? "";

export function garagePublicUrl(key: string): string {
  return `${GARAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}

/** Ambil object key hanya dari URL publik Garage milik aplikasi. */
export function garageKeyFromPublicUrl(url: string): string | null {
  const publicBaseUrl = process.env.GARAGE_PUBLIC_BASE_URL || GARAGE_PUBLIC_BASE_URL;
  if (!publicBaseUrl) return null;

  try {
    const publicUrl = new URL(url);
    const baseUrl = new URL(publicBaseUrl);
    const basePath = baseUrl.pathname.replace(/\/$/, "");

    if (publicUrl.origin !== baseUrl.origin) return null;
    if (!publicUrl.pathname.startsWith(`${basePath}/`)) return null;

    const key = decodeURIComponent(publicUrl.pathname.slice(basePath.length + 1));
    return key.startsWith("svcteam/") ? key : null;
  } catch {
    return null;
  }
}

/** Hapus object lampiran dari Garage; URL lama/non-Garage diabaikan. */
export async function deleteGarageObject(url: string): Promise<void> {
  const key = garageKeyFromPublicUrl(url);
  if (!key) return;

  await garageClient.send(
    new DeleteObjectCommand({
      Bucket: GARAGE_BUCKET,
      Key: key,
    })
  );
}
