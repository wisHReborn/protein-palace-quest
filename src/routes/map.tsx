import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useMultiplayer } from "@/lib/multiplayer-store";
import { useEffect, useRef, useState, useCallback } from "react";
import { useProgress, usePlayerAvatar, usePlayerName, usePlays, useGameData } from "@/lib/game-store";
import { ZONES, PRESET_AVATARS, defaultData, type KahootQ } from "@/lib/game-data";
import { rpgAudio } from "@/lib/audio-player";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "แผนที่เมืองโปรตีน — Protein World MMORPG Overworld" },
      { name: "description", content: "ผจญภัยในเมืองโปรตีน เลือกเข้าเล่น 4 ด่านมินิเกม แบบเต็มหน้าจอแนว MMORPG" },
      { property: "og:title", content: "แผนที่เมืองโปรตีน Overworld MMORPG" },
      { property: "og:description", content: "เดินสำรวจเมืองโปรตีน ทำเควสต์ และเข้าสู่ด่านมินิเกม" },
    ],
  }),
  component: OverworldMapPage,
});

type NPC = {
  id: string;
  name: string;
  avatar: string;
  x: number;
  y: number;
  speech: string;
  role: string;
};

export type ChestItem = {
  id: string;
  name: string;
  x: number;
  y: number;
  icon: string;
};

export const CHESTS: ChestItem[] = [
  { id: "chest_1", name: "กล่องสมบัติชีวะ #1 (ป่าโครงสร้าง)", x: 340, y: 140, icon: "🧰" },
  { id: "chest_2", name: "กล่องสมบัติชีวะ #2 (ป่าพับม้วน)", x: 620, y: 140, icon: "🎁" },
  { id: "chest_3", name: "กล่องสมบัติชีวะ #3 (ริมบ่อเอนไซม์)", x: 340, y: 490, icon: "📦" },
  { id: "chest_4", name: "กล่องสมบัติชีวะ #4 (สวนภูมิคุ้มกัน)", x: 620, y: 490, icon: "💎" },
];

