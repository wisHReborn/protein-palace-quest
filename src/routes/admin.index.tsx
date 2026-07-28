import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGameData, usePlays, isAdminLoggedIn, setAdminLoggedIn, resetAll } from "@/lib/game-store";
import type { GameData, ZoneKey } from "@/lib/game-data";
import { ZONES } from "@/lib/game-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "แดชบอร์ดผู้ดูแล — Protein World" },
      { name: "description", content: "จัดการคำถาม พารามิเตอร์เกม และดูสถิติผู้เล่น" },
      { property: "og:title", content: "Admin Dashboard" },
      { property: "og:description", content: "Protein World CMS" },
    ],
  }),
  component: AdminDashboard,
});

type Tab = "overview" | "questions" | "settings" | "users";

function AdminDashboard() {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!isAdminLoggedIn()) nav({ to: "/admin/login" });
    else setOk(true);
  }, [nav]);

  if (!ok) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-pink/40 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-berry">🌸 Protein World · Admin</div>
          <div className="flex gap-2">
            <Link to="/" className="btn-soft text-sm">🏠 หน้าเว็บ</Link>
            <button onClick={() => { setAdminLoggedIn(false); nav({ to: "/" }); }} className="btn-soft text-sm">ออกจากระบบ</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6 pb-3 text-sm">
          {([
            ["overview", "📊 ภาพรวม"],
            ["questions", "📝 คำถาม"],
            ["settings", "⚙️ ตั้งค่า"],
            ["users", "👥 ผู้เล่น"],
          ] as [Tab, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 font-semibold ${tab === k ? "bg-gradient-to-r from-primary to-berry text-white" : "text-berry hover:bg-pink/20"}`}
            >
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {tab === "overview" && <Overview />}
        {tab === "questions" && <Questions />}
        {tab === "settings" && <SettingsTab />}
        {tab === "users" && <Users />}
      </main>
    </div>
  );
}

function Overview() {
  const [plays] = usePlays();
  const [data] = useGameData();
  const byZone = ZONES.map((z) => {
    const list = plays.filter((p) => p.zone === z.key);
    const avg = list.length ? Math.round(list.reduce((a, b) => a + b.score, 0) / list.length) : 0;
    return { ...z, count: list.length, avg, total: data[z.key].reduce((a, b) => a + b.points, 0) };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="รอบเล่นทั้งหมด" value={plays.length} emoji="🎮" />
        <Stat label="ผู้เล่น (unique)" value={new Set(plays.map((p) => p.player)).size} emoji="👥" />
        <Stat label="คะแนนเฉลี่ยรวม" value={plays.length ? Math.round(plays.reduce((a, b) => a + b.score, 0) / plays.length) : 0} emoji="💎" />
        <Stat label="ดาวรวมที่แจก" value={plays.reduce((a, b) => a + b.stars, 0)} emoji="⭐" />
      </div>
      <div className="card-soft p-6">
        <h2 className="mb-4 font-bold text-berry">ผลการเล่นแต่ละด่าน</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="py-2">ด่าน</th><th>จำนวนรอบ</th><th>คะแนนเฉลี่ย</th><th>คะแนนเต็ม</th></tr>
          </thead>
          <tbody>
            {byZone.map((z) => (
              <tr key={z.key} className="border-t border-border">
                <td className="py-2 font-semibold">{z.emoji} {z.name}</td>
                <td>{z.count}</td>
                <td>{z.avg}</td>
                <td>{z.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="card-soft p-5">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-2xl font-extrabold text-berry">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Questions() {
  const [data, save] = useGameData();
  const [zone, setZone] = useState<ZoneKey>("structural");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ZONES.map((z) => (
          <button
            key={z.key}
            onClick={() => setZone(z.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${zone === z.key ? "bg-gradient-to-r from-primary to-berry text-white" : "bg-white text-berry border border-pink"}`}
          >
            {z.emoji} {z.name}
          </button>
        ))}
      </div>
      {zone === "structural" && <StructuralEditor data={data} save={save} />}
      {zone === "folding" && <FoldingEditor data={data} save={save} />}
      {zone === "enzyme" && <EnzymeEditor data={data} save={save} />}
      {zone === "immune" && <ImmuneEditor data={data} save={save} />}
    </div>
  );
}

