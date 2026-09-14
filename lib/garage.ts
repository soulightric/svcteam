import { S3Client } from "@aws-sdk/client-s3";

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
