/**
 * AI Classifier — Sistem Cerdas untuk SVC.
 *
 * Memanggil model kecil (mis. llama3.2:3b) yang di-host sendiri lewat Ollama,
 * diekspos sebagai endpoint OpenAI-compatible di belakang Nginx + API key
 * (lihat OLLAMA_BASE_URL / OLLAMA_API_KEY di .env).
 *
 * Didesain fail-safe: kalau model tidak bisa dihubungi, timeout, atau balasannya
 * tidak valid, fungsi ini mengembalikan `null` — pemanggil (route feedback)
 * WAJIB tetap menyimpan tiket dengan nilai default, jangan sampai AI down
 * membuat mahasiswa gagal lapor aduan.
 */

import { KATEGORI_LIST, type KategoriValue } from "./constants";

export type PrioritasValue = "rendah" | "sedang" | "tinggi";

export interface AiClassificationResult {
  kategori: KategoriValue;
  prioritas: PrioritasValue;
  alasan?: string;
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL; // contoh: https://svc.algorithmics.web.id/v1
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const TIMEOUT_MS = 8_000; // demi UX form submit — jangan bikin mahasiswa nunggu lama

const KATEGORI_VALUES = KATEGORI_LIST.map((k) => k.value).join(", ");

const SYSTEM_PROMPT = `Kamu adalah sistem klasifikasi aduan kampus (Student Voice Campus).
Tugasmu: baca judul & deskripsi aduan mahasiswa, lalu tentukan kategori dan prioritas yang paling sesuai.

Kategori yang valid HANYA salah satu dari: ${KATEGORI_VALUES}.
Prioritas yang valid HANYA salah satu dari: rendah, sedang, tinggi.
Gunakan "tinggi" untuk hal yang menyangkut keselamatan/keamanan atau mengganggu banyak orang (mis. kebakaran, kebocoran listrik, kerusakan yang menghentikan aktivitas belajar).
Gunakan "rendah" untuk masukan kosmetik/minor.

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence, dengan bentuk persis:
{"kategori": "...", "prioritas": "...", "alasan": "penjelasan singkat 1 kalimat"}`;

function isValidKategori(value: unknown): value is KategoriValue {
  return (
    typeof value === "string" &&
    KATEGORI_LIST.some((k) => k.value === value)
  );
}

function isValidPrioritas(value: unknown): value is PrioritasValue {
  return value === "rendah" || value === "sedang" || value === "tinggi";
}

/** Ambil blok JSON pertama dari teks — jaga-jaga kalau model tetap nambah teks lain. */
function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function classifyFeedback(
  judul: string,
  deskripsi: string
): Promise<AiClassificationResult | null> {
  if (!OLLAMA_BASE_URL) {
    // AI belum dikonfigurasi — bukan error, cuma fitur nonaktif.
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Judul: ${judul}\nDeskripsi: ${deskripsi}` },
        ],
        stream: false,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.error("AI classifier: HTTP", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = extractJson(content) as Record<string, unknown> | null;
    if (!parsed) return null;

    const { kategori, prioritas, alasan } = parsed;
    if (!isValidKategori(kategori) || !isValidPrioritas(prioritas)) {
      console.error("AI classifier: hasil tidak valid", parsed);
      return null;
    }

    return {
      kategori,
      prioritas,
      alasan: typeof alasan === "string" ? alasan : undefined,
    };
  } catch (error) {
    // Timeout, network error, dll — jangan sampai bikin request utama gagal.
    console.error("AI classifier error:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
