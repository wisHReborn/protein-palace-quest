import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGameData, setAdminLoggedIn } from "@/lib/game-store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบผู้ดูแล — Protein World" },
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
      nav({ to: "/admin" });
    } else setErr("รหัสผ่านไม่ถูกต้อง");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="card-soft w-full max-w-md p-8">
        <div className="text-center">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-3 text-2xl font-bold text-berry">ระบบผู้ดูแล</h1>
          <p className="mt-1 text-sm text-muted-foreground">สำหรับคุณครู / แอดมิน</p>
        </div>
        <label className="mt-6 block text-sm font-semibold text-berry">รหัสผ่าน</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-2 w-full rounded-full border border-pink bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          placeholder="ใส่รหัสผ่านผู้ดูแล"
        />
        <p className="mt-2 text-xs text-muted-foreground">ค่าเริ่มต้น: <code className="rounded bg-white px-2 py-0.5">protein123</code></p>
        {err && <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</div>}
        <button className="btn-primary mt-6 w-full justify-center">เข้าสู่ระบบ</button>
        <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground hover:text-berry">← กลับหน้าแรก</Link>
      </form>
    </div>
  );
}