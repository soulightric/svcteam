"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare, CheckCircle2, Clock3, XCircle,
  TrendingUp, ArrowRight, ShieldAlert, LogIn, Users,
} from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

interface Stats {
  total: number;
  menunggu: number;
  diterima: number;
  ditolak: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, menunggu: 0, diterima: 0, ditolak: 0 });
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState({ total: 0, menunggu: 0, diterima: 0, ditolak: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Animasi counter
  useEffect(() => {
    if (loading) return;
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        total:    Math.round(stats.total    * ease),
        menunggu: Math.round(stats.menunggu * ease),
        diterima: Math.round(stats.diterima * ease),
        ditolak:  Math.round(stats.ditolak  * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [loading, stats]);

  const statCards = [
    { label: "Total Aduan",  value: count.total,    color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", icon: TrendingUp },
    { label: "Menunggu",     value: count.menunggu, color: "#b45309", bg: "#fef3c7", border: "#fcd34d", icon: Clock3 },
    { label: "Diterima",     value: count.diterima, color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle2 },
    { label: "Ditolak",      value: count.ditolak,  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", icon: XCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f7f4" }}>
      {/* ── Header ── */}
      <header className="relative overflow-hidden noise-bg border-b-2 border-solid border-emerald-900" style={{ backgroundColor: "#0f1b2d" }}>
        <div className="absolute inset-0 opacity-15 " style={{
          background: "radial-gradient(ellipse 70% 60% at 15% 50%, #f59e0b, transparent), radial-gradient(ellipse 50% 40% at 85% 20%, #0d9488, transparent)",
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: "transparent" }}>
                <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            <div>
              <p className="text-[10px] font-medium text-teal-400 uppercase tracking-widest">Portal Resmi</p>
              <h1 className="text-white font-bold text-base leading-none serif">SVC</h1>
            </div>
          </div>
          <a href="/admin/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ShieldAlert size={12} />Admin
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative overflow-hidden noise-bg pb-16 pt-16" style={{ backgroundColor: "#0f1b2d" }}>
          <div className="absolute inset-0 opacity-15" style={{
            background: "radial-gradient(ellipse 80% 60% at 20% 60%, #0d9488, transparent), radial-gradient(ellipse 60% 50% at 80% 20%, #f59e0b, transparent)",
          }} />
          {/* Grid decoration */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

          <div className="relative max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6 text-xs font-medium"
              style={{ backgroundColor: "rgba(13,148,136,0.2)", color: "#5eead4", border: "1px solid rgba(13,148,136,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded bg-teal-400 status-dot-pending" />
              Sistem Aktif — Aduan Diproses 3–5 Hari Kerja
            </div>

            <h2 className="serif text-4xl md:text-5xl font-normal text-white leading-tight mb-4">
              Suara Mahasiswa,<br />
              <span style={{ color: "#fcd34d" }}>Kampus Lebih Baik</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10">
              Platform pengaduan dan feedback fasilitas kampus. Setiap masukan Anda akan ditindaklanjuti oleh tim yang berwenang.
            </p>

            <a href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ backgroundColor: "#0d9488", color: "white", boxShadow: "0 8px 32px rgba(13,148,136,0.4)" }}>
              <LogIn size={17} />
              Login & Kirim Aduan
              <ArrowRight size={15} />
            </a>

            <p className="text-xs text-slate-500 mt-3">
              Khusus mahasiswa terdaftar — gunakan NIM dan password Anda
            </p>
          </div>
        </section>

        {/* ── Stats Section ── */}
        <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, color, bg, border, icon: Icon }) => (
              <div key={label}
                className="rounded p-5 text-center shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                <div className="w-9 h-9 rounded flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: color + "20" }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-3xl font-bold serif mb-1" style={{ color }}>
                  {loading ? "—" : value}
                </p>
                <p className="text-xs font-medium" style={{ color: color + "99" }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="text-center mb-8">
            <h3 className="serif text-2xl text-slate-800 mb-2">Cara Kerja</h3>
            <p className="text-sm text-slate-400">Tiga langkah mudah untuk menyampaikan aduan</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Login",       desc: "Masuk menggunakan NIM dan password yang telah didaftarkan oleh admin kampus.",         color: "#3b82f6" },
              { step: "02", title: "Kirim Aduan", desc: "Pilih kategori fasilitas, jelaskan masalah secara detail agar mudah ditindaklanjuti.", color: "#0d9488" },
              { step: "03", title: "Pantau Status",desc: "Lihat status aduan Anda: menunggu, diterima, atau ditolak beserta balasan resmi.",    color: "#f59e0b" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="bg-white rounded p-6 border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded flex items-center justify-center mb-4 serif text-lg font-bold"
                  style={{ backgroundColor: color + "15", color }}>
                  {step}
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <div className="rounded p-8 text-center relative overflow-hidden noise-bg"
            style={{ backgroundColor: "#0f1b2d" }}>
            <div className="absolute inset-0 opacity-20" style={{
              background: "radial-gradient(ellipse 60% 60% at 50% 50%, #0d9488, transparent)",
            }} />
            <div className="relative">
              <Users size={32} className="text-teal-400 mx-auto mb-4" />
              <h3 className="serif text-2xl text-white mb-2">Siap Menyampaikan Aduan?</h3>
              <p className="text-slate-400 text-sm mb-6">Login sekarang dan bantu kami tingkatkan kualitas fasilitas kampus</p>
              <a href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#0d9488", color: "white" }}>
                <LogIn size={15} />Masuk Sekarang
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© 2026 SVC - Student Voice Campus backup by <Link className="text-emerald-500" href="https://www.etherthink.xyz/" target="_blank" rel="noopener noreferrer">Etherthink</ Link></p>
          <p className="text-xs text-slate-400">Aduan bersifat rahasia dan diproses dalam 3–5 hari kerja</p>
        </div>
      </footer>
    </div>
  );
}
