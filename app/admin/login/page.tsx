"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Eye, EyeOff, Lock, User, AlertCircle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login gagal");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0f1b2d" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 50%, #0d9488, transparent), radial-gradient(ellipse 50% 40% at 70% 30%, #f59e0b, transparent)",
        }}
      />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded overflow-hidden shadow-2xl animate-fade-up"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div
              className="w-14 h-14 rounded flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldAlert size={28} className="text-white" />
            </div>
            <h1 className="serif text-2xl text-white mb-1">Admin Panel</h1>
            <p className="text-slate-400 text-xs">
              SVC — Akses Terbatas
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded text-xs animate-fade-up"
                  style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
                >
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
                  Username
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#475569" }} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => { setForm((f) => ({ ...f, username: e.target.value })); setError(""); }}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-2.5 rounded text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#475569" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#475569" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#475569")}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ backgroundColor: "#0d9488", color: "white" }}
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
                {loading ? "Memverifikasi..." : "Masuk ke Admin Panel"}
              </button>
            </form>

            <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <a
                href="/"
                className="flex items-center justify-center text-xs transition-colors"
                style={{ color: "#475569" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#475569")}
              >
                ← Kembali ke Portal Mahasiswa
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#f7f7f0" }}>
          Akses hanya untuk staf & administrator kampus
        </p>
      </div>
    </div>
  );
}
