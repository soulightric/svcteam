"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle2, XCircle, X, Inbox } from "lucide-react";

interface Notification {
  id: string;
  judul: string;
  status: "diterima" | "ditolak";
  balasan?: string | null;
  updatedAt: string;
  kategori: string;
}

const STORAGE_KEY = "siaduan_read_notif";

function getReadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function markRead(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function formatWaktu(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  return `${d} hari lalu`;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      setNotifs(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    setReadIds(getReadIds());
    fetchNotifs();
    // Poll setiap 30 detik
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifs.filter((n) => !readIds.includes(n.id)).length;

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
    if (!open) {
      // Tandai semua sebagai terbaca saat buka
      const allIds = notifs.map((n) => n.id);
      setReadIds(allIds);
      markRead(allIds);
    }
  };

  const handleClearOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = readIds.includes(id) ? readIds : [...readIds, id];
    setReadIds(updated);
    markRead(updated);
    // Hapus dari list tampilan
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative p-2 rounded transition-all hover:scale-105"
        style={{
          backgroundColor: open ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        title="Notifikasi"
      >
        <Bell size={16} className="text-slate-300" />
        {/* Red dot */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded flex items-center justify-center text-[9px] font-bold text-white animate-fade-up"
            style={{ backgroundColor: "#ef4444", lineHeight: 1 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="fixed w-60 rounded shadow-2xl overflow-hidden z-9999 animate-fade-up"
          style={{
            top: dropdownPos.top,
            right: dropdownPos.right,
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 60px rgba(15,27,45,0.15)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#0f1b2d" }}>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-teal-400" />
              <span className="text-sm font-semibold text-white serif">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: "#ef4444", color: "white" }}>
                  {unreadCount} baru
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Inbox size={32} className="text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Belum ada notifikasi</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Aduan yang sudah direspons akan muncul di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifs.map((n) => {
                  const isRead = readIds.includes(n.id);
                  const isDiterima = n.status === "diterima";
                  return (
                    <div key={n.id}
                      className="px-4 py-3 flex items-start gap-3 group transition-colors hover:bg-slate-50 relative"
                      style={{ backgroundColor: isRead ? "white" : isDiterima ? "#f0fdf4" : "#fff5f5" }}>
                      {/* Icon status */}
                      <div className="shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: isDiterima ? "#d1fae5" : "#fee2e2" }}>
                        {isDiterima
                          ? <CheckCircle2 size={16} className="text-emerald-600" />
                          : <XCircle size={16} className="text-red-500" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: isDiterima ? "#065f46" : "#991b1b" }}>
                            {isDiterima ? "✓ Aduan Diterima" : "✗ Aduan Ditolak"}
                          </span>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded shrink-0"
                              style={{ backgroundColor: "#ef4444" }} />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">{n.judul}</p>
                        {n.balasan && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.balasan}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{formatWaktu(n.updatedAt)}</p>
                      </div>

                      {/* Close button */}
                      <button
                        onClick={(e) => handleClearOne(n.id, e)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-slate-500 hover:bg-slate-100">
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100"
              style={{ backgroundColor: "#f8f7f4" }}>
              <button
                onClick={() => {
                  setNotifs([]);
                  const allIds = notifs.map((n) => n.id);
                  setReadIds(allIds);
                  markRead(allIds);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors w-full text-center">
                Hapus semua notifikasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
