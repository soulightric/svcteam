"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare, CheckCircle2, Clock3, XCircle,
  TrendingUp, ArrowRight, ShieldAlert, LogIn, Users, CheckCheck,
  Menu, X
} from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

interface Stats {
  total: number;
  menunggu: number;
  diterima: number;
  ditolak: number;
  selesai: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ total: 0, menunggu: 0, diterima: 0, ditolak: 0, selesai: 0 });
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState({ total: 0, menunggu: 0, diterima: 0, ditolak: 0, selesai: 0 });

  // Slider state
  const heroImages = [
  "https://ith.ac.id/public/carouselImg/2024-11-22T00-57-29-151Z.jpeg", 
  "https://ith.ac.id/public/carouselImg/2024-11-22T00-56-59-919Z.jpeg",     
  "https://ith.ac.id/public/carouselImg/2024-11-22T01-02-08-093Z.jpeg",    
  "https://ith.ac.id/public/carouselImg/2024-11-22T01-00-23-481Z.jpeg",  
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Daftar link navigasi
  const navLinks = [
    { label: "Web Utama", href: "https://ith.ac.id"},
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animasi counter
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { 
        setStats(data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  // Animasi counter angka
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
        selesai:  Math.round(stats.selesai  * ease),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [loading, stats]);

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
        selesai:  Math.round(stats.selesai  * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [loading, stats]);

  const statCards = [
    { label: "Total Aduan",  value: count.total,    color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", icon: TrendingUp },
    { label: "Menunggu",     value: count.menunggu, color: "#b45309", bg: "#fef3c7", border: "#fcd34d", icon: Clock3 },
    { label: "Diterima",     value: count.diterima, color: "#04355e", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle2 },
    { label: "Ditolak",      value: count.ditolak,  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", icon: XCircle },
    { label: "Selesai",      value: count.selesai,  color: "#166534", bg: "#dcfce7", border: "#86efac", icon: CheckCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f7f4" }}>
      {/* ── Header (transparent blur / glassmorphism) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10" style={{ backgroundColor: "rgba(15,27,45,0.45)" }}>
        <div className="relative max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

          {/* Navigasi Desktop (kanan) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-200 hover:text-teal-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: "#0d9488", color: "white" }}
            >
              <LogIn size={15} />Masuk
            </Link>
          </nav>

          {/* Tombol Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu Mobile (dropdown) */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 backdrop-blur-md" style={{ backgroundColor: "rgba(15,27,45,0.85)" }}>
            <nav className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 text-sm font-medium text-slate-200 hover:text-teal-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#0d9488", color: "white" }}
              >
                <LogIn size={15} />Masuk Sekarang
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative overflow-hidden noise-bg pb-16 pt-32" style={{ backgroundColor: "#0f1b2d" }}>
          {/* Background Image Slider */}
          <div className="absolute inset-0 z-0">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: currentSlide === index ? 0.35 : 0,
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
            {/* Overlay gelap */}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Konten Teks */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6 text-xs font-medium"
              style={{ backgroundColor: "rgba(13,148,136,0.2)", color: "#5eead4", border: "1px solid rgba(13,148,136,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded bg-teal-400 status-dot-pending" />
              Sistem Aktif — Aduan Diproses 3–5 Hari Kerja
            </div>

            <h2 className="serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Suara Mahasiswa,<br />
              <span style={{ color: "#fcd34d" }}>Kampus Lebih Baik</span>
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10">
              Platform pengaduan dan feedback fasilitas kampus. Setiap masukan Anda akan ditindaklanjuti oleh tim yang berwenang.
            </p>
            <p className="text-xs text-emerald-500 mt-3">
              Khusus mahasiswa terdaftar — gunakan NIM dan password Anda
            </p>
          </div>
        </section>

        {/* ── Stats Section ── */}
        <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <Link href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#0d9488", color: "white" }}>
                <LogIn size={15} />Masuk Sekarang
              </Link>
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
