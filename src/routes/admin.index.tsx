import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGameData, usePlays, isAdminLoggedIn, setAdminLoggedIn, resetAll, exportGameDataJSON } from "@/lib/game-store";
import type { GameData, ZoneKey, KahootQ } from "@/lib/game-data";
import { ZONES } from "@/lib/game-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "ระบบจัดการผู้ดูแล — Protein World Kahoot CMS" },
      { name: "description", content: "จัดการโจทย์ Kahoot ทั้ง 4 ด่าน พารามิเตอร์ระบบ พรีวิวคำตอบ และสถิติ" },
      { property: "og:title", content: "Protein World Admin Dashboard" },
      { property: "og:description", content: "ระบบบริหารจัดการโจทย์ชีววิทยา Protein World MMORPG" },
    ],
  }),
  component: AdminDashboard,
});

type Tab = "overview" | "questions" | "settings" | "users" | "guide";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white">
      <header className="border-b border-pink-500/20 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌸</span>
            <div>
              <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300 text-lg">
                Protein World Kahoot CMS
              </div>
              <div className="text-[11px] text-slate-400">Admin Management & Curriculum CMS</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/" className="rounded-xl bg-slate-800 text-slate-200 px-3.5 py-1.5 text-xs font-bold border border-white/10 hover:bg-slate-700">🏠 หน้าผู้เล่น</Link>
            <Link to="/map" className="rounded-xl bg-pink-500/20 text-pink-300 px-3.5 py-1.5 text-xs font-bold border border-pink-500/40 hover:bg-pink-500/30">🗺️ แผนที่ RPG</Link>
            <button
              onClick={() => {
                setAdminLoggedIn(false);
                nav({ to: "/" });
              }}
              className="rounded-xl bg-rose-950/80 text-rose-300 px-3.5 py-1.5 text-xs font-bold border border-rose-500/30 hover:bg-rose-900 cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 px-6 pb-3 text-sm overflow-x-auto">
          {([
            ["overview", "📊 ภาพรวมสถิติ"],
            ["questions", "📝 จัดการโจทย์ Kahoot ทั้ง 4 ด่าน"],
            ["settings", "⚙️ ตั้งค่าระบบ & เวลา"],
            ["users", "👥 ประวัติผู้เล่น"],
            ["guide", "💡 คำแนะนำผู้ดูแล"],
          ] as [Tab, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                tab === k
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-white/10"
              }`}
            >
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {tab === "overview" && <Overview />}
        {tab === "questions" && <QuestionsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "guide" && <GuideTab />}
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
    const questionsCount = data[z.key]?.length || 0;
    const totalPoints = data[z.key]?.reduce((a, b) => a + b.points, 0) || 0;
    return { ...z, count: list.length, avg, questionsCount, totalPoints };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="รอบการเล่นทั้งหมด" value={plays.length} emoji="🎮" />
        <Stat label="จำนวนผู้เล่น (Unique Players)" value={new Set(plays.map((p) => p.player)).size} emoji="👥" />
        <Stat label="คะแนนเฉลี่ยรวมทุกด่าน" value={plays.length ? Math.round(plays.reduce((a, b) => a + b.score, 0) / plays.length) : 0} emoji="💎" />
        <Stat label="จำนวนดาวรวมที่แจก" value={plays.reduce((a, b) => a + b.stars, 0)} emoji="⭐" />
      </div>

      <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl">
        <h2 className="mb-4 text-lg font-black text-pink-300">📊 ผลการเล่นและสถิติแยกตามด่าน Kahoot</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-2">ด่านการเรียนรู้</th>
                <th className="px-2">จำนวนโจทย์ Kahoot</th>
                <th className="px-2">คะแนนเต็มรวม</th>
                <th className="px-2">จำนวนครั้งที่เล่น</th>
                <th className="px-2">คะแนนเฉลี่ย</th>
              </tr>
            </thead>
            <tbody>
              {byZone.map((z) => (
                <tr key={z.key} className="border-t border-white/5 hover:bg-slate-800/50">
                  <td className="py-3 px-2 font-bold text-white flex items-center gap-2">
                    <span className="text-xl">{z.emoji}</span> {z.name}
                  </td>
                  <td className="px-2 font-semibold text-slate-300">{z.questionsCount} ข้อ</td>
                  <td className="px-2 font-semibold text-slate-300">{z.totalPoints} คะแนน</td>
                  <td className="px-2 font-semibold text-slate-300">{z.count} รอบ</td>
                  <td className="px-2 font-black text-emerald-400">{z.avg} คะแนน</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="rounded-3xl bg-slate-900/90 p-5 border-l-4 border-l-pink-500 border border-white/10 shadow-xl backdrop-blur">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      <div className="text-xs font-semibold text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function QuestionsTab() {
  const [data, save] = useGameData();
  const [zone, setZone] = useState<ZoneKey>("structural");
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-pink-500/30 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => setZone(z.key)}
              className={`rounded-full px-4 py-2 text-xs font-black transition cursor-pointer ${
                zone === z.key
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                  : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-white/10"
              }`}
            >
              {z.emoji} {z.name} ({data[z.key]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      <KahootZoneEditor zoneKey={zone} data={data} save={save} onPreview={setPreviewItem} />

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="rounded-3xl bg-slate-900 max-w-lg w-full p-6 relative border-2 border-pink-500 shadow-2xl">
            <button onClick={() => setPreviewItem(null)} className="absolute right-4 top-4 font-bold text-pink-300 cursor-pointer">
              ✕
            </button>

            <h3 className="font-black text-pink-300 text-lg mb-2">👁️ พรีวิวโจทย์ Kahoot ตัวอย่าง</h3>
            <pre className="text-xs bg-slate-950 text-emerald-400 p-4 rounded-xl overflow-x-auto border border-white/10">
              {JSON.stringify(previewItem, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-xl border border-pink-500/30 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30";

function KahootZoneEditor({
  zoneKey,
  data,
  save,
  onPreview,
}: {
  zoneKey: ZoneKey;
  data: GameData;
  save: (d: GameData) => void;
  onPreview: (item: any) => void;
}) {
  const currentZone = ZONES.find((z) => z.key === zoneKey);
  const questions: KahootQ[] = data[zoneKey] || [];

  // Modal State for Add Question
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQPrompt, setNewQPrompt] = useState("");
  const [newOptA, setNewOptA] = useState("");
  const [newOptB, setNewOptB] = useState("");
  const [newOptC, setNewOptC] = useState("");
  const [newOptD, setNewOptD] = useState("");
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newDifficulty, setNewDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [newPoints, setNewPoints] = useState(15);
  const [newExplanation, setNewExplanation] = useState("");

  // Modal State for Confirm Delete
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const updateQ = (index: number, patch: Partial<KahootQ>) => {
    const list = [...questions];
    list[index] = { ...list[index], ...patch };
    save({ ...data, [zoneKey]: list });
  };

  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    const list = [...questions];
    const opts = [...list[qIdx].options] as [string, string, string, string];
    opts[optIdx] = val;
    list[qIdx] = { ...list[qIdx], options: opts };
    save({ ...data, [zoneKey]: list });
  };

  const handleOpenAddModal = () => {
    setNewQPrompt("");
    setNewOptA("");
    setNewOptB("");
    setNewOptC("");
    setNewOptD("");
    setNewCorrectIdx(0);
    setNewDifficulty("easy");
    setNewPoints(15);
    setNewExplanation("");
    setShowAddModal(true);
  };

  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQPrompt.trim()) return;

    const newQ: KahootQ = {
      id: `${zoneKey[0]}_${Date.now()}`,
      prompt: newQPrompt.trim(),
      options: [
        newOptA.trim() || "ตัวเลือก A",
        newOptB.trim() || "ตัวเลือก B",
        newOptC.trim() || "ตัวเลือก C",
        newOptD.trim() || "ตัวเลือก D",
      ],
      correctIndex: newCorrectIdx,
      difficulty: newDifficulty,
      points: newPoints,
      explanation: newExplanation.trim() || "คำอธิบายเฉลยทางชีววิทยา...",
      extraVisual: currentZone?.emoji || "🧬",
    };

    save({ ...data, [zoneKey]: [...questions, newQ] });
    setShowAddModal(false);
  };

  const confirmDeleteQuestion = () => {
    if (deletingIndex === null) return;
    const list = questions.filter((_, idx) => idx !== deletingIndex);
    save({ ...data, [zoneKey]: list });
    setDeletingIndex(null);
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl space-y-6 relative">
      {/* Prominent Header Banner with Action Button */}
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between border-2 border-pink-500/50 bg-slate-950/95 p-4 rounded-2xl shadow-2xl backdrop-blur gap-3">
        <div>
          <div className="text-xs font-black text-pink-400 uppercase tracking-wider">
            {currentZone?.emoji} {currentZone?.name} (Kahoot CMS)
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">จัดการคำถาม & คำตอบทั้ง 4 ตัวเลือก ({questions.length} ข้อ)</h2>
        </div>

        {/* Prominent High-Visibility Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white px-6 py-3 text-sm font-black shadow-2xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/20 flex items-center gap-2"
        >
          <span className="text-lg">➕</span>
          <span>เพิ่มโจทย์ Kahoot ข้อใหม่</span>
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-2xl border-2 border-pink-500/30 bg-slate-950 p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="font-black text-sm text-pink-300 flex items-center gap-2">
                <span>ข้อที่ {qIdx + 1}</span>
                <span className="text-xs text-slate-500 font-mono">(ID: {q.id})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPreview(q)}
                  className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 cursor-pointer"
                >
                  👁️ พรีวิว
                </button>
                <button
                  onClick={() => setDeletingIndex(qIdx)}
                  className="rounded-full bg-rose-950/80 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-900 cursor-pointer"
                >
                  🗑️ ลบโจทย์ข้อนี้
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">คำถามประจำข้อ (Question Prompt):</label>
              <textarea
                className={inp}
                rows={2}
                value={q.prompt}
                onChange={(e) => updateQ(qIdx, { prompt: e.target.value })}
                placeholder="พิมพ์โจทย์คำถาม..."
              />
            </div>

            {/* 4 Choices Inputs */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">ตัวเลือก Kahoot ทั้ง 4 ตัวเลือก (4 Options):</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl bg-red-950/60 p-2 border border-red-500/40">
                  <span className="text-sm font-black text-red-400 w-6 text-center">🔴 A</span>
                  <input
                    className={inp}
                    value={q.options[0]}
                    onChange={(e) => updateOption(qIdx, 0, e.target.value)}
                    placeholder="ตัวเลือก A"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-cyan-950/60 p-2 border border-cyan-500/40">
                  <span className="text-sm font-black text-cyan-400 w-6 text-center">🔷 B</span>
                  <input
                    className={inp}
                    value={q.options[1]}
                    onChange={(e) => updateOption(qIdx, 1, e.target.value)}
                    placeholder="ตัวเลือก B"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-amber-950/60 p-2 border border-amber-500/40">
                  <span className="text-sm font-black text-amber-400 w-6 text-center">💛 C</span>
                  <input
                    className={inp}
                    value={q.options[2]}
                    onChange={(e) => updateOption(qIdx, 2, e.target.value)}
                    placeholder="ตัวเลือก C"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-950/60 p-2 border border-emerald-500/40">
                  <span className="text-sm font-black text-emerald-400 w-6 text-center">🟢 D</span>
                  <input
                    className={inp}
                    value={q.options[3]}
                    onChange={(e) => updateOption(qIdx, 3, e.target.value)}
                    placeholder="ตัวเลือก D"
                  />
                </div>
              </div>
            </div>

            {/* Correct Answer & Difficulty & Points */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">เฉลยข้อที่ถูกต้อง (Correct Choice):</label>
                <select
                  className={inp + " font-black text-emerald-400"}
                  value={q.correctIndex}
                  onChange={(e) => updateQ(qIdx, { correctIndex: Number(e.target.value) })}
                >
                  <option value={0}>🔴 ตัวเลือก A ({q.options[0]})</option>
                  <option value={1}>🔷 ตัวเลือก B ({q.options[1]})</option>
                  <option value={2}>💛 ตัวเลือก C ({q.options[2]})</option>
                  <option value={3}>🟢 ตัวเลือก D ({q.options[3]})</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">ระดับความยาก (Difficulty):</label>
                <select
                  className={inp}
                  value={q.difficulty}
                  onChange={(e) => updateQ(qIdx, { difficulty: e.target.value as any })}
                >
                  <option value="easy">ง่าย (Easy)</option>
                  <option value="medium">ปานกลาง (Medium)</option>
                  <option value="hard">ยาก (Hard)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">คะแนน (Points):</label>
                <input
                  type="number"
                  className={inp}
                  value={q.points}
                  onChange={(e) => updateQ(qIdx, { points: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Explanation Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">คำอธิบายเฉลยทางชีววิทยา (Biology Explanation):</label>
              <input
                className={inp}
                value={q.explanation}
                onChange={(e) => updateQ(qIdx, { explanation: e.target.value })}
                placeholder="พิมพ์คำอธิบายเฉลย..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* ➕ Centered Prominent Modal Dialog for Adding New Kahoot Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="rounded-3xl bg-slate-900 border-3 border-pink-500 max-w-xl w-full p-6 sm:p-8 relative shadow-2xl shadow-pink-500/20 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>

            <h3 className="font-black text-pink-300 text-xl sm:text-2xl mb-1 flex items-center gap-2">
              <span>➕</span> เพิ่มโจทย์ Kahoot ข้อใหม่ ({currentZone?.name})
            </h3>
            <p className="text-xs text-slate-400 mb-6">กรอกโจทย์และตัวเลือกทั้ง 4 ข้อ จากนั้นกดบันทึกเพื่อเพิ่มโจทย์เข้าสู่ระบบ</p>

            <form onSubmit={handleSaveNewQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-pink-300 block mb-1">1. พิมพ์คำถามประจำข้อ (Question Prompt):</label>
                <textarea
                  className={inp}
                  rows={2}
                  value={newQPrompt}
                  onChange={(e) => setNewQPrompt(e.target.value)}
                  placeholder="เช่น พันธะเคมีชนิดใดที่ยึดกรดอะมิโน..."
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-pink-300 block mb-2">2. พิมพ์ตัวเลือกทั้ง 4 ข้อ (4 Options):</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl bg-red-950/60 p-2 border border-red-500/40">
                    <span className="text-sm font-black text-red-400 w-6 text-center">🔴 A</span>
                    <input
                      className={inp}
                      value={newOptA}
                      onChange={(e) => setNewOptA(e.target.value)}
                      placeholder="ตัวเลือก A (เช่น พันธะเปปไทด์)"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-cyan-950/60 p-2 border border-cyan-500/40">
                    <span className="text-sm font-black text-cyan-400 w-6 text-center">🔷 B</span>
                    <input
                      className={inp}
                      value={newOptB}
                      onChange={(e) => setNewOptB(e.target.value)}
                      placeholder="ตัวเลือก B (เช่น พันธะไอออนิก)"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-950/60 p-2 border border-amber-500/40">
                    <span className="text-sm font-black text-amber-400 w-6 text-center">💛 C</span>
                    <input
                      className={inp}
                      value={newOptC}
                      onChange={(e) => setNewOptC(e.target.value)}
                      placeholder="ตัวเลือก C (เช่น พันธะไฮโดรเจน)"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-950/60 p-2 border border-emerald-500/40">
                    <span className="text-sm font-black text-emerald-400 w-6 text-center">🟢 D</span>
                    <input
                      className={inp}
                      value={newOptD}
                      onChange={(e) => setNewOptD(e.target.value)}
                      placeholder="ตัวเลือก D (เช่น พันธะไดซัลไฟด์)"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">เฉลยที่ถูกต้อง:</label>
                  <select
                    className={inp + " font-black text-emerald-400"}
                    value={newCorrectIdx}
                    onChange={(e) => setNewCorrectIdx(Number(e.target.value))}
                  >
                    <option value={0}>🔴 ตัวเลือก A</option>
                    <option value={1}>🔷 ตัวเลือก B</option>
                    <option value={2}>💛 ตัวเลือก C</option>
                    <option value={3}>🟢 ตัวเลือก D</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ความยาก:</label>
                  <select
                    className={inp}
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                  >
                    <option value="easy">ง่าย (Easy)</option>
                    <option value="medium">ปานกลาง (Medium)</option>
                    <option value="hard">ยาก (Hard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">คะแนน (Points):</label>
                  <input
                    type="number"
                    className={inp}
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">คำอธิบายเฉลยทางชีววิทยา (Explanation):</label>
                <input
                  className={inp}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="พิมพ์อธิบายเหตุผลของคำตอบที่ถูกต้อง..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 rounded-2xl bg-slate-800 text-slate-300 py-3.5 text-xs font-bold hover:bg-slate-700 cursor-pointer transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 py-3.5 text-xs font-black text-white shadow-xl hover:scale-105 transition cursor-pointer"
                >
                  💾 บันทึกโจทย์ข้อใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ Modal Confirmation Dialog for Deleting Question */}
      {deletingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="rounded-3xl bg-slate-900 border-3 border-rose-500 max-w-md w-full p-6 relative shadow-2xl text-center space-y-4">
            <div className="text-5xl filter drop-shadow">⚠️</div>
            <h3 className="font-black text-white text-xl">ยืนยันการลบโจทย์ Kahoot?</h3>
            <p className="text-xs text-slate-400">
              คุณแน่ใจหรือไม่ว่าต้องการลบโจทย์ข้อที่ <span className="font-bold text-pink-300">#{deletingIndex + 1}</span> ออกจากด่าน <span className="font-bold text-white">{currentZone?.name}</span>?
            </p>

            <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 italic border border-white/10">
              "{questions[deletingIndex]?.prompt}"
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingIndex(null)}
                className="w-1/2 rounded-2xl bg-slate-800 text-slate-300 py-3 text-xs font-bold hover:bg-slate-700 cursor-pointer transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteQuestion}
                className="w-1/2 rounded-2xl bg-rose-950 text-rose-300 border border-rose-500/50 py-3 text-xs font-black hover:bg-rose-900 transition shadow-lg cursor-pointer"
              >
                🗑️ ยืนยันลบโจทย์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [data, save] = useGameData();

  const upd = (zone: ZoneKey, patch: Partial<GameData["settings"]["structural"]>) => {
    save({ ...data, settings: { ...data.settings, [zone]: { ...data.settings[zone], ...patch } } });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl">
        <h2 className="mb-4 font-black text-pink-300 text-lg">⚙️ ตั้งค่าเวลานับถอยหลังต่อข้อ และคะแนนขั้นต่ำผ่าน</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ZONES.map((z) => (
            <div key={z.key} className="rounded-2xl border border-pink-500/30 bg-slate-950 p-4 shadow-inner">
              <div className="font-black text-white flex items-center gap-2">
                <span className="text-xl">{z.emoji}</span> {z.name}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <label>
                  <div className="text-slate-400 font-bold mb-1">เวลานับถอยหลังต่อข้อ (วินาที)</div>
                  <input type="number" className={inp} value={data.settings[z.key].timeSec} onChange={(e) => upd(z.key, { timeSec: Number(e.target.value) })} />
                </label>
                <label>
                  <div className="text-slate-400 font-bold mb-1">คะแนนขั้นต่ำผ่าน ⭐</div>
                  <input type="number" className={inp} value={data.settings[z.key].passing} onChange={(e) => upd(z.key, { passing: Number(e.target.value) })} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl">
        <h2 className="mb-3 font-black text-pink-300 text-lg">🔑 รหัสผ่านเข้าสู่ระบบผู้ดูแล</h2>
        <input
          className={inp + " max-w-sm"}
          value={data.settings.adminPassword}
          onChange={(e) => save({ ...data, settings: { ...data.settings, adminPassword: e.target.value } })}
        />
      </div>

      <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl">
        <h2 className="mb-2 font-black text-pink-300 text-lg">💾 นำออก / นำเข้า ข้อมูลโจทย์ Kahoot (Backup JSON)</h2>
        <p className="mb-4 text-xs text-slate-400">ดาวน์โหลดไฟล์สำรองข้อมูลโจทย์ หรือแชร์ไฟล์ชุดคำถามไปยังเครื่องอื่น</p>
        <button onClick={() => exportGameDataJSON(data)} className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 text-xs font-black shadow-lg hover:scale-105 transition cursor-pointer">
          📥 ส่งออกข้อมูลโจทย์ (Export JSON)
        </button>
      </div>

      <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-rose-500/40 backdrop-blur shadow-2xl">
        <h2 className="mb-2 font-black text-rose-400 text-lg">♻️ รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้น (Factory Reset)</h2>
        <p className="mb-4 text-xs text-slate-400">ล้างคำถามที่เพิ่มใหม่ คะแนนผู้เล่น และประวัติการเล่นทั้งหมด</p>
        <button
          onClick={() => {
            if (confirm("คุณแน่ใจหรือว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น?")) resetAll();
          }}
          className="rounded-full bg-rose-950/80 border border-rose-500/40 px-5 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-900 transition shadow-lg cursor-pointer"
        >
          ♻️ ยืนยันรีเซ็ตข้อมูลระบบ
        </button>
      </div>
    </div>
  );
}

function UsersTab() {
  const [plays, save] = usePlays();

  return (
    <div className="rounded-3xl bg-slate-900/90 p-6 border-2 border-pink-500/30 backdrop-blur shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-pink-300 text-lg">👥 ประวัติการเล่นผู้เล่น (Player Audit Log)</h2>
        {plays.length > 0 && (
          <button onClick={() => save([])} className="rounded-full bg-rose-950/80 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-900 cursor-pointer">
            ล้างประวัติ
          </button>
        )}
      </div>

      {plays.length === 0 ? (
        <p className="text-sm text-slate-400">ยังไม่มีประวัติการเล่น</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-2">วันเวลา</th>
                <th>ผู้เล่น</th>
                <th>ด่าน</th>
                <th>คะแนน</th>
                <th>ดาว ⭐</th>
              </tr>
            </thead>
            <tbody>
              {plays.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-slate-800/50">
                  <td className="py-2 text-xs text-slate-400">{new Date(p.at).toLocaleString("th-TH")}</td>
                  <td className="font-bold text-white">{p.player}</td>
                  <td className="font-semibold text-pink-300">{p.zone}</td>
                  <td className="font-bold text-amber-300">{p.score} / {p.total}</td>
                  <td>{"⭐".repeat(p.stars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GuideTab() {
  return (
    <div className="rounded-3xl bg-slate-900/90 p-8 space-y-4 max-w-4xl border-2 border-pink-500/30 backdrop-blur shadow-2xl">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">
        💡 คู่มือการใช้งานระบบจัดการโจทย์ Kahoot สำหรับอาจารย์
      </h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        ยินดีต้อนรับสู่ระบบบริหารจัดการโจทย์ **Protein World Kahoot CMS** สำหรับชีววิทยา ม.4 เรื่องโปรตีนและเอนไซม์ ท่านสามารถปรับเพิ่ม ลด และแก้ไขโจทย์ทั้ง 4 ตัวเลือกได้อย่างยืดหยุ่น:
      </p>

      <div className="space-y-3 text-sm">
        <div className="p-4 bg-slate-950 rounded-2xl border border-pink-500/30">
          <span className="font-bold text-pink-300">1. การเพิ่ม/แก้ไขโจทย์ Kahoot 4 ตัวเลือก:</span> เลือกด่านที่ต้องการ กรอกโจทย์ และพิมพ์ตัวเลือกทั้ง 4 ข้อ (🔴 A, 🔷 B, 💛 C, 🟢 D) จากนั้นเลือกตัวเลือกเฉลยที่ถูกต้องในช่อง dropdown
        </div>
        <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30">
          <span className="font-bold text-purple-300">2. การควบคุมเวลานับถอยหลังต่อข้อ:</span> ปรับลด/เพิ่มเวลานับถอยหลังต่อข้อที่แท็บ "ตั้งค่าระบบ" เพื่อเพิ่มความท้าทายในสไตล์ Kahoot
        </div>
        <div className="p-4 bg-slate-950 rounded-2xl border border-teal-500/30">
          <span className="font-bold text-teal-300">3. การส่งออกไฟล์ JSON:</span> กดปุ่มส่งออกไฟล์ JSON เพื่อสำรองข้อมูลโจทย์คำถามหรือแชร์ไฟล์ชุดคำถามไปยังเครื่องอื่น
        </div>
      </div>
    </div>
  );
}