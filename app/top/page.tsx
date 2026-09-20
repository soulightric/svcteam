"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Home,
  LogIn,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import Footer from "@/app/components/Footer";

interface CategoryRank {
  value: string;
  label: string;
  color: string;
  count: number;
  percentage: number;
  rank: number;
  tier: "S" | "A" | "B" | "C";
}

interface TopResponse {
  total: number;
  categories: CategoryRank[];
  updatedAt: string;
}

const tierConfig = {
  S: { label: "Prioritas tertinggi", color: "#f59e0b", background: "#fff7ed", border: "#fed7aa" },
  A: { label: "Sangat ramai", color: "#ef4444", background: "#fef2f2", border: "#fecaca" },
  B: { label: "Perlu perhatian", color: "#2563eb", background: "#eff6ff", border: "#bfdbfe" },
  C: { label: "Tetap dipantau", color: "#64748b", background: "#f8fafc", border: "#cbd5e1" },
} as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function TopPage() {
  const [data, setData] = useState<TopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/top", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal mengambil data");
      setData((await response.json()) as TopResponse);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const topThree = data?.categories.slice(0, 3) ?? [];
  const maxCount = data?.categories[0]?.count ?? 1;

  return (
    <div className="min-h-screen flex flex-col surface-page">
      <header
        className="on-dark border-b border-white/10"
        style={{ backgroundColor: "#0f1b2d" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-teal-500/15 border border-teal-400/30">
              <BarChart3 size={19} className="text-teal-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-teal-300">Student Voice Campus</p>
              <p className="text-white font-semibold leading-tight">Radar Aduan</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-5 text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <Home size={15} /> <span className="hidden sm:inline">Beranda</span>
            </Link>
            <Link href="/lacak" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              Lacak Aduan <ChevronRight size={14} />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-3 py-2 rounded font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors">
              <LogIn size={15} /> <span className="hidden sm:inline">Masuk</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden on-dark" style={{ backgroundColor: "#0f1b2d" }}>
          <div className="absolute inset-0 opacity-20 noise-bg" />
          <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-300 mb-5">
                <Sparkles size={14} /> Peta perhatian kampus
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.05] mb-5">
                Kategori yang paling sering disuarakan.
              </h1>
              <p className="text-slate-300 max-w-2xl leading-relaxed">
                Peringkat ini merangkum jumlah aduan per kategori secara anonim. Gunakan datanya sebagai sinyal untuk menentukan ruang kampus yang perlu mendapat perhatian lebih dulu.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-end gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Total aduan masuk</p>
                <p className="text-4xl font-semibold text-white">{loading ? "..." : formatNumber(data?.total ?? 0)}</p>
              </div>
              <div className="h-10 w-px bg-white/15 hidden sm:block" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Kategori dipantau</p>
                <p className="text-4xl font-semibold text-amber-300">{loading ? "..." : data?.categories.length ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-10 pb-16">
          {error ? (
            <div className="rounded border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--danger-soft-border)" }}>
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>Peringkat belum tersedia</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Data statistik sedang mengalami gangguan.</p>
                </div>
              </div>
              <button onClick={() => void loadData()} className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors">
                <RefreshCw size={15} /> Coba lagi
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {topThree.map((category, index) => {
                  const tier = tierConfig[category.tier];
                  return (
                    <article
                      key={category.value}
                      className={`rounded border p-5 shadow-sm ${index === 0 ? "md:-translate-y-4" : ""}`}
                      style={{ backgroundColor: "var(--bg-elevated)", borderColor: index === 0 ? tier.border : "var(--border)" }}
                    >
                      <div className="flex items-center justify-between mb-7">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: tier.color }}>#{category.rank} / Tier {category.tier}</span>
                        {index === 0 ? <Trophy size={19} style={{ color: tier.color }} /> : <ArrowUpRight size={18} style={{ color: category.color }} />}
                      </div>
                      <div className="w-11 h-11 rounded flex items-center justify-center mb-4" style={{ backgroundColor: `${category.color}18`, color: category.color }}>
                        <span className="text-lg font-bold">{category.label.charAt(0)}</span>
                      </div>
                      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>{category.label}</h2>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tier.label}</p>
                      <div className="mt-7 flex items-end justify-between">
                        <p className="text-3xl font-semibold" style={{ color: category.color }}>{formatNumber(category.count)}</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{category.percentage}% dari total</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-teal-600 font-semibold mb-1">Tier board</p>
                  <h2 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Semua kategori</h2>
                </div>
                {data?.updatedAt && <p className="text-xs text-right" style={{ color: "var(--text-faint)" }}>Diperbarui {new Date(data.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>}
              </div>

              <div className="space-y-3">
                {data?.categories.map((category) => {
                  const tier = tierConfig[category.tier];
                  const width = maxCount > 0 ? Math.max(5, (category.count / maxCount) * 100) : 5;
                  return (
                    <article key={category.value} className="rounded border p-4 sm:p-5" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-11 h-11 shrink-0 rounded flex items-center justify-center font-bold" style={{ backgroundColor: tier.background, color: tier.color, border: `1px solid ${tier.border}` }}>{category.tier}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate" style={{ color: "var(--text)" }}>{category.label}</h3>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Peringkat #{category.rank} · {category.percentage}%</p>
                            </div>
                            <p className="text-lg font-semibold shrink-0" style={{ color: category.color }}>{formatNumber(category.count)}</p>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-muted)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, backgroundColor: category.color }} />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