function EditorShell({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="card-soft p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-berry">{title}</h2>
        <button onClick={onAdd} className="btn-primary text-sm">+ เพิ่มโจทย์</button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-pink/50 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">{children}</div>
        <button onClick={onDelete} className="self-start rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">ลบ</button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

function StructuralEditor({ data, save }: { data: GameData; save: (d: GameData) => void }) {
  const upd = (i: number, patch: Partial<GameData["structural"][number]>) => {
    const list = [...data.structural];
    list[i] = { ...list[i], ...patch };
    save({ ...data, structural: list });
  };
  const add = () => save({ ...data, structural: [...data.structural, { id: crypto.randomUUID(), prompt: "โจทย์ใหม่", sequence: ["Gly", "Ala"], difficulty: "easy", points: 10, explanation: "" }] });
  const del = (i: number) => save({ ...data, structural: data.structural.filter((_, x) => x !== i) });

  return (
    <EditorShell title="🧬 Structural Lab — โจทย์ลำดับกรดอะมิโน" onAdd={add}>
      {data.structural.map((q, i) => (
        <Row key={q.id} onDelete={() => del(i)}>
          <input className={inp} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} placeholder="โจทย์" />
          <input className={inp} value={q.sequence.join(",")} onChange={(e) => upd(i, { sequence: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="ลำดับกรดอะมิโน (คั่นด้วย ,)" />
          <input className={inp} value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} placeholder="คำอธิบาย" />
          <div className="flex gap-2">
            <select className={inp} value={q.difficulty} onChange={(e) => upd(i, { difficulty: e.target.value as "easy" | "medium" | "hard" })}>
              <option value="easy">ง่าย</option><option value="medium">ปานกลาง</option><option value="hard">ยาก</option>
            </select>
            <input type="number" className={inp} value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) })} />
          </div>
        </Row>
      ))}
    </EditorShell>
  );
}

function FoldingEditor({ data, save }: { data: GameData; save: (d: GameData) => void }) {
  const upd = (i: number, p: Partial<GameData["folding"][number]>) => { const l = [...data.folding]; l[i] = { ...l[i], ...p }; save({ ...data, folding: l }); };
  const add = () => save({ ...data, folding: [...data.folding, { id: crypto.randomUUID(), prompt: "โจทย์ใหม่", answer: "alpha", temperature: 37, ph: 7, difficulty: "easy", points: 10, explanation: "" }] });
  const del = (i: number) => save({ ...data, folding: data.folding.filter((_, x) => x !== i) });

  return (
    <EditorShell title="🎀 Protein Folding" onAdd={add}>
      {data.folding.map((q, i) => (
        <Row key={q.id} onDelete={() => del(i)}>
          <input className={inp} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} />
          <div className="grid gap-2 md:grid-cols-4">
            <select className={inp} value={q.answer} onChange={(e) => upd(i, { answer: e.target.value as "alpha" | "beta" | "denature" })}>
              <option value="alpha">Alpha-helix</option><option value="beta">Beta-sheet</option><option value="denature">Denaturation</option>
            </select>
            <input type="number" className={inp} value={q.temperature} onChange={(e) => upd(i, { temperature: Number(e.target.value) })} placeholder="°C" />
            <input type="number" className={inp} value={q.ph} onChange={(e) => upd(i, { ph: Number(e.target.value) })} placeholder="pH" />
            <input type="number" className={inp} value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) })} placeholder="คะแนน" />
          </div>
          <input className={inp} value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} placeholder="คำอธิบาย" />
        </Row>
      ))}
    </EditorShell>
  );
}

function EnzymeEditor({ data, save }: { data: GameData; save: (d: GameData) => void }) {
  const upd = (i: number, p: Partial<GameData["enzyme"][number]>) => { const l = [...data.enzyme]; l[i] = { ...l[i], ...p }; save({ ...data, enzyme: l }); };
  const add = () => save({ ...data, enzyme: [...data.enzyme, { id: crypto.randomUUID(), substrate: "สารตั้งต้นใหม่", correctEnzyme: "Amylase", enzymes: ["Amylase", "Lipase", "Protease"], difficulty: "easy", points: 10, explanation: "" }] });
  const del = (i: number) => save({ ...data, enzyme: data.enzyme.filter((_, x) => x !== i) });

  return (
    <EditorShell title="🧪 Enzyme Station" onAdd={add}>
      {data.enzyme.map((q, i) => (
        <Row key={q.id} onDelete={() => del(i)}>
          <input className={inp} value={q.substrate} onChange={(e) => upd(i, { substrate: e.target.value })} placeholder="Substrate" />
          <input className={inp} value={q.correctEnzyme} onChange={(e) => upd(i, { correctEnzyme: e.target.value })} placeholder="เอนไซม์ที่ถูก" />
          <input className={inp} value={q.enzymes.join(",")} onChange={(e) => upd(i, { enzymes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="ตัวเลือกเอนไซม์ (คั่น ,)" />
          <input className={inp} value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} placeholder="คำอธิบาย" />
          <input type="number" className={inp} value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) })} placeholder="คะแนน" />
        </Row>
      ))}
    </EditorShell>
  );
}

