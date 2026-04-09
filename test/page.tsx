"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, GraduationCap, Wifi, Utensils, Building2, ShieldCheck,
  FlaskConical, Bus, CheckCircle2, Clock3, XCircle, ChevronDown,
  Send, Inbox, Filter, X, CalendarDays, MessageSquare, Hash,
  TrendingUp, AlertCircle, RefreshCw, LogOut, User, Search,
  Pencil, Trash2,
} from "lucide-react";
import Image from "next/image";
import NotificationBell from "@/app/components/NotificationBell";

type StatusType = "menunggu" | "diterima" | "ditolak";

interface Mahasiswa { nama: string; nim: string; }
interface Feedback {
  id: string; kategori: string; judul: string; deskripsi: string;
  status: StatusType; createdAt: string; balasan?: string | null;
  mahasiswa: Mahasiswa; mahasiswaId: string;
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

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; border: string; icon: React.ElementType; dotClass: string }> = {
  menunggu: { label: "Menunggu", color: "#b45309", bg: "#fef3c7", border: "#fcd34d", icon: Clock3,       dotClass: "status-dot-pending" },
  diterima: { label: "Diterima", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle2, dotClass: "" },
  ditolak:  { label: "Ditolak",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", icon: XCircle,      dotClass: "" },
};

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getKategori(value: string) { return KATEGORI_LIST.find((k) => k.value === value) ?? KATEGORI_LIST[0]; }

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status]; const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} style={{ backgroundColor: cfg.color }} />
      <Icon size={11} />{cfg.label}
    </span>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ fb, onClose, onSave }: {
  fb: Feedback;
  onClose: () => void;
  onSave: (id: string, data: { kategori: string; judul: string; deskripsi: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ kategori: fb.kategori, judul: fb.judul, deskripsi: fb.deskripsi });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.kategori) e.kategori = "Pilih kategori";
    if (!form.judul.trim()) e.judul = "Judul wajib diisi";
    if (form.deskripsi.trim().length < 20) e.deskripsi = "Minimal 20 karakter";
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(fb.id, form); onClose(); }
    finally { setSaving(false); }
  };

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,27,45,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-slate-800 serif text-lg">Edit Aduan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Hanya aduan berstatus Menunggu yang bisa diedit</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kategori *</label>
            <div className="grid grid-cols-2 gap-2">
              {KATEGORI_LIST.map((kat) => { const Icon = kat.icon; const sel = form.kategori === kat.value; return (
                <button type="button" key={kat.value} onClick={() => set("kategori", kat.value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
                  style={{ borderColor: sel ? kat.color : "#e2e8f0", backgroundColor: sel ? kat.color + "15" : "white", color: sel ? kat.color : "#64748b" }}>
                  <Icon size={14} />{kat.label}
                </button>); })}
            </div>
            {errors.kategori && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.kategori}</p>}
          </div>

          {/* Judul */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Judul *</label>
            <input type="text" value={form.judul} onChange={(e) => set("judul", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: errors.judul ? "#ef4444" : "#e2e8f0" }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = errors.judul ? "#ef4444" : "#e2e8f0")} />
            {errors.judul && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.judul}</p>}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi *</label>
            <textarea value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} rows={4}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all"
              style={{ borderColor: errors.deskripsi ? "#ef4444" : "#e2e8f0" }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = errors.deskripsi ? "#ef4444" : "#e2e8f0")} />
            <div className="flex justify-between mt-1">
              {errors.deskripsi ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.deskripsi}</p> : <span />}
              <p className="text-xs text-slate-400">{form.deskripsi.length} karakter</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#0d9488", color: "white" }}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FeedbackCard ──────────────────────────────────────────────────────────────