export function OverworldMapPage() {
  const [progress, saveProgress] = useProgress();
  const [playerAvatar, setPlayerAvatar] = usePlayerAvatar();
  const [playerName] = usePlayerName();
  const [plays] = usePlays();
  const [gameData] = useGameData();
  const nav = useNavigate();

  const [activeZone, setActiveZone] = useState<(typeof ZONES)[number] | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);

  // Protein Treasure Chests State
  const [chestCooldowns, setChestCooldowns] = useState<Record<string, number>>({});
  const [activeChest, setActiveChest] = useState<{ chest: ChestItem; question: KahootQ } | null>(null);
  const [selectedChestOption, setSelectedChestOption] = useState<number | null>(null);
  const [chestAnswered, setChestAnswered] = useState<{ isCorrect: boolean; rewardPoints: number } | null>(null);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Load chest cooldowns from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pw_chest_cooldowns");
      if (stored) setChestCooldowns(JSON.parse(stored));
    } catch {}
  }, []);

  // Live timer tick for chest cooldowns
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenChest = (chest: ChestItem) => {
    const cdUntil = chestCooldowns[chest.id] || 0;
    if (cdUntil > Date.now()) return;

    const qPool = gameData.chestQuestions?.length ? gameData.chestQuestions : defaultData.chestQuestions;
    const randomQ = qPool[Math.floor(Math.random() * qPool.length)];

    setActiveChest({ chest, question: randomQ });
    setSelectedChestOption(null);
    setChestAnswered(null);
    rpgAudio.playSfx("click");
  };

  const handleAnswerChest = (optionIndex: number) => {
    if (!activeChest || selectedChestOption !== null) return;

    setSelectedChestOption(optionIndex);
    const isCorrect = optionIndex === activeChest.question.correctIndex;
    const cooldownSec = gameData.settings?.chest?.cooldownSec || 180;
    const rewardPoints = isCorrect ? (activeChest.question.points || gameData.settings?.chest?.rewardPoints || 50) : 0;

    if (isCorrect) {
      rpgAudio.playSfx("correct");
      saveProgress((prev) => ({
        ...prev,
        scores: {
          ...prev.scores,
          structural: (prev.scores.structural || 0) + rewardPoints,
        },
      }));
    } else {
      rpgAudio.playSfx("wrong");
    }

    setChestAnswered({ isCorrect, rewardPoints });

    const cdEndTime = Date.now() + cooldownSec * 1000;
    setChestCooldowns((prev) => {
      const next = { ...prev, [activeChest.chest.id]: cdEndTime };
      try {
        localStorage.setItem("pw_chest_cooldowns", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Audio state (Default: Muted/Stopped until player clicks play button)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Viewport dimensions
  const [mapBounds, setMapBounds] = useState({ w: 1200, h: 800 });

  // Player position state
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 480, y: 350 });
  const [isWalking, setIsWalking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Multiplayer Chat State
  const [chatInput, setChatInput] = useState("");

  const { remotePlayers, sendMove, sendChat, myChat } = useMultiplayer({
    name: playerName,
    avatar: playerAvatar,
    rx: playerPos.x / 960,
    ry: playerPos.y / 600,
    direction: "down",
    zone: "overworld",
  });

  const handleSendLocalChat = (text: string) => {
    if (!text.trim()) return;
    sendChat(text.trim());
    setChatInput("");
  };

  const sendMoveRef = useRef(sendMove);
  useEffect(() => {
    sendMoveRef.current = sendMove;
  }, [sendMove]);

  // Click / Touch indicator marker
  const [clickMarker, setClickMarker] = useState<{ x: number; y: number; id: number } | null>(null);

  // Virtual D-Pad Touch State for Mobile
  const dpadDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Target walking refs
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const targetBuildingKeyRef = useRef<string | null>(null);
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 480, y: 350 });
  const lastClosedZoneRef = useRef<string | null>(null);

  // Stop audio on component unmount
  useEffect(() => {
    return () => {
      rpgAudio.stop();
    };
  }, []);

  // Roaming NPCs State
  const [npcs, setNpcs] = useState<NPC[]>([
    {
      id: "npc1",
      name: "อาจารย์เมย์",
      avatar: "/avatars/biologist_female.jpg",
      x: 420,
      y: 280,
      speech: "ยินดีต้อนรับสู่เมืองโปรตีนนะจ๊ะ! ลองเริ่มจากสถาบันโครงสร้างชีวะสิ",
      role: "ครูสอนชีววิทยา ม.4",
    },
    {
      id: "npc2",
      name: "น้องบ็อบ",
      avatar: "/avatars/biologist_chibi.jpg",
      x: 540,
      y: 460,
      speech: "รู้ไหมครับ? เอนไซม์ช่วยลดพลังงานกระตุ้น (Ea) ทำให้ปฏิกิริยาเกิดเร็วขึ้นมาก!",
      role: "นักวิจัยรุ่นเยาว์",
    },
    {
      id: "npc3",
      name: "พี่เรน",
      avatar: "/avatars/biologist_silver.jpg",
      x: 780,
      y: 320,
      speech: "ระวังอย่าปรับอุณหภูมิสูงเกิน 55°C นะ! ไม่งั้นโปรตีนจะเสียสภาพ (Denature) หมด!",
      role: "นักชีวเคมีประจำโรงงาน",
    },
  ]);

  const totalStars = Object.values(progress.stars).reduce((a, b) => a + (b ?? 0), 0);
  const totalScore = Object.values(progress.scores).reduce((a, b) => a + (b ?? 0), 0);

  const keysPressed = useRef<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setMapBounds({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Roaming NPCs
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcs((prev) =>
        prev.map((npc) => {
          const dx = (Math.random() - 0.5) * 40;
          const dy = (Math.random() - 0.5) * 40;
          return {
            ...npc,
            x: Math.max(150, Math.min(810, npc.x + dx)),
            y: Math.max(120, Math.min(500, npc.y + dy)),
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check Building Box Collisions
  const checkBuildingCollision = useCallback(
    (px: number, py: number) => {
      for (const z of ZONES) {
        const dist = Math.hypot(z.x - px, z.y - py);

        if (dist <= 75) {
          if (progress.unlocked[z.key] && lastClosedZoneRef.current !== z.key) {
            setActiveZone(z);
          }
        } else if (dist > 110) {
          if (lastClosedZoneRef.current === z.key) {
            lastClosedZoneRef.current = null;
          }
        }
      }
    },
    [progress.unlocked]
  );

  // Check NPC Proximity
  const checkNpcProximity = useCallback(
    (px: number, py: number) => {
      for (const npc of npcs) {
        if (Math.hypot(npc.x - px, npc.y - py) < 65) {
          setActiveNpc(npc);
          return;
        }
      }
    },
    [npcs]
  );

  // High-performance rAF movement loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const speed = 320 * delta;
      let dx = dpadDir.current.dx;
      let dy = dpadDir.current.dy;

      if (keysPressed.current["ArrowUp"] || keysPressed.current["w"] || keysPressed.current["W"]) dy -= 1;
      if (keysPressed.current["ArrowDown"] || keysPressed.current["s"] || keysPressed.current["S"]) dy += 1;
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) dx -= 1;
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) dx += 1;

      let moving = false;
      let nx = playerPosRef.current.x;
      let ny = playerPosRef.current.y;

      if (dx !== 0 || dy !== 0) {
        moving = true;
        targetPosRef.current = null;
        targetBuildingKeyRef.current = null;
        setClickMarker(null);

        const len = Math.hypot(dx, dy);
        nx = Math.max(35, Math.min(925, nx + (dx / len) * speed));
        ny = Math.max(65, Math.min(565, ny + (dy / len) * speed));
      } else if (targetPosRef.current) {
        const tdx = targetPosRef.current.x - nx;
        const tdy = targetPosRef.current.y - ny;
        const dist = Math.hypot(tdx, tdy);

        if (dist <= speed) {
          nx = targetPosRef.current.x;
          ny = targetPosRef.current.y;
          targetPosRef.current = null;
          moving = false;
          setClickMarker(null);

          if (targetBuildingKeyRef.current) {
            const b = ZONES.find((z) => z.key === targetBuildingKeyRef.current);
            if (b) setActiveZone(b);
            targetBuildingKeyRef.current = null;
          }
        } else {
          moving = true;
          nx += (tdx / dist) * speed;
          ny += (tdy / dist) * speed;
        }
      }

      if (nx !== playerPosRef.current.x || ny !== playerPosRef.current.y) {
        playerPosRef.current = { x: nx, y: ny };
        setPlayerPos({ x: nx, y: ny });
        const rx = nx / 960;
        const ry = ny / 600;
        sendMoveRef.current(rx, ry, "down", moving, "overworld");
        checkBuildingCollision(nx, ny);
        checkNpcProximity(nx, ny);
      }

      setIsWalking(moving);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [checkBuildingCollision, checkNpcProximity]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore movement keys when typing in input/textarea fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        keysPressed.current[e.key] = true;
        setActiveZone(null);
        setActiveNpc(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete keysPressed.current[e.key];
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function handleMapPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;

    // Ignore clicks/taps on UI elements, inputs, buttons, and touch overlays
    const target = e.target as HTMLElement;
    if (target.closest("button, input, textarea, a, select, [role='button']")) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const virtualX = (clickX / mapBounds.w) * 960;
    const virtualY = (clickY / mapBounds.h) * 600;

    targetBuildingKeyRef.current = null;
    targetPosRef.current = { x: virtualX, y: virtualY };
    setClickMarker({ x: virtualX, y: virtualY, id: Date.now() });

    setActiveZone(null);
    setActiveNpc(null);
  }

  function handleBuildingClick(z: (typeof ZONES)[number], e: React.MouseEvent) {
    e.stopPropagation();
    const targetX = z.x;
    const targetY = z.y + 45;

    targetBuildingKeyRef.current = z.key;
    targetPosRef.current = { x: targetX, y: targetY };
    setClickMarker({ x: targetX, y: targetY, id: Date.now() });

    setActiveZone(null);
    setActiveNpc(null);
  }

  function handleCloseZoneModal() {
    if (activeZone) {
      lastClosedZoneRef.current = activeZone.key;
    }
    setActiveZone(null);
  }

  function handleCustomAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPlayerAvatar(reader.result);
        setShowAvatarPicker(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleToggleFullscreen() {
    toggleFullscreen((active) => setIsFullscreen(active));
  }

  function toggleMusic() {
    const playing = rpgAudio.toggle();
    setIsMusicPlaying(playing);
  }

  // Mobile Touch D-Pad handlers
  const setDpad = (dx: number, dy: number) => {
    dpadDir.current = { dx, dy };
    if (dx !== 0 || dy !== 0) {
      setActiveZone(null);
      setActiveNpc(null);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 touch-none">
      {/* Floating Top Sky Layer */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="animate-cloud-drift absolute top-3 text-4xl md:text-6xl opacity-40 filter drop-shadow">
          ☁️
        </div>
        <div className="animate-cloud-drift absolute top-10 text-3xl md:text-5xl opacity-30 filter drop-shadow [animation-delay:18s]">
          ☁️
        </div>
      </div>

      {/* Responsive Top HUD Bar */}
      <header className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-sm font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition"
          >
            ← หน้าหลัก
          </Link>

          <button
            onClick={() => setShowAvatarPicker(true)}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-xs font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition border border-pink-300"
          >
            <img src={playerAvatar} alt="Avatar" className="h-4.5 w-4.5 rounded-full object-cover border border-berry" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">👤 {playerName}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          <button
            onClick={() => setShowQuestLog(true)}
            className="flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2.5 py-1 text-[11px] md:text-xs font-black shadow-lg hover:bg-amber-300 transition"
          >
            📌 ภารกิจเควสต์
          </button>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-xs font-black text-amber-600 shadow-lg backdrop-blur hover:bg-white transition"
          >
            🏆 อันดับผู้เล่น
          </button>

          {/* Online Players Counter */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] md:text-xs font-black text-emerald-400 border border-emerald-500/40 shadow-lg backdrop-blur animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>ออนไลน์ {remotePlayers.length + 1} คน</span>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-xs font-black text-amber-600 shadow-lg backdrop-blur">
            ⭐ {totalStars}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-xs font-black text-berry shadow-lg backdrop-blur">
            💎 {totalScore}
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] md:text-xs font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition"
            title="สลับเต็มหน้าจอ Fullscreen"
          >
            {isFullscreen ? "🔲" : "🖥️"}
          </button>
        </div>
      </header>

      {/* Compact Circular RPG Music Toggle Button (Music only plays when clicked) */}
      <button
        onClick={toggleMusic}
        className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-2xl backdrop-blur transition-all border-2 ${
          isMusicPlaying
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-white ring-4 ring-pink-400/50 scale-105"
            : "bg-white/95 text-berry border-pink-300 hover:bg-white"
        }`}
        title={isMusicPlaying ? "ปิดเพลงประกอบ RPG" : "เปิดเพลงประกอบ RPG"}
      >
        {isMusicPlaying ? "🎵" : "🔇"}
      </button>

      {/* Touch D-Pad Overlay (Visible on Mobile & iPad) */}
      <div className="absolute bottom-4 left-4 z-40 flex flex-col items-center gap-1 touch-none opacity-80 hover:opacity-100 transition-opacity scale-90 sm:scale-100 origin-bottom-left lg:hidden">
        <button
          onTouchStart={() => setDpad(0, -1)}
          onTouchEnd={() => setDpad(0, 0)}
          onMouseDown={() => setDpad(0, -1)}
          onMouseUp={() => setDpad(0, 0)}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/85 text-berry font-black text-lg shadow-2xl border-2 border-pink-300 flex items-center justify-center active:bg-pink-300 active:scale-95"
        >
          ▲
        </button>
        <div className="flex gap-1">
          <button
            onTouchStart={() => setDpad(-1, 0)}
            onTouchEnd={() => setDpad(0, 0)}
            onMouseDown={() => setDpad(-1, 0)}
            onMouseUp={() => setDpad(0, 0)}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/85 text-berry font-black text-lg shadow-2xl border-2 border-pink-300 flex items-center justify-center active:bg-pink-300 active:scale-95"
          >
            ◀
          </button>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-pink-100/60 border-2 border-pink-300 flex items-center justify-center text-xs font-bold text-pink-700">
            🕹️
          </div>
          <button
            onTouchStart={() => setDpad(1, 0)}
            onTouchEnd={() => setDpad(0, 0)}
            onMouseDown={() => setDpad(1, 0)}
            onMouseUp={() => setDpad(0, 0)}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/85 text-berry font-black text-lg shadow-2xl border-2 border-pink-300 flex items-center justify-center active:bg-pink-300 active:scale-95"
          >
            ▶
          </button>
        </div>
        <button
          onTouchStart={() => setDpad(0, 1)}
          onTouchEnd={() => setDpad(0, 0)}
          onMouseDown={() => setDpad(0, 1)}
          onMouseUp={() => setDpad(0, 0)}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/85 text-berry font-black text-lg shadow-2xl border-2 border-pink-300 flex items-center justify-center active:bg-pink-300 active:scale-95"
        >
          ▼
        </button>
      </div>

      {/* Aspect Ratio Preserved RPG Map Canvas (Zero Cropping across all screen sizes) */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 p-1 sm:p-2 md:p-3">
        <div
          ref={containerRef}
          onPointerDown={handleMapPointerDown}
          className="relative w-full h-full max-w-full max-h-full aspect-[960/600] cursor-pointer overflow-hidden shadow-2xl gpu-accelerated bg-no-repeat bg-center rounded-2xl border border-pink-500/30"
          style={{
            backgroundImage: `url('/protein_world_map.jpg')`,
            backgroundSize: "100% 100%",
          }}
        >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />

        {/* Touch Target Indicator Ring */}
        {clickMarker && (
          <div
            key={clickMarker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15 flex items-center justify-center"
            style={{ left: `${(clickMarker.x / 960) * mapBounds.w}px`, top: `${(clickMarker.y / 600) * mapBounds.h}px` }}
          >
            <div className="h-8 w-8 rounded-full border-2 border-pink-400 bg-pink-300/40 animate-ping" />
            <div className="absolute text-xs animate-bounce">📍</div>
          </div>
        )}

        {/* Particles */}
        {[
          { x: 0.15, y: 0.25, delay: "0s", emoji: "✨" },
          { x: 0.85, y: 0.35, delay: "2s", emoji: "🧪" },
          { x: 0.3, y: 0.75, delay: "1s", emoji: "🌸" },
          { x: 0.7, y: 0.8, delay: "3s", emoji: "🧬" },
        ].map((p, idx) => (
          <div
            key={idx}
            className="animate-particle-float absolute text-lg md:text-2xl pointer-events-none opacity-60 filter drop-shadow gpu-accelerated"
            style={{
              left: `${p.x * mapBounds.w}px`,
              top: `${p.y * mapBounds.h}px`,
              animationDelay: p.delay,
            }}
          >
            {p.emoji}
          </div>
        ))}

        {/* Swaying Trees */}
        {[
          { rx: 0.08, ry: 0.22, emoji: "🌳", delay: "0s" },
          { rx: 0.92, ry: 0.22, emoji: "🌲", delay: "1s" },
          { rx: 0.5, ry: 0.22, emoji: "🌸", delay: "0.5s" },
          { rx: 0.06, ry: 0.5, emoji: "🌷", delay: "1.5s" },
          { rx: 0.94, ry: 0.5, emoji: "🌻", delay: "2s" },
          { rx: 0.08, ry: 0.85, emoji: "🌳", delay: "0.8s" },
          { rx: 0.92, ry: 0.85, emoji: "🌲", delay: "1.2s" },
          { rx: 0.5, ry: 0.88, emoji: "🌸", delay: "1.7s" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="animate-tree-sway absolute text-2xl md:text-4xl drop-shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 gpu-accelerated"
            style={{
              left: `${item.rx * mapBounds.w}px`,
              top: `${item.ry * mapBounds.h}px`,
              animationDelay: item.delay,
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Dynamic Roaming NPCs */}
        {npcs.map((npc) => {
          const nx = (npc.x / 960) * mapBounds.w;
          const ny = (npc.y / 600) * mapBounds.h;
          const isSelected = activeNpc?.id === npc.id;

          return (
            <div
              key={npc.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveNpc(npc);
              }}
              className="absolute transition-all duration-1000 cursor-pointer -translate-x-1/2 -translate-y-1/2 z-20 group gpu-accelerated"
              style={{ left: `${nx}px`, top: `${ny}px` }}
            >
              <div
                className={`absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white/95 px-2 py-0.5 text-[10px] md:text-[11px] font-bold text-berry shadow-xl border border-pink-300 transition-all ${
                  isSelected ? "opacity-100 scale-105" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                💬 {npc.speech}
              </div>

              <div className="absolute -bottom-1 left-1/2 h-3 w-8 -translate-x-1/2 rounded-full bg-black/40 blur-xs" />

              <div className="relative flex flex-col items-center">
                <div className="mb-0.5 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[8px] md:text-[9px] font-bold text-amber-300 shadow border border-amber-400/50 whitespace-nowrap">
                  {npc.name}
                </div>
                <div className="relative h-9 w-9 md:h-12 md:w-12 overflow-hidden rounded-full border-2 border-amber-400 shadow-lg group-hover:scale-110 transition-transform">
                  <img src={npc.avatar} alt={npc.name} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          );
        })}

        {/* 4 Main Zone Buildings */}
        {ZONES.map((z, idx) => {
          const zx = (z.x / 960) * mapBounds.w;
          const zy = (z.y / 600) * mapBounds.h;
          const unlocked = progress.unlocked[z.key] ?? false;
          const stars = progress.stars[z.key] ?? 0;
          const score = progress.scores[z.key] ?? 0;
          const isNear = Math.hypot(zx - playerPos.x, zy - playerPos.y) < 90;

          return (
            <div
              key={z.key}
              onClick={(e) => handleBuildingClick(z, e)}
              className={`absolute group cursor-pointer transition-all duration-300 -translate-x-1/2 -translate-y-1/2 z-10 gpu-accelerated ${
                unlocked ? "hover:scale-105" : "opacity-85"
              }`}
              style={{
                left: `${zx}px`,
                top: `${zy}px`,
              }}
            >
              {isNear && unlocked && (
                <div className="absolute inset-0 -m-4 rounded-full bg-pink-400/50 blur-md animate-ping" />
              )}

              <div
                className={`relative flex flex-col items-center justify-center rounded-3xl p-2.5 sm:p-3 md:p-3.5 text-center shadow-2xl transition-all border-3 md:border-4 ${
                  isNear
                    ? "border-pink-500 bg-white ring-6 ring-pink-400/50 scale-105"
                    : unlocked
                    ? "border-white/95 bg-white/90 backdrop-blur"
                    : "border-gray-400 bg-gray-200/90"
                }`}
              >
                <div className="relative h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 overflow-hidden rounded-2xl border-2 border-pink-300 shadow-md group-hover:rotate-3 transition-transform">
                  <img src={z.img} alt={z.name} className="h-full w-full object-cover" />
                  <div className="absolute top-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {z.emoji}
                  </div>
                </div>

                <div className="mt-1 font-black text-berry text-[11px] sm:text-xs md:text-sm whitespace-nowrap">
                  {z.name}
                </div>

                <div className="mt-0.5 flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-[11px] font-extrabold text-amber-600">
                  {unlocked ? (
                    <>
                      <span>{"⭐".repeat(stars) + "☆".repeat(3 - stars)}</span>
                      <span className="ml-0.5 text-muted-foreground font-semibold">({score})</span>
                    </>
                  ) : (
                    <span className="text-gray-500 font-normal">🔒 ล็อก</span>
                  )}
                </div>

                <div
                  className={`mt-1 rounded-full px-2 py-0.5 text-[8px] sm:text-[10px] md:text-xs font-extrabold text-white shadow ${
                    unlocked ? "bg-gradient-to-r " + z.tint : "bg-gray-400"
                  }`}
                >
                  {isNear ? "✨ เล่นเลย" : `ด่านที่ ${idx + 1}`}
                </div>
              </div>
            </div>
          );
        })}

        {/* 🧰 Protein Treasure Chests (4 Spawns) */}
        {CHESTS.map((chest) => {
          const cdUntil = chestCooldowns[chest.id] || 0;
          const isCooldown = cdUntil > nowTime;
          const remainSec = Math.max(0, Math.ceil((cdUntil - nowTime) / 1000));
          const mins = Math.floor(remainSec / 60);
          const secs = remainSec % 60;
          const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

          const chestPx = (chest.x / 960) * mapBounds.w;
          const chestPy = (chest.y / 600) * mapBounds.h;
          const dist = Math.hypot(playerPos.x - chest.x, playerPos.y - chest.y);
          const isNear = dist < 70;

          return (
            <div
              key={chest.id}
              onClick={() => handleOpenChest(chest)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-15 group ${
                isCooldown ? "opacity-75" : "hover:scale-115 active:scale-95"
              }`}
              style={{
                left: `${chestPx}px`,
                top: `${chestPy}px`,
              }}
            >
              {/* Glowing Energy Aura when Available */}
              {!isCooldown && (
                <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md animate-pulse group-hover:bg-amber-300/60" />
              )}

              <div className="relative flex flex-col items-center">
                {/* Chest Status Label Badge */}
                <div
                  className={`mb-1 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] md:text-[11px] font-black shadow-2xl border backdrop-blur-md whitespace-nowrap ${
                    isCooldown
                      ? "bg-slate-950/90 text-amber-300 border-amber-500/50"
                      : isNear
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-white animate-bounce"
                      : "bg-slate-900/90 text-amber-200 border-amber-400/60"
                  }`}
                >
                  {isCooldown ? (
                    <>
                      <span>⏳ คูลดาวน์</span>
                      <span className="font-mono text-amber-400">{timeStr}</span>
                    </>
                  ) : (
                    <>
                      <span>{chest.icon}</span>
                      <span>{isNear ? "✨ แตะเปิดกล่องสมบัติ!" : chest.name}</span>
                    </>
                  )}
                </div>

                {/* Chest Icon Asset */}
                <div
                  className={`relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border-2 text-2xl sm:text-3xl shadow-2xl transition-transform ${
                    isCooldown
                      ? "bg-slate-900/90 border-slate-700 text-slate-400"
                      : "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 border-white text-white drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                  }`}
                >
                  {isCooldown ? "🔒" : "🧰"}
                </div>
              </div>
            </div>
          );
        })}

        {/* Online Remote Players (Multiplayer) */}
        {remotePlayers.map((rp) => {
          const px = (rp.rx ?? 0.4) * mapBounds.w;
          const py = (rp.ry ?? 0.45) * mapBounds.h;
          const hasChat = rp.chatMsg && rp.chatTime && Date.now() - rp.chatTime < 6000;

          return (
            <div
              key={rp.id}
              className="absolute pointer-events-none z-20 gpu-accelerated transition-all duration-75 ease-linear"
              style={{
                transform: `translate3d(${px}px, ${py}px, 0) translate(-50%, -88%)`,
              }}
            >
              {/* Remote Player Speech Bubble */}
              {hasChat && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white/95 px-3 py-1.5 text-xs font-black text-slate-900 shadow-2xl border-2 border-pink-400 animate-bounce z-30">
                  💬 {rp.chatMsg}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-white border-b-2 border-r-2 border-pink-400" />
                </div>
              )}

              {/* Shadow */}
              <div className="absolute bottom-0 left-1/2 h-3.5 w-11 -translate-x-1/2 rounded-full bg-black/60 blur-xs" />

              {/* Remote Player Character Body */}
              <div className="relative flex flex-col items-center">
                {/* Name Tag */}
                <div className="mb-0.5 flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] md:text-[10px] font-black text-pink-300 shadow-xl border border-pink-500/40 whitespace-nowrap">
                  <span className="text-[8px] bg-pink-500/30 text-pink-200 px-1 rounded font-mono">ONLINE</span>
                  <span>{rp.name}</span>
                </div>

                {/* Character Avatar Circle */}
                <div
                  className={`relative h-11 w-11 md:h-13 md:w-13 overflow-hidden rounded-full border-2 border-pink-400 bg-white shadow-xl ${
                    rp.isMoving ? "animate-bounce" : ""
                  }`}
                >
                  <img src={rp.avatar || "/avatars/biologist_male.jpg"} alt={rp.name} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Player Avatar */}
        <div
          className="absolute pointer-events-none z-20 gpu-accelerated"
          style={{
            transform: `translate3d(${(playerPos.x / 960) * mapBounds.w}px, ${(playerPos.y / 600) * mapBounds.h}px, 0) translate(-50%, -88%)`,
          }}
        >
          <div className="absolute bottom-0 left-1/2 h-3.5 w-11 -translate-x-1/2 rounded-full bg-black/60 blur-xs" />

          <div className={`relative flex flex-col items-center ${isWalking ? "animate-bounce" : ""}`}>
            {/* Local Player Speech Bubble */}
            {myChat && Date.now() - myChat.time < 6000 && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white/95 px-3 py-1.5 text-xs font-black text-slate-900 shadow-2xl border-2 border-pink-400 animate-bounce z-40">
                💬 {myChat.msg}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-white border-b-2 border-r-2 border-pink-400" />
              </div>
            )}

            <div className="mb-0.5 rounded-full bg-berry px-2 py-0.5 text-[10px] md:text-xs font-black text-white shadow-xl border-2 border-white whitespace-nowrap">
              🧬 {playerName}
            </div>

            <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-18 md:w-18 overflow-hidden rounded-full border-3 md:border-4 border-white shadow-2xl ring-4 ring-pink-400/80">
              <img src={playerAvatar} alt="Player Character" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>

        {/* 💬 Live Multiplayer Chat Bar */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2 max-w-[260px] sm:max-w-sm md:max-w-md w-full"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendLocalChat(chatInput);
              }
            }}
            placeholder="💬 พิมพ์คุยกับเพื่อนในแมพ (กด Enter ส่ง)..."
            className="w-full rounded-2xl border-2 border-pink-400/60 bg-slate-950/90 px-3.5 py-2 text-xs font-bold text-white placeholder-slate-400 outline-none backdrop-blur-md focus:border-pink-400 focus:ring-2 focus:ring-pink-500/40 shadow-2xl"
          />
          <button
            onClick={() => handleSendLocalChat(chatInput)}
            className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-3.5 py-2 text-xs font-black text-white shadow-xl hover:scale-105 transition cursor-pointer border border-white/20 whitespace-nowrap"
          >
            ส่ง 💬
          </button>
        </div>
      </div>
    </div>

      {/* Daily Quest Log Modal */}
      {showQuestLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-soft max-w-md w-full p-6 relative border-4 border-amber-400 shadow-2xl">
            <button
              onClick={() => setShowQuestLog(false)}
              className="absolute right-3 top-3 text-xs font-bold text-muted-foreground hover:text-berry"
            >
              ✕ ปิด
            </button>

            <h2 className="text-xl font-black text-berry flex items-center gap-2">
              <span>📌</span> เควสต์ภารกิจประจำวัน (Daily Quests)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">ทำภารกิจวิชาการเพื่อสะสมดาวและคะแนนพิเศษในเมืองโปรตีน</p>

            <div className="mt-4 space-y-3">
              {[
                { title: "🧬 ภารกิจที่ 1: ต่อสายไดเปปไทด์ในสถาบันโครงสร้างชีวะ", reward: "+20 คะแนน", done: (progress.scores.structural ?? 0) > 0 },
                { title: "🎀 ภารกิจที่ 2: พับม้วนโปรตีน Alpha-helix ให้สมบูรณ์", reward: "+20 คะแนน", done: (progress.scores.folding ?? 0) > 0 },
                { title: "🧪 ภารกิจที่ 3: จับคู่เอนไซม์ลดพลังงานกระตุ้น Ea", reward: "+20 คะแนน", done: (progress.scores.enzyme ?? 0) > 0 },
                { title: "💗 ภารกิจที่ 4: วินิจฉัยอาการผู้ป่วยในโรงพยาบาลภูมิคุ้มกัน", reward: "+20 คะแนน", done: (progress.scores.immune ?? 0) > 0 },
              ].map((q, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between ${q.done ? "bg-emerald-50 border-emerald-300" : "bg-white border-amber-200"}`}>
                  <div>
                    <div className="text-xs font-bold text-berry">{q.title}</div>
                    <div className="text-[10px] text-amber-700 font-semibold">{q.reward}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.done ? "bg-emerald-200 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {q.done ? "✓ สำเร็จ" : "กำลังทำ"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MMORPG Player Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-soft max-w-lg w-full p-6 relative border-4 border-amber-400 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute right-3 top-3 text-xs font-bold text-muted-foreground hover:text-berry"
            >
              ✕ ปิด
            </button>

            <h2 className="text-xl font-black text-berry flex items-center gap-2">
              <span>🏆</span> ตารางอันดับผู้เล่น (Leaderboard)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">รายชื่อนักชีววิทยาชั้นนำแห่ง Protein World MMORPG</p>

            <div className="mt-4 space-y-2">
              {plays.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">ยังไม่มีสถิติการเล่น เริ่มเข้าเล่นเพื่อสร้างสถิติคนแรก!</div>
              ) : (
                plays.slice(0, 10).map((log, rank) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-pink-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base w-6 text-center text-amber-600">
                        {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-berry">{log.player}</div>
                        <div className="text-[10px] text-muted-foreground">โซน: {log.zone} · ⭐ {log.stars} ดาว</div>
                      </div>
                    </div>
                    <div className="font-black text-sm text-pink-600">💎 {log.score} คะแนน</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* NPC Dialogue Box Modal */}
      {activeNpc && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md w-full px-2 animate-in slide-in-from-bottom-5 duration-200">
          <div className="card-soft p-3.5 border-3 border-amber-400 shadow-2xl relative flex items-center gap-3 bg-white/95 backdrop-blur">
            <button
              onClick={() => setActiveNpc(null)}
              className="absolute right-2 top-2 text-xs font-bold text-muted-foreground hover:text-berry"
            >
              ✕ ปิด
            </button>
            <img src={activeNpc.avatar} alt={activeNpc.name} className="h-12 w-12 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-amber-700">{activeNpc.role}</div>
              <h3 className="text-sm font-black text-berry">{activeNpc.name}</h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-foreground font-semibold leading-snug">
                "{activeNpc.speech}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Character Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-soft max-w-lg w-full p-4 sm:p-6 relative border-4 border-pink-400 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowAvatarPicker(null as any)}
              className="absolute right-3 top-3 h-7 w-7 rounded-full bg-pink-100 text-berry hover:bg-pink-200 font-black text-sm flex items-center justify-center transition"
            >
              ✕
            </button>

            <h2 className="text-lg sm:text-2xl font-black text-berry flex items-center gap-2">
              <span>👤</span> เลือกตัวละครนักชีววิทยา
            </h2>
            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
              เลือกโมเดลตัวละครนักชีววิทยา หรืออัปโหลดรูปภาพของคุณเองเพื่อใช้เป็นตัวละครบนแผนที่
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => {
                    setPlayerAvatar(av.img);
                    setShowAvatarPicker(false);
                  }}
                  className={`rounded-2xl p-2 text-center border-2 transition-all ${
                    playerAvatar === av.img
                      ? "border-pink-500 bg-pink-100/80 ring-3 ring-pink-300 font-bold scale-105"
                      : "border-pink-200 bg-white hover:bg-pink-50"
                  }`}
                >
                  <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-full border-2 border-pink-300 shadow">
                    <img src={av.img} alt={av.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-1 text-[11px] font-bold text-berry leading-tight">{av.name}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-pink-200 pt-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomAvatarUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full justify-center shadow-lg text-xs py-2.5"
              >
                📁 อัปโหลดรูปตัวละครของคุณเอง (Custom Avatar Upload)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Zone Popup Modal */}
      {activeZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-soft max-w-md sm:max-w-lg w-full p-4 sm:p-6 relative border-4 border-pink-400 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={handleCloseZoneModal}
              className="absolute right-3 top-3 h-7 w-7 rounded-full bg-pink-100 text-berry hover:bg-pink-200 font-black text-sm flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 sm:h-18 sm:w-18 overflow-hidden rounded-2xl border-2 border-pink-400 shadow-md shrink-0">
                <img src={activeZone.img} alt={activeZone.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-black text-berry uppercase tracking-wider">
                  มินิเกมชีววิทยา ม.4 {activeZone.emoji}
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-berry">{activeZone.name}</h2>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground bg-pink-50/80 rounded-2xl p-3 border border-pink-200">
              {activeZone.blurb}
            </p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3 border border-pink-300 shadow-xs">
              <div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground font-bold">ผลการเล่นของคุณ</div>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="text-base sm:text-lg">
                    {"⭐".repeat(progress.stars[activeZone.key] ?? 0)}
                    {"☆".repeat(3 - (progress.stars[activeZone.key] ?? 0))}
                  </span>
                  <span className="font-black text-berry text-xs sm:text-base">
                    {progress.scores[activeZone.key] ?? 0} คะแนน
                  </span>
                </div>
              </div>

              {progress.unlocked[activeZone.key] ? (
                <button
                  onClick={() => nav({ to: activeZone.path })}
                  className="btn-primary text-xs sm:text-sm shadow-xl px-4 py-2"
                >
                  🚀 เข้าเล่นมินิเกม
                </button>
              ) : (
                <div className="rounded-full bg-gray-200 px-3 py-1 text-[10px] font-bold text-gray-500">
                  🔒 ล็อก
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}