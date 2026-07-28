import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useRef, useState } from "react";
import { usePlayerName, usePlayerAvatar, useProgress } from "@/lib/game-store";
import { ZONES, PRESET_AVATARS } from "@/lib/game-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protein World MMORPG — มหานครชีววิทยาโปรตีน" },
      { name: "description", content: "ผจญภัยในมหานครชีววิทยา Protein World MMORPG สัมผัสประสบการณ์เกม RPG เรียนรู้เรื่องโปรตีนและเอนไซม์ ม.4" },
      { property: "og:title", content: "Protein World MMORPG — มหานครชีววิทยาโปรตีน" },
      { property: "og:description", content: "เกมผจญภัย MMORPG เรียนรู้โครงสร้าง การพับ เอนไซม์ และภูมิคุ้มกัน" },
    ],
  }),
  component: Index,
});

export const COLLECTIONS = [
  {
    id: "structural",
    name: "ผลึกคริสตัลกรดอะมิโนไดเปปไทด์",
    enName: "Dipeptide Crystal Core",
    zoneName: "สถาบันโครงสร้างชีวะ",
    img: "/collections/dipeptide_crystal.svg",
    emoji: "🧬",
    rarity: "EPIC",
    rarityBadge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    glowColor: "shadow-pink-500/30 border-pink-500/60",
    desc: "ผลึกคริสตัลเรืองแสงที่เกิดจากปฏิกิริยา Dehydration Synthesis เชื่อมกรดอะมิโนเข้าด้วยกันด้วยพันธะเปปไทด์",
    req: "เคลียร์ด่านสถาบันโครงสร้างชีวะ",
  },
  {
    id: "folding",
    name: "ริบบิ้นมงกุฎเกลียว Alpha-Helix",
    enName: "Alpha-Helix Ribbon Crown",
    zoneName: "โรงงานพับม้วนโปรตีน",
    img: "/collections/alpha_ribbon.svg",
    emoji: "🎀",
    rarity: "LEGENDARY",
    rarityBadge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    glowColor: "shadow-purple-500/30 border-purple-500/60",
    desc: "มงกุฎริบบิ้นทองคำโครงสร้างเกลียวสเปียรัล เชื่อมโยงด้วยพันธะไฮโดรเจนที่ทนทานต่อสภาวะแวดล้อม",
    req: "เคลียร์ด่านโรงงานพับม้วนโปรตีน",
  },
  {
    id: "enzyme",
    name: "ลูกแก้วเวทมนตร์เอนไซม์เร่งปฏิกิริยา",
    enName: "Catalytic Enzyme Orb",
    zoneName: "ห้องปฏิบัติการเอนไซม์",
    img: "/collections/enzyme_orb.svg",
    emoji: "🧪",
    rarity: "MYTHIC",
    rarityBadge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    glowColor: "shadow-teal-500/30 border-teal-500/60",
    desc: "ลูกแก้วเวทมนตร์โครงสร้าง Lock & Key ที่มีความจำเพาะเจาะจง ช่วยลดพลังงานกระตุ้น Ea ในปฏิกิริยาชีวเคมี",
    req: "เคลียร์ด่านห้องปฏิบัติการเอนไซม์",
  },
  {
    id: "immune",
    name: "โล่แอนติบอดีป้องกันโรครัศมีทอง",
    enName: "Golden Antibody Shield",
    zoneName: "โรงพยาบาลภูมิคุ้มกัน",
    img: "/collections/antibody_shield.svg",
    emoji: "💗",
    rarity: "DIVINE",
    rarityBadge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    glowColor: "shadow-rose-500/30 border-rose-500/60",
    desc: "โล่เกียรติยศแอนติบอดีรูปตัว Y (Y-shaped immunoglobulins) คอยเข้าจับแอนติเจนคุ้มครองผู้ป่วยทั่วเมืองโปรตีน",
    req: "เคลียร์ด่านโรงพยาบาลภูมิคุ้มกัน",
  },
];