function ImmuneEditor({ data, save }: { data: GameData; save: (d: GameData) => void }) {
  const upd = (i: number, p: Partial<GameData["immune"][number]>) => { const l = [...data.immune]; l[i] = { ...l[i], ...p }; save({ ...data, immune: l }); };
  const add = () => save({ ...data, immune: [...data.immune, { id: crypto.randomUUID(), patient: "ผู้ป่วยใหม่", symptoms: "อาการ...", options: ["A", "B", "C"], answer: "A", difficulty: "easy", points: 10, explanation: "" }] });
  const del = (i: number) => save({ ...data, immune: data.immune.filter((_, x) => x !== i) });

  return (
    <EditorShell title="💗 Immune Clinic" onAdd={add}>
      {data.immune.map((q, i) => (
        <Row key={q.id} onDelete={() => del(i)}>
          <input className={inp} value={q.patient} onChange={(e) => upd(i, { patient: e.target.value })} placeholder="ชื่อผู้ป่วย" />
          <textarea className={inp} value={q.symptoms} onChange={(e) => upd(i, { symptoms: e.target.value })} placeholder="อาการ" />
          <input className={inp} value={q.options.join(",")} onChange={(e) => upd(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="ตัวเลือก (คั่น ,)" />
          <input className={inp} value={q.answer} onChange={(e) => upd(i, { answer: e.target.value })} placeholder="คำตอบที่ถูก" />
          <input className={inp} value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} placeholder="คำอธิบาย" />
          <input type="number" className={inp} value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) })} placeholder="คะแนน" />
        </Row>
      ))}
    </EditorShell>
  );
}

function SettingsTab() {
  const [data, save] = useGameData();
  const upd = (zone: ZoneKey, patch: Partial<GameData["settings"]["structural"]>) => {
    save({ ...data, settings: { ...data.settings, [zone]: { ...data.settings[zone], ...patch } } });
  };

  return (
    <div className="space-y-4">
      <div className="card-soft p-6">
        <h2 className="mb-4 font-bold text-berry">⚙️ ตั้งค่าเวลา & เกณฑ์ผ่าน</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ZONES.map((z) => (
            <div key={z.key} className="rounded-2xl border border-pink/50 bg-white p-4">
              <div className="font-semibold text-berry">{z.emoji} {z.name}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <label>
                  <div className="text-xs text-muted-foreground">เวลา (วินาที)</div>
                  <input type="number" className={inp} value={data.settings[z.key].timeSec} onChange={(e) => upd(z.key, { timeSec: Number(e.target.value) })} />
                </label>
                <label>
                  <div className="text-xs text-muted-foreground">คะแนนผ่าน</div>
                  <input type="number" className={inp} value={data.settings[z.key].passing} onChange={(e) => upd(z.key, { passing: Number(e.target.value) })} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-soft p-6">
        <h2 className="mb-4 font-bold text-berry">🔑 รหัสผ่านผู้ดูแล</h2>
        <input className={inp} value={data.settings.adminPassword} onChange={(e) => save({ ...data, settings: { ...data.settings, adminPassword: e.target.value } })} />
      </div>
      <div className="card-soft p-6">
        <h2 className="mb-2 font-bold text-berry">♻️ รีเซ็ตข้อมูลทั้งหมด</h2>
        <p className="mb-4 text-sm text-muted-foreground">ล้างคำถาม คะแนน และประวัติผู้เล่นทั้งหมด กลับสู่ค่าเริ่มต้น</p>
        <button onClick={() => { if (confirm("รีเซ็ตข้อมูลทั้งหมดใช่หรือไม่?")) resetAll(); }} className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200">รีเซ็ต</button>
      </div>
    </div>
  );
}

function Users() {
  const [plays, save] = usePlays();
  return (
    <div className="card-soft p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-berry">👥 ประวัติการเล่น</h2>
        <button onClick={() => save([])} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200">ล้างประวัติ</button>
      </div>
      {plays.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีการเล่น</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="py-2">เวลา</th><th>ผู้เล่น</th><th>ด่าน</th><th>คะแนน</th><th>ดาว</th></tr>
          </thead>
          <tbody>
            {plays.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2">{new Date(p.at).toLocaleString("th-TH")}</td>
                <td>{p.player}</td>
                <td>{p.zone}</td>
                <td>{p.score} / {p.total}</td>
                <td>{"⭐".repeat(p.stars)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}