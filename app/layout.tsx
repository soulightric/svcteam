import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Voice Campus \\ ITH",
  description: "Portal pengaduan dan feedback fasilitas kampus. Sampaikan masukan Anda untuk pelayanan yang lebih baik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
