"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, GraduationCap, Wifi, Utensils, Building2, ShieldCheck,
  FlaskConical, Bus, CheckCircle2, Clock3, XCircle, MessageSquare,
  Hash, CalendarDays, RefreshCw, AlertCircle, ChevronLeft,
  Send, Inbox, Users, TrendingUp, ShieldAlert, X, Trash2, LogOut, LayoutDashboard,
  UserPlus, Eye, EyeOff, KeyRound, Menu, Search, ImageIcon,
} from "lucide-react";

type StatusType = "menunggu" | "diterima" | "ditolak";
type TabType = "aduan" | "mahasiswa" | "admin";

interface Feedback {
  id: string; kategori: string; judul: string; deskripsi: string;
  status: StatusType; createdAt: string; balasan?: string | null;
  mahasiswa: { nama: string; nim: string };
  lampiran?: string | null;
}
interface Mahasiswa {
  id: string; nim: string; nama: string; createdAt: string;
  _count: { feedbacks: number };
}

const KATEGORI_LIST = [
  { value: "akademik",     label: "Akademik",              icon: GraduationCap, color: "#3b82f6" },
  { value: "perpustakaan", label: "Perpustakaan",          icon: BookOpen,      color: "#8b5cf6" },
  { value: "internet",     label: "Internet & Teknologi",  icon: Wifi,          color: "#06b6d4" },
  { value: "kantin",       label: "Kantin & Konsumsi",     icon: Utensils,      color: "#f97316" },
  { value: "gedung",       label: "Gedung & Ruang Kelas",  icon: Building2,     color: "#64748b" },
  { value: "keamanan",     label: "Keamanan & Ketertiban", icon: ShieldCheck,   color: "#ef4444" },
  { value: "laboratorium", label: "Laboratorium",          icon: FlaskConical,  color: "#10b981" },
  { value: "transportasi", label: "Transportasi & Parkir", icon: Bus,           color: "#f59e0b" },
];

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  menunggu: { label: "Menunggu", color: "#b45309", bg: "#fef3c7", border: "#fcd34d", icon: Clock3 },
  diterima: { label: "Diterima", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle2 },
  ditolak:  { label: "Ditolak",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", icon: XCircle },
};

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getKategori(value: string) { return KATEGORI_LIST.find((k) => k.value === value) ?? KATEGORI_LIST[0]; }

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status]; const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ fb, onClose, onUpdate }: {
  fb: Feedback; onClose: () => void;
  onUpdate: (id: string, status: StatusType, balasan: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<StatusType>(fb.status);
  const [balasan, setBalasan] = useState(fb.balasan ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const kat = getKategori(fb.kategori); const KatIcon = kat.icon;

  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate(fb.id, status, balasan); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,27,45,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: kat.color + "18", color: kat.color }}>
              <KatIcon size={16} /></div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{kat.label}</p>
              <h3 className="font-semibold text-slate-800 text-sm">{fb.judul}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nama",    value: fb.mahasiswa.nama },
              { label: "NIM",     value: fb.mahasiswa.nim },
              { label: "ID",      value: fb.id.slice(0,8).toUpperCase() },
              { label: "Tanggal", value: formatTanggal(fb.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-medium text-slate-700">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded p-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi</p>
            <p className="text-sm text-slate-700 leading-relaxed">{fb.deskripsi}</p>
          </div>

          {fb.lampiran && (
            <div className="rounded overflow-hidden border border-slate-200">
              <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: "#f8f7f4" }}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={11} />Foto Lampiran
                </p>
                <a href={fb.lampiran} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  <Eye size={11} />Lihat penuh
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fb.lampiran} alt="Lampiran" className="w-full max-h-48 object-cover cursor-pointer"
                onClick={() => window.open(fb.lampiran!, "_blank")} />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ubah Status</p>
            <div className="grid grid-cols-3 gap-2">
              {(["menunggu", "diterima", "ditolak"] as StatusType[]).map((s) => {
                const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon; const sel = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded border text-xs font-semibold transition-all"
                    style={{ borderColor: sel ? cfg.color : "#e2e8f0", backgroundColor: sel ? cfg.bg : "white", color: sel ? cfg.color : "#94a3b8" }}>
                    <Icon size={18} />{cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              {status === "diterima" ? "Balasan / Tindak Lanjut" : status === "ditolak" ? "Alasan Penolakan" : "Catatan (opsional)"}
            </label>
            <textarea value={balasan} onChange={(e) => setBalasan(e.target.value)} rows={4}
              placeholder={status === "diterima" ? "Jelaskan tindak lanjut..." : status === "ditolak" ? "Jelaskan alasan penolakan..." : "Tambahkan catatan..."}
              className="w-full px-3 py-2.5 rounded border text-sm transition-all outline-none resize-none"
              style={{ borderColor: "#e2e8f0" }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: saved ? "#10b981" : "#0f1b2d", color: "white" }}>
            {saving ? <RefreshCw size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Send size={15} />}
            {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Mahasiswa ─────────────────────────────────────────────────────────────
function MahasiswaTab() {
  const [list, setList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nim: "", nama: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<Mahasiswa | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/mahasiswa");
      if (!res.ok) throw new Error();
      setList(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nim || !form.nama || !form.password) { setError("Semua field wajib diisi"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchList();
      setForm({ nim: "", nama: "", password: "" });
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/mahasiswa/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) return;
    await fetch(`/api/mahasiswa/${resetTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setResetTarget(null);
    setNewPassword("");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">
            {list.length} Mahasiswa Terdaftar
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all"
          style={{ backgroundColor: showForm ? "#f1f5f9" : "#0f1b2d", color: showForm ? "#64748b" : "white" }}>
          <UserPlus size={13} />{showForm ? "Batal" : "Tambah Mahasiswa"}
        </button>
      </div>

      {/* Form tambah */}
      {showForm && (
        <div className="bg-white rounded border border-slate-100 p-5 mb-4 animate-fade-up">
          <h3 className="serif text-base text-slate-800 mb-4">Tambah Mahasiswa Baru</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                <AlertCircle size={12} />{error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">NIM *</label>
                <input type="text" value={form.nim} onChange={(e) => setForm((f) => ({ ...f, nim: e.target.value }))}
                  placeholder="24XXXXXXXX"
                  className="w-full px-3 py-2.5 rounded border text-sm outline-none transition-all"
                  style={{ borderColor: "#e2e8f0" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama *</label>
                <input type="text" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full px-3 py-2.5 rounded border text-sm outline-none transition-all"
                  style={{ borderColor: "#e2e8f0" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Password awal mahasiswa"
                  className="w-full px-3 pr-10 py-2.5 rounded border text-sm outline-none transition-all"
                  style={{ borderColor: "#e2e8f0" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#0d9488", color: "white" }}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
              {saving ? "Menyimpan..." : "Simpan Mahasiswa"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Users size={36} className="text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Belum ada mahasiswa terdaftar</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="col-span-2">NIM</span>
              <span className="col-span-4">Nama</span>
              <span className="col-span-2 text-center">Aduan</span>
              <span className="col-span-2">Terdaftar</span>
              <span className="col-span-2">Aksi</span>
            </div>
            <div className="divide-y divide-slate-50">
              {list.map((m) => (
                <div key={m.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors group">
                  <span className="col-span-2 text-xs font-mono text-slate-600">{m.nim}</span>
                  <span className="col-span-4 text-sm font-medium text-slate-800 truncate">{m.nama}</span>
                  <div className="col-span-2 flex justify-center">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: m._count.feedbacks > 0 ? "#dbeafe" : "#f1f5f9", color: m._count.feedbacks > 0 ? "#1d4ed8" : "#94a3b8" }}>
                      {m._count.feedbacks} aduan
                    </span>
                  </div>
                  <span className="col-span-2 text-xs text-slate-400">{formatTanggal(m.createdAt)}</span>
                  <div className="col-span-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setResetTarget(m); setNewPassword(""); }}
                      className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Reset Password">
                      <KeyRound size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(m.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Hapus">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,27,45,0.6)" }}>
          <div className="bg-white rounded shadow-2xl p-6 max-w-sm w-full animate-fade-up">
            <div className="w-12 h-12 rounded flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: "#fee2e2" }}>
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="serif text-lg text-slate-800 text-center mb-2">Hapus Mahasiswa?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Semua data aduan mahasiswa ini juga akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#ef4444" }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,27,45,0.6)" }}>
          <div className="bg-white rounded shadow-2xl p-6 max-w-sm w-full animate-fade-up">
            <div className="w-12 h-12 rounded flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: "#dbeafe" }}>
              <KeyRound size={22} className="text-blue-500" />
            </div>
            <h3 className="serif text-lg text-slate-800 text-center mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 text-center mb-4">{resetTarget.nama} ({resetTarget.nim})</p>
            <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password baru"
              className="w-full px-3 py-2.5 rounded border text-sm outline-none mb-4 transition-all"
              style={{ borderColor: "#e2e8f0" }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
            <div className="flex gap-3">
              <button onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={handleResetPassword} disabled={!newPassword}
                className="flex-1 py-2.5 rounded text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#3b82f6" }}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("aduan");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentRole, setCurrentRole] = useState<"SUPER_ADMIN" | "ADMIN" | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const fetchFeedbacks = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error();
      setFeedbacks(await res.json());
    } catch { setError("Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const handleUpdate = async (id: string, status: StatusType, balasan: string) => {
    const res = await fetch(`/api/feedback/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, balasan }),
    });
    if (!res.ok) throw new Error();
    const updated: Feedback = await res.json();
    setFeedbacks((prev) => prev.map((f) => f.id === id ? updated : f));
    setSelected(updated);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/feedback/${id}`, { method: "DELETE" });
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
  };

  const stats = {
    total: feedbacks.length,
    menunggu: feedbacks.filter((f) => f.status === "menunggu").length,
    diterima: feedbacks.filter((f) => f.status === "diterima").length,
    ditolak:  feedbacks.filter((f) => f.status === "ditolak").length,
  };
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return feedbacks.filter((f) => {
      const statusOk = filterStatus === "semua" || f.status === filterStatus;
      const searchOk = !q ||
        f.judul.toLowerCase().includes(q) ||
        f.mahasiswa.nama.toLowerCase().includes(q) ||
        f.mahasiswa.nim.toLowerCase().includes(q) ||
        f.deskripsi.toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [feedbacks, filterStatus, search]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f2f5" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#0f1b2d" }} className="px-6 py-4 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
                <ShieldAlert size={15} className="text-white" />
              </div>
              <span className="text-white font-semibold text-sm serif">Admin Panel</span>
            </div>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-px h-4 bg-slate-700" />
              <a href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs">
                <ChevronLeft size={13} />Beranda
              </a>
              <div className="w-px h-4 bg-slate-700" />
              <a href="/admin/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors text-xs">
                <LayoutDashboard size={13} />Dashboard
              </a>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={fetchFeedbacks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw size={12} />Refresh
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:bg-red-500 text-white transition-colors"
              style={{ border: "1px solid rgba(255, 255, 255,0.1)"  }}>
              <LogOut size={12} />Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded transition-colors"
            style={{ backgroundColor: mobileMenuOpen ? "rgba(255,255,255,0.1)" : "transparent", color: "#94a3b8" }}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-50 animate-fade-up"
            style={{ backgroundColor: "#0f1b2d", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="max-w-7xl mx-auto px-6 py-3 space-y-1">
              <a href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft size={15} />Kembali ke Beranda
              </a>
              <a href="/admin/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-slate-400 hover:text-teal-400 hover:bg-white/5 transition-all">
                <LayoutDashboard size={15} />Dashboard Statistik
              </a>
              <div className="h-px my-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
              <button onClick={fetchFeedbacks}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left">
                <RefreshCw size={15} />Refresh Data
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Aduan", value: stats.total,    color: "#0f1b2d", bg: "#fff",     icon: TrendingUp },
            { label: "Menunggu",    value: stats.menunggu, color: "#b45309", bg: "#fef3c7",  icon: Clock3 },
            { label: "Diterima",    value: stats.diterima, color: "#065f46", bg: "#d1fae5",  icon: CheckCircle2 },
            { label: "Ditolak",     value: stats.ditolak,  color: "#991b1b", bg: "#fee2e2",  icon: XCircle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="rounded p-4 shadow-sm border border-slate-100" style={{ backgroundColor: bg }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-3xl font-bold serif" style={{ color }}>{value}</p>
              {stats.total > 0 && (
                <div className="mt-2 h-1 rounded bg-black/5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${(value / stats.total) * 100}%`, backgroundColor: color }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 bg-white rounded p-1 border border-slate-100 w-fit shadow-sm">
          {([
            { key: "aduan",      label: "Kelola Aduan",      icon: MessageSquare },
            { key: "mahasiswa",  label: "Kelola Mahasiswa",  icon: Users },
            { key: "admin", label: "Kelola Admin", icon: ShieldAlert },
          ] as { key: TabType; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold transition-all"
              style={activeTab === key
                ? { backgroundColor: "#0f1b2d", color: "white" }
                : { color: "#64748b" }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Tab: Aduan */}
        {activeTab === "aduan" && (
          <>
            {/* Search bar */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari by judul, nama mahasiswa, atau NIM..."
                className="w-full pl-10 pr-10 py-2.5 rounded border border-slate-200 bg-white text-sm outline-none transition-all"
                onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              {(["semua", "menunggu", "diterima", "ditolak"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                  style={filterStatus === s
                    ? { backgroundColor: "#0f1b2d", color: "white" }
                    : { backgroundColor: "white", color: "#64748b", border: "1px solid #e2e8f0" }}>
                  {s === "semua" ? `Semua (${stats.total})` : `${STATUS_CONFIG[s as StatusType].label} (${feedbacks.filter(f => f.status === s).length})`}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded border border-red-100 bg-red-50 p-4 mb-4 flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-white rounded border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-8 h-8 bg-slate-100 rounded flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                      <div className="h-6 w-20 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Inbox size={40} className="text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">Tidak ada aduan</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50">
                    {["ID","Aduan","Pelapor","Kategori","Tanggal","Status"].map((h, i) => (
                      <p key={h} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${i===0?"col-span-1":i===1?"col-span-3":i===2?"col-span-2":i===3?"col-span-2":i===4?"col-span-2":"col-span-2"}`}>{h}</p>
                    ))}
                  </div>
                  {filtered.map((fb) => {
                    const kat = getKategori(fb.kategori); const KatIcon = kat.icon;
                    return (
                      <div key={fb.id}
                        className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group items-center"
                        onClick={() => setSelected(fb)}>
                        <span className="col-span-1 text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Hash size={10} />{fb.id.slice(0,6).toUpperCase()}
                        </span>
                        <div className="col-span-3 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-700 transition-colors">{fb.judul}</p>
                          <p className="text-xs text-slate-400 truncate">{fb.deskripsi.slice(0,45)}...</p>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{fb.mahasiswa.nama}</p>
                          <p className="text-xs text-slate-400">{fb.mahasiswa.nim}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: kat.color + "15", color: kat.color }}>
                            <KatIcon size={11} />{kat.label}
                          </span>
                        </div>
                        <span className="col-span-2 flex items-center gap-1 text-xs text-slate-400">
                          <CalendarDays size={11} />{formatTanggal(fb.createdAt)}
                        </span>
                        <div className="col-span-2 flex items-center gap-2">
                          <StatusBadge status={fb.status} />
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(fb.id); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-slate-300 hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <MessageSquare size={12} />Klik baris untuk mengubah status dan balasan
            </p>
          </>
        )}

        {/* Tab: Mahasiswa */}
        {activeTab === "mahasiswa" && <MahasiswaTab />}

        {/* Tab: Kelola Admin */}
        {activeTab === "admin" && <KelolaAdmin />}
      </main>

      {selected && <DetailPanel fb={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,27,45,0.6)" }}>
          <div className="bg-white rounded shadow-2xl p-6 max-w-sm w-full animate-fade-up">
            <div className="w-12 h-12 rounded flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: "#fee2e2" }}>
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="serif text-lg text-slate-800 text-center mb-2">Hapus Aduan?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#ef4444" }}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== KOMPONEN KELOLA ADMIN ====================
function KelolaAdmin() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    role: "ADMIN",
  });

  // Ambil daftar admin
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin");

      if (res.status === 403) {
        setError("Hanya Super Admin yang dapat mengakses halaman ini.");
        setAdmins([]);
        return;
      }

      if (!res.ok) {
        setError("Gagal memuat data admin");
        return;
      }

      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Fungsi Tambah Admin Baru
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newAdmin.username || !newAdmin.password) {
      setError("Username dan password wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menambahkan admin");
        return;
      }

      setSuccess("Admin baru berhasil ditambahkan!");
      setNewAdmin({ username: "", password: "", role: "ADMIN" });
      fetchAdmins(); // refresh list
    } catch (err) {
      setError("Terjadi kesalahan saat menambahkan admin");
    }
  };

  return (
    <div className="bg-white rounded border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="text-teal-600" size={22} />
        <h2 className="text-xl font-semibold">Kelola Admin</h2>
      </div>

      {/* Form Tambah Admin */}
      <div className="mb-8 border-b pb-6">
        <h3 className="font-semibold mb-4 text-slate-700">Tambah Admin Baru</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Username"
            className="border border-slate-300 p-2.5 rounded text-sm focus:outline-none focus:border-teal-600"
            value={newAdmin.username}
            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-slate-300 p-2.5 rounded text-sm focus:outline-none focus:border-teal-600"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
          />
          <select
            className="border border-slate-300 p-2.5 rounded text-sm focus:outline-none focus:border-teal-600"
            value={newAdmin.role}
            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
          >
            <option value="ADMIN">Admin Biasa</option>
            {/* <option value="SUPER_ADMIN">Super Admin</option> */}
          </select>

          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 transition-colors text-white px-4 py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2"
          >
            <UserPlus size={16} /> Tambah Admin
          </button>
        </form>
      </div>

      {/* Daftar Admin */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-700">Daftar Admin</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="animate-spin text-slate-400" />
          </div>
        ) : error && admins.length === 0 ? (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">Belum ada admin terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Dibuat Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{admin.username}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          admin.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(admin.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
