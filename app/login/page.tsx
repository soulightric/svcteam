"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Eye, EyeOff, Hash, Lock, AlertCircle, RefreshCw, LogIn } from "lucide-react";
import Image from "next/image";

export default function LoginMahasiswaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nim: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nim || !form.password) { setError("NIM dan password wajib diisi"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/mahasiswa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login gagal");
        return;
      }
      router.push("/feedback");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0f1b2d" }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-15" style={{
        background: "radial-gradient(ellipse 60% 50% at 30% 50%, #0d9488, transparent), radial-gradient(ellipse 50% 40% at 70% 30%, #f59e0b, transparent)",
      }} />
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded overflow-hidden flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "transparent" }}>
            <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
              }} />
          </div>
          <h1 className="serif text-2xl text-white mb-1">Portal Mahasiswa</h1>
          <p className="text-slate-400 text-xs">SVC — Student Voice Campus</p>
        </div>

        {/* Card */}
        <div className="rounded overflow-hidden shadow-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded text-xs"
                  style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  <AlertCircle size={13} className="shrink-0" />{error}
                </div>
              )}

              {/* NIM */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
                  NIM
                </label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#475569" }} />
                  <input type="text" value={form.nim}
                    onChange={(e) => { setForm((f) => ({ ...f, nim: e.target.value })); setError(""); }}
                    placeholder="Masukkan NIM Anda"
                    className="w-full pl-9 pr-4 py-2.5 rounded text-sm outline-none transition-all"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#475569" }} />
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-10 py-2.5 rounded text-sm outline-none transition-all"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ backgroundColor: "#0d9488", color: "white" }}>
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <LogIn size={15} />}
                {loading ? "Memverifikasi..." : "Masuk"}
              </button>
            </form>
          </div>

          <div className="px-7 pb-5 pt-0">
            <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <a href="/" className="flex items-center justify-center text-xs transition-colors" style={{ color: "#475569" }}
                onMouseEnter={(e) => ((e.currentTarget).style.color = "#94a3b8")}
                onMouseLeave={(e) => ((e.currentTarget).style.color = "#475569")}>
                ← Kembali ke Beranda
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center mt-4">
          <MessageSquare size={12} style={{ color: "#f7f7f0" }} />
          <p className="text-xs" style={{ color: "#f7f7f0" }}>
            Belum terdaftar? Hubungi admin kampus
          </p>
        </div>
      </div>
    </div>
  );
}