function FeedbackCard({ fb, delay, currentUserId, onEdit, onDelete }: {
  fb: Feedback; delay: number; currentUserId: string | null;
  onEdit: (fb: Feedback) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const kat = getKategori(fb.kategori); const KatIcon = kat.icon;
  const isOwner = currentUserId === fb.mahasiswaId;
  const canEdit = isOwner && fb.status === "menunggu";

  return (
    <div className="card-feedback bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="h-1" style={{ backgroundColor: fb.status === "menunggu" ? "#f59e0b" : fb.status === "diterima" ? "#10b981" : "#ef4444" }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: kat.color + "18", color: kat.color }}><KatIcon size={18} /></div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{kat.label}</p>
              <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{fb.judul}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={fb.status} />
            {/* Edit/Delete — hanya muncul jika pemilik & masih menunggu */}
            {canEdit && (
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(fb)} title="Edit aduan"
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(fb.id)} title="Hapus aduan"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs text-slate-400"><Hash size={11} />{fb.id.slice(0,8).toUpperCase()}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <User size={11} />
            {fb.mahasiswa.nama}
            {isOwner && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>Anda</span>}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={11} />{formatTanggal(fb.createdAt)}</span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{fb.deskripsi}</p>

        <button onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors">
          {expanded ? "Sembunyikan" : "Lihat detail"}
          <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-3 animate-fade-up space-y-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Lengkap</p>
              <p className="text-sm text-slate-700 leading-relaxed">{fb.deskripsi}</p>
            </div>
            {fb.balasan && (
              <div className="rounded-xl p-3" style={{
                backgroundColor: fb.status === "diterima" ? "#d1fae5" : "#fee2e2",
                borderLeft: `3px solid ${fb.status === "diterima" ? "#10b981" : "#ef4444"}`,
              }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: fb.status === "diterima" ? "#065f46" : "#991b1b" }}>
                  {fb.status === "diterima" ? "✓ Balasan Resmi" : "✗ Alasan Penolakan"}
                </p>
                <p className="text-sm" style={{ color: fb.status === "diterima" ? "#064e3b" : "#7f1d1d" }}>{fb.balasan}</p>
              </div>
            )}
            {canEdit && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Pencil size={10} />Aduan masih bisa diedit atau dihapus selama berstatus Menunggu
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FeedbackForm ──────────────────────────────────────────────────────────────
function FeedbackForm({ onSubmit }: { onSubmit: (data: { kategori: string; judul: string; deskripsi: string }) => Promise<void> }) {
  const [form, setForm] = useState({ kategori: "", judul: "", deskripsi: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.kategori) e.kategori = "Pilih kategori terlebih dahulu";
    if (!form.judul.trim()) e.judul = "Judul wajib diisi";
    if (form.deskripsi.trim().length < 20) e.deskripsi = "Deskripsi minimal 20 karakter";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit(form);
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setForm({ kategori: "", judul: "", deskripsi: "" }); setErrors({}); }, 2500);
    } finally { setLoading(false); }
  };

  const set = (key: string, val: string) => { setForm((f) => ({ ...f, [key]: val })); setErrors((e) => ({ ...e, [key]: "" })); };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#d1fae5" }}>
        <CheckCircle2 size={32} className="text-emerald-600" /></div>
      <h3 className="serif text-xl text-slate-800 mb-2">Aduan Terkirim!</h3>
      <p className="text-sm text-slate-500 text-center">Laporan Anda sedang diproses. Pantau statusnya di bawah.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kategori Aduan *</label>
        <div className="grid grid-cols-2 gap-2">
          {KATEGORI_LIST.map((kat) => { const Icon = kat.icon; const sel = form.kategori === kat.value; return (
            <button type="button" key={kat.value} onClick={() => set("kategori", kat.value)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
              style={{ borderColor: sel ? kat.color : "#e2e8f0", backgroundColor: sel ? kat.color + "15" : "white", color: sel ? kat.color : "#64748b" }}>
              <Icon size={15} />{kat.label}
            </button>); })}
        </div>
        {errors.kategori && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errors.kategori}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Judul Aduan *</label>
        <input type="text" value={form.judul} onChange={(e) => set("judul", e.target.value)}
          placeholder="Ringkasan singkat masalah Anda"
          className="w-full px-3 py-2.5 rounded-xl border text-sm transition-all outline-none"
          style={{ borderColor: errors.judul ? "#ef4444" : "#e2e8f0", backgroundColor: "white" }}
          onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
          onBlur={(e) => (e.target.style.borderColor = errors.judul ? "#ef4444" : "#e2e8f0")} />
        {errors.judul && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.judul}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi Lengkap *</label>
        <textarea value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} rows={4}
          placeholder="Jelaskan masalah secara detail: lokasi, waktu kejadian, dampak..."
          className="w-full px-3 py-2.5 rounded-xl border text-sm transition-all outline-none resize-none"
          style={{ borderColor: errors.deskripsi ? "#ef4444" : "#e2e8f0", backgroundColor: "white" }}
          onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
          onBlur={(e) => (e.target.style.borderColor = errors.deskripsi ? "#ef4444" : "#e2e8f0")} />
        <div className="flex justify-between items-center mt-1">
          {errors.deskripsi ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.deskripsi}</p> : <span />}
          <p className="text-xs text-slate-400">{form.deskripsi.length} karakter</p>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: "#0f1b2d", color: "white" }}>
        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
        {loading ? "Mengirim..." : "Kirim Aduan"}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ nama: string; nim: string; id: string } | null>(null);
  const [editTarget, setEditTarget] = useState<Feedback | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data); })
      .catch(() => {});
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error();
      setFeedbacks(await res.json());
    } catch { setError("Tidak dapat terhubung ke database."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const handleNewFeedback = async (data: { kategori: string; judul: string; deskripsi: string }) => {
    const res = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    await fetchFeedbacks();
  };

  const handleEdit = async (id: string, data: { kategori: string; judul: string; deskripsi: string }) => {
    const res = await fetch(`/api/feedback/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    await fetchFeedbacks();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    setDeleteConfirm(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/mahasiswa-logout", { method: "POST" });
    router.push("/");
  };

  const stats = {
    total: feedbacks.length,
    menunggu: feedbacks.filter((f) => f.status === "menunggu").length,
    diterima: feedbacks.filter((f) => f.status === "diterima").length,
    ditolak:  feedbacks.filter((f) => f.status === "ditolak").length,
  };

  // Filter + Search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return feedbacks.filter((f) => {
      const statusOk = filterStatus === "semua" || f.status === filterStatus;
      const katOk    = filterKategori === "semua" || f.kategori === filterKategori;
      const searchOk = !q || f.judul.toLowerCase().includes(q) ||
        f.mahasiswa.nama.toLowerCase().includes(q) ||
        f.mahasiswa.nim.toLowerCase().includes(q) ||
        f.deskripsi.toLowerCase().includes(q);
      return statusOk && katOk && searchOk;
    });
  }, [feedbacks, filterStatus, filterKategori, search]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f7f4" }}>
      {/* Header */}
      <header className="relative overflow-hidden noise-bg" style={{ backgroundColor: "#0f1b2d" }}>
        <div className="absolute inset-0 opacity-10" style={{
          background: "radial-gradient(ellipse 80% 50% at 20% 40%, #0d9488, transparent), radial-gradient(ellipse 60% 40% at 80% 20%, #f59e0b, transparent)",
        }} />
        <div className="relative max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
                <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-teal-400 uppercase tracking-widest">Portal Resmi</p>
                <h1 className="text-white font-bold text-base leading-none serif">SiAduan Kampus</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
                    <User size={11} className="text-white" />
                  </div>
                  <span className="text-xs text-slate-300">{user.nama}</span>
                  <span className="text-xs text-slate-500">({user.nim})</span>
                </div>
              )}
              <NotificationBell />
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
                <LogOut size={12} />Logout
              </button>
            </div>
          </div>

          <div className="max-w-2xl">
            <h2 className="serif text-2xl md:text-3xl font-normal text-white leading-tight mb-2">
              Sistem Pengaduan <span style={{ color: "#fcd34d" }}>Fasilitas Kampus</span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sampaikan masukan terkait fasilitas dan pelayanan kampus. Setiap aduan akan ditindaklanjuti.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "Total",    value: stats.total,    color: "#94a3b8" },
              { label: "Menunggu", value: stats.menunggu, color: "#f59e0b" },
              { label: "Diterima", value: stats.diterima, color: "#10b981" },
              { label: "Ditolak",  value: stats.ditolak,  color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-400">{s.label}: <strong className="text-white">{s.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <aside className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100" style={{ backgroundColor: "#f8f7f4" }}>
                  <h2 className="serif text-xl text-slate-800">Buat Aduan Baru</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Isi form di bawah dengan lengkap dan jujur</p>
                </div>
                <div className="p-5"><FeedbackForm onSubmit={handleNewFeedback} /></div>
              </div>

              <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Keterangan Status</p>
                <div className="space-y-2">
                  {(["menunggu", "diterima", "ditolak"] as StatusType[]).map((s) => {
                    const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
                    return (
                      <div key={s} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                          <Icon size={15} style={{ color: cfg.color }} /></div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                          <p className="text-[11px] text-slate-400">
                            {s === "menunggu" ? "Bisa diedit/dihapus oleh Anda" : s === "diterima" ? "Aduan diterima dan ditindaklanjuti" : "Aduan tidak dapat diproses"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* List */}
          <section className="lg:col-span-3">
            {/* Search bar */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari aduan by judul, nama, atau NIM..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition-all"
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

            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
                {(["semua", "menunggu", "diterima", "ditolak"] as const).map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                    style={filterStatus === s
                      ? { backgroundColor: "#0f1b2d", color: "white" }
                      : { backgroundColor: "white", color: "#64748b", border: "1px solid #e2e8f0" }}>
                    {s === "semua" ? "Semua" : STATUS_CONFIG[s as StatusType].label}
                    {s !== "semua" && <span className="ml-1.5 opacity-70">({feedbacks.filter((f) => f.status === s).length})</span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchFeedbacks} className="p-2 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-colors">
                  <RefreshCw size={13} /></button>
                <button onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{ backgroundColor: showFilter ? "#0f1b2d" : "white", color: showFilter ? "white" : "#64748b", borderColor: showFilter ? "#0f1b2d" : "#e2e8f0" }}>
                  <Filter size={12} />Filter
                </button>
              </div>
            </div>

            {showFilter && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 animate-fade-up">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Kategori</p>
                  <button onClick={() => setShowFilter(false)}><X size={14} className="text-slate-400" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterKategori("semua")}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={filterKategori === "semua" ? { backgroundColor: "#0f1b2d", color: "white" } : { backgroundColor: "#f1f5f9", color: "#64748b" }}>
                    Semua
                  </button>
                  {KATEGORI_LIST.map((kat) => (
                    <button key={kat.value} onClick={() => setFilterKategori(kat.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={filterKategori === kat.value ? { backgroundColor: kat.color, color: "white" } : { backgroundColor: "#f1f5f9", color: "#64748b" }}>
                      {kat.label}
                    </button>))}
                </div>
              </div>
            )}

            {/* Info hasil */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-slate-400" />
                <p className="text-xs text-slate-400">
                  Menampilkan <strong className="text-slate-700">{filtered.length}</strong> aduan
                  {search && <> untuk <strong className="text-slate-700">&quot;{search}&quot;</strong></>}
                </p>
              </div>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  Hapus pencarian
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
                {search ? <Search size={36} className="text-slate-200 mb-3" /> : <Inbox size={36} className="text-slate-200 mb-3" />}
                <p className="text-slate-400 text-sm font-medium">
                  {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada aduan"}
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  {search ? "Coba kata kunci lain" : "Buat aduan baru menggunakan form di samping"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((fb, i) => (
                  <FeedbackCard
                    key={fb.id} fb={fb} delay={i * 60}
                    currentUserId={user?.id ?? null}
                    onEdit={setEditTarget}
                    onDelete={setDeleteConfirm}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© 2025 SiAduan Kampus</p>
          <p className="text-xs text-slate-400">Aduan bersifat rahasia dan diproses dalam 3–5 hari kerja</p>
        </div>
      </footer>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          fb={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,27,45,0.6)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-up">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: "#fee2e2" }}>
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="serif text-lg text-slate-800 text-center mb-2">Hapus Aduan?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Aduan akan dihapus permanen dan tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: "#ef4444" }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
