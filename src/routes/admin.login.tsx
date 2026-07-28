import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGameData, setAdminLoggedIn, cacheAdminPassword } from "@/lib/game-store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบผู้ดูแล — Protein World MMORPG" },
      { name: "description", content: "เข้าสู่ระบบผู้ดูแลจัดการเนื้อหาเกม" },
      { property: "og:title", content: "Admin Login" },
      { property: "og:description", content: "Protein World admin panel" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [data] = useGameData();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === data.settings.adminPassword) {
      setAdminLoggedIn(true);
      cacheAdminPassword(pw);
      nav({ to: "/admin" });
    } else setErr("รหัสผ่านไม่ถูกต้อง");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-10 left-1/4 h-80 w-80 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 h-80 w-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <form onSubmit={submit} className="rounded-3xl bg-slate-900/90 border-2 border-pink-500/40 w-full max-w-md p-8 shadow-2xl backdrop-blur relative">
        <div className="text-center">
          <div className="text-5xl filter drop-shadow">🔐</div>
          <h1 className="mt-3 text-2xl font-black bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">
            ระบบผู้ดูแลมหานคร
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">สำหรับคุณครู / ผู้ดูแลระบบ (Admin CMS)</p>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-black uppercase tracking-wider text-pink-300">รหัสผ่านประตูผู้ดูแล</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-pink-500/30 bg-slate-950 px-4 py-3 outline-none focus:border-pink-400 text-white font-bold placeholder-slate-500 shadow-inner"
            placeholder="ใส่รหัสผ่านผู้ดูแล"
            required
          />
        </div>

        {/* <p className="mt-2 text-xs text-slate-400">
          ค่าเริ่มต้น: <code className="rounded bg-slate-950 px-2 py-0.5 text-pink-300 border border-white/10 font-mono">protein123</code>
        </p> */}

        {err && <div className="mt-3 rounded-xl bg-rose-950/80 border border-rose-500/40 p-3 text-xs font-bold text-rose-300">{err}</div>}

        <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-sm font-black text-white shadow-xl hover:scale-105 transition">
          เข้าสู่ระบบ CMS
        </button>

        <Link to="/" className="mt-4 block text-center text-xs font-bold text-slate-400 hover:text-pink-300 transition">
          ← กลับหน้าแรก
        </Link>
      </form>
    </div>
  );
}