function Index() {
  const [playerName, setPlayerName] = usePlayerName();
  const [playerAvatar, setPlayerAvatar] = usePlayerAvatar();
  const [progress] = useProgress();
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCol, setSelectedCol] = useState<(typeof COLLECTIONS)[number] | null>(null);

  function handleStartGame(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) {
      setPlayerName("นักชีววิทยาฝึกหัด");
    }
    nav({ to: "/map" });
  }

  function handleCustomAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPlayerAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleToggleFullscreen() {
    toggleFullscreen((active) => setIsFullscreen(active));
  }

  const totalUnlockedCount = COLLECTIONS.filter(
    (col) => (progress.scores[col.id as keyof typeof progress.scores] ?? 0) > 0 || (progress.stars[col.id as keyof typeof progress.stars] ?? 0) > 0
  ).length;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto font-sans selection:bg-pink-500 selection:text-white">
      {/* MMORPG Ambient Glowing Orbs Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-pink-600/30 blur-[130px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 h-[550px] w-[550px] rounded-full bg-purple-600/25 blur-[140px]" />
        <div className="absolute bottom-10 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/20 blur-[150px]" />
      </div>

      {/* Header Navigation */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 font-black text-white shadow-lg shadow-pink-500/30">
            🧬
          </div>
          <div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              PROTEIN WORLD
            </span>
            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
              MMORPG EDITION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-extrabold text-pink-200 border border-white/15 backdrop-blur hover:bg-white/20 transition shadow-lg cursor-pointer"
            title="สลับโหมดเต็มหน้าจอ Fullscreen"
          >
            {isFullscreen ? "🔲 ย่อหน้าจอ" : "🖥️ เต็มหน้าจอ (Fullscreen)"}
          </button>

          <Link
            to="/admin/login"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-extrabold text-pink-200 border border-white/15 backdrop-blur hover:bg-white/20 transition shadow-lg"
          >
            🔐 ผู้ดูแลระบบ (Admin)
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-24 text-center">
        {/* RPG Realm Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pink-300 border border-pink-500/40 shadow-xl backdrop-blur">
          <span className="animate-spin text-sm">✨</span> MMORPG OVERWORLD BIOLOGY QUEST · GRADE 10
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight sm:text-6xl md:text-7xl">
          มหานครชีววิทยา<br />
          <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent filter drop-shadow-lg">
            Protein World MMORPG
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-medium">
          ออกผจญภัยในโลกชีวเคมี สร้างตัวละครนักวิทยาศาสตร์ในแบบคุณ สัมผัสแผนที่ Overworld RPG สไตล์ MMORPG ไขปริศนากรอบโครงสร้างโปรตีน เอนไซม์ และระบบภูมิคุ้มกัน!
        </p>

        {/* Player Profile & Adventurer Guild License Card */}
        <div className="mt-10 mx-auto max-w-xl rounded-3xl bg-slate-900/90 p-6 sm:p-8 border-2 border-pink-500/40 shadow-2xl shadow-pink-500/10 backdrop-blur text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-pink-400">ADVENTURER GUILD LICENSE</div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                💳 บัตรประจำตัวนักผจญภัยชีวะ
              </h2>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/40">
              🛡️ LV.1 Adventurer
            </div>
          </div>

          <form onSubmit={handleStartGame} className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-pink-300 block mb-2">
                ✏️ 1. ตั้งชื่อนักผจญภัยของคุณ:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="พิมพ์ชื่อตัวละคร (เช่น ดร. นลิน)..."
                className="w-full rounded-2xl border-2 border-pink-500/30 bg-slate-950/80 px-4 py-3 text-base font-bold text-white placeholder-slate-500 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/20 shadow-inner"
                required
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-pink-300 block">
                  👤 2. เลือกโมเดลตัวละครนักชีววิทยา:
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 cursor-pointer"
                >
                  📁 อัปโหลดรูปเอง
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomAvatarUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setPlayerAvatar(av.img)}
                    className={`rounded-2xl p-2.5 text-center border-2 transition-all relative overflow-hidden cursor-pointer ${
                      playerAvatar === av.img
                        ? "border-pink-500 bg-pink-500/20 ring-4 ring-pink-500/40 font-bold scale-105 shadow-lg shadow-pink-500/20"
                        : "border-white/10 bg-slate-950/60 hover:bg-slate-800/80 opacity-80"
                    }`}
                  >
                    <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-pink-400/50 shadow-md">
                      <img src={av.img} alt={av.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="mt-2 text-[11px] font-extrabold text-slate-200 leading-tight">
                      {av.name.split(" (")[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enter MMORPG Overworld Button */}
            <button
              type="submit"
              className="relative group w-full overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-0.5 font-black text-white shadow-2xl shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-slate-950/20 px-6 py-4 text-base sm:text-lg font-black uppercase tracking-wider backdrop-blur group-hover:bg-transparent transition-colors">
                ⚔️ เข้าสู่มหานคร Protein World (ENTER OVERWORLD) →
              </div>
            </button>
          </form>
        </div>

        {/* 🏆 Biologist Trophy Collection Showcase */}
        <section className="mt-20 text-left">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">BIOLOGIST TROPHY COLLECTION</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                🏆 หอเกียรติยศคอลเล็กชั่นสะสม ({totalUnlockedCount}/{COLLECTIONS.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              สะสมสมบัติประจำด่าน
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((col) => {
              const isUnlocked =
                (progress.scores[col.id as keyof typeof progress.scores] ?? 0) > 0 ||
                (progress.stars[col.id as keyof typeof progress.stars] ?? 0) > 0;

              return (
                <div
                  key={col.id}
                  onClick={() => setSelectedCol(col)}
                  className={`group relative rounded-3xl bg-slate-900/90 p-5 border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isUnlocked
                      ? `${col.glowColor} shadow-2xl hover:-translate-y-2`
                      : "border-white/10 opacity-70 hover:opacity-90"
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-white/5 to-transparent h-20 w-20 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Item Rarity Badge & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${col.rarityBadge}`}>
                        {col.rarity}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isUnlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-950 text-slate-500 border border-white/10"
                      }`}>
                        {isUnlocked ? "🔓 ปลดล็อกแล้ว" : "🔒 ยังไม่ปลดล็อก"}
                      </span>
                    </div>

                    {/* Image Container */}
                    <div className="relative mx-auto h-32 w-32 my-3 overflow-hidden rounded-2xl bg-slate-950 p-2 border border-white/10 shadow-inner flex items-center justify-center">
                      <img
                        src={col.img}
                        alt={col.name}
                        className={`h-full w-full object-contain transition-all ${
                          isUnlocked ? "group-hover:scale-110 filter drop-shadow-md" : "filter grayscale opacity-40 blur-[1px]"
                        }`}
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-3xl">
                          🔒
                        </div>
                      )}
                    </div>

                    <h3 className={`mt-2 font-black text-lg ${isUnlocked ? "text-white group-hover:text-amber-300" : "text-slate-400"} transition-colors`}>
                      {col.emoji} {col.name}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">{col.enName}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-2">{col.desc}</p>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>เงื่อนไข:</span>
                    <span className={isUnlocked ? "text-emerald-400 font-extrabold" : "text-amber-300 font-semibold"}>
                      {isUnlocked ? "✓ ปลดล็อกเรียบร้อย" : col.req}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Collection Details Modal */}
        {selectedCol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="rounded-3xl bg-slate-900 border-2 border-amber-400/60 max-w-md w-full p-6 relative shadow-2xl text-left">
              <button
                onClick={() => setSelectedCol(null)}
                className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-white"
              >
                ✕ ปิด
              </button>

              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${selectedCol.rarityBadge}`}>
                  {selectedCol.rarity}
                </span>
                <span className="text-xs text-amber-300 font-bold">{selectedCol.zoneName}</span>
              </div>

              <div className="my-4 h-40 w-40 mx-auto rounded-3xl bg-slate-950 p-3 border border-white/10 shadow-inner flex items-center justify-center">
                <img
                  src={selectedCol.img}
                  alt={selectedCol.name}
                  className={`h-full w-full object-contain ${
                    (progress.scores[selectedCol.id as keyof typeof progress.scores] ?? 0) > 0 ||
                    (progress.stars[selectedCol.id as keyof typeof progress.stars] ?? 0) > 0
                      ? "filter drop-shadow-lg"
                      : "filter grayscale opacity-50"
                  }`}
                />
              </div>

              <h3 className="text-xl font-black text-white">{selectedCol.emoji} {selectedCol.name}</h3>
              <div className="text-xs font-mono text-slate-400 mb-3">{selectedCol.enName}</div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-white/10">
                {selectedCol.desc}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-slate-400 font-bold">สถานะการสะสม:</span>
                {(progress.scores[selectedCol.id as keyof typeof progress.scores] ?? 0) > 0 ||
                (progress.stars[selectedCol.id as keyof typeof progress.stars] ?? 0) > 0 ? (
                  <span className="font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">
                    🔓 ปลดล็อกและครอบครองแล้ว
                  </span>
                ) : (
                  <span className="font-black text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/40">
                    🔒 ยังไม่ปลดล็อก ({selectedCol.req})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4 Dungeon Entrances Section (Dynamic Unlock per map progress) */}
        <section className="mt-20 text-left">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-pink-400">DUNGEON GATEWAYS</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">🏰 ทางเข้าดันเจี้ยน 4 ภารกิจหลัก</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">ปลดล็อกตามลำดับความสำเร็จ</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {ZONES.map((z, idx) => {
              const isUnlocked = progress.unlocked[z.key] ?? false;
              const prevZoneName = idx > 0 ? ZONES[idx - 1].name : "";

              if (isUnlocked) {
                return (
                  <Link
                    key={z.key}
                    to={z.path}
                    className="group relative rounded-3xl bg-slate-900/80 p-6 border-2 border-white/10 hover:border-pink-500/80 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500/20 to-transparent h-24 w-24 rounded-bl-full pointer-events-none" />

                    <div>
                      <div className="flex justify-between items-start">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-pink-400/50 shadow-md group-hover:rotate-3 transition-transform">
                          <img src={z.img} alt={z.name} className="h-full w-full object-cover" />
                          <div className="absolute top-1 left-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">
                            {z.emoji}
                          </div>
                        </div>

                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                          🔓 ปลดล็อกแล้ว
                        </span>
                      </div>

                      <h3 className="mt-4 font-black text-xl text-white group-hover:text-pink-300 transition-colors">
                        {z.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{z.blurb}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black text-pink-400 group-hover:text-pink-300">
                      <span>🚀 ท้าทายดันเจี้ยน</span>
                      <span>→</span>
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={z.key}
                  className="relative rounded-3xl bg-slate-950/90 p-6 border-2 border-white/5 opacity-60 overflow-hidden flex flex-col justify-between select-none"
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none" />

                  <div>
                    <div className="flex justify-between items-start">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 filter grayscale opacity-50">
                        <img src={z.img} alt={z.name} className="h-full w-full object-cover" />
                      </div>

                      <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-white/10">
                        🔒 ล็อกด่านอยู่
                      </span>
                    </div>

                    <h3 className="mt-4 font-black text-xl text-slate-400 flex items-center gap-2">
                      <span>🔒</span> {z.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{z.blurb}</p>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4 text-xs font-bold text-amber-400/90">
                    ⚠️ ต้องเล่นผ่านด่าน "{prevZoneName}" ก่อนเพื่อปลดล็อก
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MMORPG Features Grid */}
        <section className="mt-20 text-left">
          <div className="mb-8 border-b border-white/10 pb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">MMORPG GAME FEATURES</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">⚡ ฟีเจอร์เด็ดประจำมหานครโปรตีน</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🗺️", title: "60FPS RPG Overworld", desc: "เดินสำรวจเมืองโปรตีนในรูปแบบ 60FPS GPU Hardware Accelerated" },
              { icon: "📌", title: "Daily Quest System", desc: "รับภารกิจวิชาการประจำวัน สะสมดาวและคะแนนยศนักชีววิทยา" },
              { icon: "🏆", title: "Biologist Trophy Collection", desc: "หอเกียรติยศสะสมสมบัติประจำด่าน ปลดล็อกเมื่อผ่านมินิเกม" },
              { icon: "🎵", title: "RPG Open World Soundtrack", desc: "ดนตรีประกอบแนวแฟนตาซี RPG Synth พร้อมปุ่มสลับเปิดปิดเสียง" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-slate-900/60 p-5 border border-white/10 backdrop-blur">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h4 className="font-black text-base text-white">{f.title}</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 text-xs text-slate-500 border-t border-white/10 pt-8">
          🌷 Protein World MMORPG Edition · สื่อการเรียนรู้ชีววิทยา ม.4 เรื่องโปรตีนและเอนไซม์
        </footer>
      </main>
    </div>
  );
}
