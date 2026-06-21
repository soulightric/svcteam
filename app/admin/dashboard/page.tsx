"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ShieldAlert, ChevronLeft, LogOut, RefreshCw, LayoutDashboard, Menu, X as XIcon,
  TrendingUp, Users, Clock3, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total: number; menunggu: number; diterima: number; ditolak: number ; selesai: number;
  totalMahasiswa: number; responseRate: number; acceptRate: number ; completionRate: number;
}
interface KategoriData {
  kategori: string; total: number; menunggu: number; diterima: number; ditolak: number; selesai: number;
}
interface BulanData {
  bulan: string; total: number; menunggu: number; diterima: number; ditolak: number; selesai: number;
}
interface DashboardData {
  summary: Summary;
  perKategori: KategoriData[];
  perBulan: BulanData[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const KATEGORI_LABELS: Record<string, string> = {
  akademik: "Akademik", perpustakaan: "Perpustakaan", internet: "Internet",
  kantin: "Kantin", gedung: "Gedung", keamanan: "Keamanan",
  laboratorium: "Lab", transportasi: "Transportasi",
};

const STATUS_COLORS = { menunggu: "#f59e0b", diterima: "#10b981", ditolak: "#ef4444", selesai: "#166534" };
const PIE_COLORS = ["#f59e0b", "#10b981", "#ef4444", "#166534"];

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded shadow-lg p-3 text-xs" style={{ backgroundColor: "#0f1b2d", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg, border, icon: Icon, suffix = "" }: {
  label: string; value: number | string; sub?: string; color: string;
  bg: string; border: string; icon: React.ElementType; suffix?: string;
}) {
  return (
    <div className="rounded p-5 border transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: bg, borderColor: border }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold serif mb-1" style={{ color }}>{value}{suffix}</p>
      {sub && <p className="text-xs" style={{ color: color + "99" }}>{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { setError("Gagal memuat data dashboard."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Pie data
  const pieData = data ? [
    { name: "Menunggu", value: data.summary.menunggu },
    { name: "Diterima", value: data.summary.diterima },
    { name: "Ditolak",  value: data.summary.ditolak },
    { name: "Selesai",  value: data.summary.selesai },
  ] : [];

  // Kategori chart data (shorten labels)
  const kategoriChartData = data?.perKategori.map((k) => ({
    ...k,
    label: KATEGORI_LABELS[k.kategori] ?? k.kategori,
  })) ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f2f5" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#0f1b2d" }} className="px-6 py-4 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
                <LayoutDashboard size={14} className="text-white" />
              </div>
              <span className="text-white font-semibold text-sm serif">Dashboard Statistik</span>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-px h-4 bg-slate-700" />
              <a href="/admin" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs">
                <ChevronLeft size={13} />Admin Panel
              </a>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", backgroundColor: "rgba(239,68,68,0.1)" }}>
              <LogOut size={12} />Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded transition-colors"
            style={{ backgroundColor: mobileMenuOpen ? "rgba(255,255,255,0.1)" : "transparent", color: "#94a3b8" }}>
            {mobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-50 animate-fade-up"
            style={{ backgroundColor: "#0f1b2d", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="max-w-7xl mx-auto px-6 py-3 space-y-1">
              <a href="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft size={15} />Kembali ke Admin Panel
              </a>
              <div className="h-px my-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
              <button onClick={fetchData}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left">
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh Data
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-all text-left"
                style={{ color: "#fca5a5" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Error */}
        {error && (
          <div className="rounded border border-red-100 bg-red-50 p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-28 bg-white rounded animate-pulse border border-slate-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2].map((i) => (
                <div key={i} className="h-72 bg-white rounded animate-pulse border border-slate-100" />
              ))}
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard label="Total Aduan"   value={data.summary.total}           color="#0d9488" bg="#f0fdfa" border="#99f6e4" icon={TrendingUp}   sub={`${data.summary.totalMahasiswa} mahasiswa terdaftar`} />
              <StatCard label="Menunggu"      value={data.summary.menunggu}        color="#b45309" bg="#fef3c7" border="#fcd34d" icon={Clock3}        sub={`${data.summary.total > 0 ? Math.round((data.summary.menunggu/data.summary.total)*100) : 0}% dari total`} />
              <StatCard label="Diterima"      value={data.summary.diterima}        color="#04355e" bg="#d1fae5" border="#6ee7b7" icon={CheckCircle2}  sub={`Acceptance rate ${data.summary.acceptRate}%`} />
              <StatCard label="Response Rate" value={data.summary.responseRate}    color="#7c3aed" bg="#f5f3ff" border="#c4b5fd" icon={Activity}      sub="Aduan sudah direspons" suffix="%" />
              <StatCard label="Completion Rate" value={data.summary.completionRate}  color="#1b8129" bg="#d1fae5" border="#6ee7b7" icon={CheckCircle2}  sub="Aduan yang diselesaikan" suffix="%" />
            </div>

            {/* ── Row 1: Line Chart + Pie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Tren 6 bulan */}
              <div className="lg:col-span-2 bg-white rounded border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Tren Aduan 6 Bulan Terakhir</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Jumlah aduan masuk per bulan</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {Object.entries(STATUS_COLORS).map(([k, c]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c }} />
                        <span className="text-xs text-slate-400 capitalize">{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.perBulan} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="menunggu" name="Menunggu" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="diterima" name="Diterima" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="ditolak"  name="Ditolak"  stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="selesai"  name="Selesai"  stroke="#166534" strokeWidth={2.5} dot={{ r: 4, fill: "#166534" }} activeDot={{ r: 6 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded border border-slate-100 shadow-sm p-5">
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-800 text-sm">Distribusi Status</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Perbandingan status aduan</p>
                </div>
                {data.summary.total === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <p className="text-xs text-slate-400">Belum ada data</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                          paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: PIE_COLORS[i] }} />
                            <span className="text-xs text-slate-600">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">{item.value}</span>
                            <span className="text-[10px] text-slate-400">
                              ({data.summary.total > 0 ? Math.round((item.value / data.summary.total) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Row 2: Bar Chart per Kategori ── */}
            <div className="bg-white rounded border border-slate-100 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Aduan per Kategori</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribusi aduan berdasarkan kategori fasilitas</p>
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(STATUS_COLORS).map(([k, c]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c }} />
                      <span className="text-xs text-slate-400 capitalize">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
              {kategoriChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <p className="text-xs text-slate-400">Belum ada data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={kategoriChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={20} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="menunggu" name="Menunggu" fill="#f59e0b" radius={[4,4,0,0]} />
                    <Bar dataKey="diterima" name="Diterima" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="ditolak"  name="Ditolak"  fill="#ef4444" radius={[4,4,0,0]} />
                    <Bar dataKey="selesai"  name="Selesai"  fill="#166534" radius={[4,4,0,0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Row 3: Top Kategori + Ringkasan ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top kategori */}
              <div className="bg-white rounded border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">Kategori Terbanyak</h3>
                {data.perKategori.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Belum ada data</p>
                ) : (
                  <div className="space-y-3">
                    {data.perKategori.slice(0, 6).map((k, i) => {
                      const pct = data.summary.total > 0 ? Math.round((k.total / data.summary.total) * 100) : 0;
                      const colors = ["#0d9488","#3b82f6","#8b5cf6","#f97316","#ef4444","#f59e0b"];
                      return (
                        <div key={k.kategori}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
                              <span className="text-xs font-medium text-slate-700">
                                {KATEGORI_LABELS[k.kategori] ?? k.kategori}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{pct}%</span>
                              <span className="text-xs font-semibold text-slate-800">{k.total}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded bg-slate-100 overflow-hidden">
                            <div className="h-full rounded transition-all"
                              style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ringkasan cepat */}
              <div className="bg-white rounded border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">Ringkasan</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total mahasiswa aktif",    value: `${data.summary.totalMahasiswa} orang`,       color: "#0d9488" },
                    { label: "Aduan belum direspons",    value: `${data.summary.menunggu} aduan`,             color: "#f59e0b" },
                    { label: "Tingkat penerimaan",       value: `${data.summary.acceptRate}%`,                color: "#10b981" },
                    { label: "Tingkat respons keseluruhan", value: `${data.summary.responseRate}%`,           color: "#7c3aed" },
                    { label: "Rata-rata aduan/mahasiswa",
                      value: data.summary.totalMahasiswa > 0
                        ? `${(data.summary.total / data.summary.totalMahasiswa).toFixed(1)}x`
                        : "—",
                      color: "#0f1b2d" },
                    { label: "Aduan bulan ini",
                      value: `${data.perBulan[data.perBulan.length - 1]?.total ?? 0} aduan`,
                      color: "#64748b" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>

                <a href="/admin"
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded text-xs font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "#0f1b2d", color: "white" }}>
                  Ke Panel Admin <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
