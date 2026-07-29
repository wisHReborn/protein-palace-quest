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
  { id: "chest_1", name: "กล่อง", x: 480, y: 140, icon: "🧰" },
  { id: "chest_2", name: "กล่อง", x: 330, y: 320, icon: "🎁" },
  { id: "chest_3", name: "กล่อง", x: 630, y: 320, icon: "📦" },
  { id: "chest_4", name: "กล่อง", x: 480, y: 480, icon: "💎" },
];

function TreasureChest3DSVG({ isCooldown }: { isCooldown: boolean }) {
  if (isCooldown) {
    return (
      <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="rgba(0,0,0,0.5)" />
        <path d="M20 45 L80 45 L75 80 L25 80 Z" fill="url(#coolBaseGrad)" stroke="#334155" strokeWidth="3" />
        <path d="M15 35 Q50 20 85 35 L80 48 L20 48 Z" fill="url(#coolLidGrad)" stroke="#334155" strokeWidth="3" />
        <rect x="32" y="36" width="6" height="42" fill="#475569" />
        <rect x="62" y="36" width="6" height="42" fill="#475569" />
        <rect x="44" y="44" width="12" height="14" rx="3" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
        <circle cx="50" cy="51" r="2.5" fill="#1e293b" />
        <defs>
          <linearGradient id="coolBaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="coolLidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg className="w-full h-full filter drop-shadow-[0_10px_16px_rgba(245,158,11,0.8)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="url(#goldGlow)" opacity="0.7" />
      <ellipse cx="50" cy="85" rx="38" ry="10" fill="rgba(0,0,0,0.6)" />
      <path d="M18 45 L82 45 L76 82 L24 82 Z" fill="url(#chestBodyGrad)" stroke="#78350f" strokeWidth="3" />
      <line x1="20" y1="58" x2="80" y2="58" stroke="#92400e" strokeWidth="2" />
      <line x1="22" y1="70" x2="78" y2="70" stroke="#92400e" strokeWidth="2" />
      <path d="M14 34 Q50 15 86 34 L82 48 L18 48 Z" fill="url(#chestLidGrad)" stroke="#78350f" strokeWidth="3" />
      <path d="M18 45 L26 45 L24 82 L18 82 Z" fill="url(#goldGrad)" />
      <path d="M82 45 L74 45 L76 82 L82 82 Z" fill="url(#goldGrad)" />
      <rect x="32" y="32" width="7" height="48" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
      <rect x="61" y="32" width="7" height="48" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
      <rect x="42" y="42" width="16" height="18" rx="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="2" />
      <polygon points="50,46 55,51 50,56 45,51" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="50" cy="51" r="1.5" fill="#ffffff" />
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="chestBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="chestLidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OverworldMapPage() {
  const [progress, saveProgress] = useProgress();
  const [playerAvatar, setPlayerAvatar] = usePlayerAvatar();
  const [playerName] = usePlayerName();
  const [plays] = usePlays();
  const [gameData] = useGameData();
  const nav = useNavigate();

  // Modals & UI States
  const [activeZone, setActiveZone] = useState<(typeof ZONES)[number] | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);

  // Protein Treasure Chests State
  const [chestCooldowns, setChestCooldowns] = useState<Record<string, number>>({});
  const [dismissedCooldowns, setDismissedCooldowns] = useState<Record<string, number>>({});
  const [assignedChestQuestions, setAssignedChestQuestions] = useState<Record<string, KahootQ>>({});
  const [activeChest, setActiveChest] = useState<{ chest: ChestItem; question: KahootQ } | null>(null);
  const [selectedChestOption, setSelectedChestOption] = useState<number | null>(null);
  const [chestAnswered, setChestAnswered] = useState<{ isCorrect: boolean; rewardPoints: number } | null>(null);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Audio, Viewport & Weather States
  type WeatherMode = "day" | "sunset" | "night" | "rain";
  const [weatherMode, setWeatherMode] = useState<WeatherMode>("day");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [mapBounds, setMapBounds] = useState({ w: 1200, h: 800 });

  // Player position state
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 480, y: 350 });
  const [isWalking, setIsWalking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Multiplayer Chat State
  const [chatInput, setChatInput] = useState("");

  // Touch / Click & Refs
  const [clickMarker, setClickMarker] = useState<{ x: number; y: number; id: number } | null>(null);
  const dpadDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const targetBuildingKeyRef = useRef<string | null>(null);
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 480, y: 350 });
  const lastClosedZoneRef = useRef<string | null>(null);
  const lastClosedChestRef = useRef<string | null>(null);
  const closedChestPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Load chest cooldowns from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
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

  const handleCloseChest = () => {
    if (activeChest) {
      const cId = activeChest.chest.id;
      lastClosedChestRef.current = cId;
      closedChestPosRef.current = { x: playerPosRef.current.x, y: playerPosRef.current.y };
      // Set 15s temporary dismissal cooldown so walking away never re-triggers the modal
      setDismissedCooldowns((prev) => ({
        ...prev,
        [cId]: Date.now() + 15000,
      }));
    }
    setActiveChest(null);
    setSelectedChestOption(null);
    setChestAnswered(null);
  };

  const handleOpenChest = (chest: ChestItem) => {
    const cd1 = chestCooldowns[chest.id] || 0;
    const cd2 = dismissedCooldowns[chest.id] || 0;
    const cdUntil = Math.max(cd1, cd2);
    if (cdUntil > Date.now()) return;

    const qPool = (gameData?.chestQuestions && gameData.chestQuestions.length > 0)
      ? gameData.chestQuestions
      : defaultData.chestQuestions;

    if (!qPool || qPool.length === 0) return;

    // Gather question IDs/prompts currently assigned to OTHER chests on the map
    const otherUsedQIds = new Set(
      Object.entries(assignedChestQuestions)
        .filter(([cId]) => cId !== chest.id)
        .map(([_, q]) => q.id || q.prompt)
    );

    // Filter available pool to prevent duplicate questions on the map
    const availablePool = qPool.filter((q) => !otherUsedQIds.has(q.id || q.prompt));
    const poolToUse = availablePool.length > 0 ? availablePool : qPool;

    const randomQ = poolToUse[Math.floor(Math.random() * poolToUse.length)];
    if (!randomQ || !randomQ.prompt || !randomQ.options) return;

    // Record the assigned question for this chest
    setAssignedChestQuestions((prev) => ({ ...prev, [chest.id]: randomQ }));

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
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pw_chest_cooldowns", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Auto-Trigger Quiz Modal on Walking Collision / Proximity (เปิดกล่องเมื่อตัวละครเดินเข้าใกล้กล่อง dist <= 55)
  useEffect(() => {
    if (activeChest || activeZone || showQuestLog || showLeaderboard || showAvatarPicker || activeNpc) return;

    for (const chest of CHESTS) {
      const cd1 = chestCooldowns[chest.id] || 0;
      const cd2 = dismissedCooldowns[chest.id] || 0;
      const cdUntil = Math.max(cd1, cd2);
      const dist = Math.hypot(playerPos.x - chest.x, playerPos.y - chest.y);

      if (dist <= 55) {
        if (cdUntil <= Date.now() && lastClosedChestRef.current !== chest.id) {
          handleOpenChest(chest);
          break;
        }
      } else if (dist > 85) {
        if (lastClosedChestRef.current === chest.id) {
          lastClosedChestRef.current = null;
        }
      }
    }
  }, [playerPos, chestCooldowns, dismissedCooldowns, activeChest, activeZone, showQuestLog, showLeaderboard, showAvatarPicker, activeNpc]);

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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check building collision (virtual bounds)
  const checkBuildingCollision = useCallback(
    (px: number, py: number) => {
      if (activeChest || activeZone || showQuestLog || showLeaderboard || showAvatarPicker || activeNpc) return;

      for (const z of ZONES) {
        const dist = Math.hypot(z.x - px, (z.y + 35) - py);

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
    [progress.unlocked, activeChest, activeZone, showQuestLog, showLeaderboard, showAvatarPicker, activeNpc]
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

  // Check Chest Proximity & Real-time Walking Collision (Auto-Open on reach)
  const checkChestCollision = useCallback(
    (px: number, py: number) => {
      if (activeChest || activeZone || showQuestLog || showLeaderboard || showAvatarPicker || activeNpc) return;

      for (const chest of CHESTS) {
        const cd1 = chestCooldowns[chest.id] || 0;
        const cd2 = dismissedCooldowns[chest.id] || 0;
        const cdUntil = Math.max(cd1, cd2);
        const dist = Math.hypot(px - chest.x, py - chest.y);

        if (dist <= 55) {
          if (cdUntil <= Date.now() && lastClosedChestRef.current !== chest.id) {
            handleOpenChest(chest);
            break;
          }
        } else if (dist > 85) {
          if (lastClosedChestRef.current === chest.id) {
            lastClosedChestRef.current = null;
          }
        }
      }
    },
    [activeChest, activeZone, showQuestLog, showLeaderboard, showAvatarPicker, activeNpc, chestCooldowns]
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

      // Check chest collision on every frame (whether walking or arriving)
      checkChestCollision(nx, ny);

      setIsWalking(moving);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [checkBuildingCollision, checkNpcProximity, checkChestCollision]);

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

  function handleChestClick(chest: ChestItem, e: React.MouseEvent) {
    e.stopPropagation();
    const cdUntil = chestCooldowns[chest.id] || 0;
    if (cdUntil > Date.now()) return;

    const dist = Math.hypot(playerPos.x - chest.x, playerPos.y - chest.y);
    if (dist < 45) {
      handleOpenChest(chest);
    } else {
      lastClosedChestRef.current = null;
      targetPosRef.current = { x: chest.x, y: chest.y };
      setClickMarker({ x: chest.x, y: chest.y, id: Date.now() });

      setActiveZone(null);
      setActiveNpc(null);
    }
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
      <header className="absolute top-2.5 left-2.5 right-2.5 z-30 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] sm:text-xs md:text-sm font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition whitespace-nowrap"
          >
            ← <span className="hidden sm:inline">หน้าหลัก</span>
          </Link>

          <button
            onClick={() => setShowAvatarPicker(true)}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] sm:text-xs font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition border border-pink-300 whitespace-nowrap"
          >
            <img src={playerAvatar} alt="Avatar" className="h-4 w-4 rounded-full object-cover border border-berry" />
            <span className="max-w-[65px] sm:max-w-[120px] truncate">👤 {playerName}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pointer-events-auto flex-wrap">
          <button
            onClick={() => setShowQuestLog(true)}
            className="flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2 py-1 text-[10px] sm:text-xs font-black shadow-lg hover:bg-amber-300 transition whitespace-nowrap"
          >
            📌 <span className="hidden sm:inline">ภารกิจ</span>เควสต์
          </button>

          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] sm:text-xs font-black text-amber-600 shadow-lg backdrop-blur hover:bg-white transition whitespace-nowrap"
          >
            🏆 <span className="hidden sm:inline">อันดับ</span>
          </button>

          {/* Online Players Counter */}
          <div className="flex items-center gap-1 rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] sm:text-xs font-black text-emerald-400 border border-emerald-500/40 shadow-lg backdrop-blur animate-pulse whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>🟢 {remotePlayers.length + 1}<span className="hidden sm:inline"> คน</span></span>
          </div>

          <div className="flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1 text-[10px] sm:text-xs font-black text-amber-600 shadow-lg backdrop-blur">
            ⭐ {totalStars}
          </div>

          <div className="flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1 text-[10px] sm:text-xs font-black text-berry shadow-lg backdrop-blur">
            💎 {totalScore}
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="flex items-center justify-center rounded-full bg-white/95 h-6 w-6 sm:h-7 sm:w-7 text-[10px] sm:text-xs font-extrabold text-berry shadow-lg backdrop-blur hover:bg-white transition"
            title="สลับเต็มหน้าจอ Fullscreen"
          >
            {isFullscreen ? "🔲" : "🖥️"}
          </button>
        </div>
      </header>

      {/* Compact Circular RPG Music Toggle & Weather Controls */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        {/* ☀️🌅🌙🌧️ Floating Weather & Ambient Controls */}
        <div className="flex items-center gap-1 rounded-full bg-slate-900/90 p-1 border-2 border-pink-400/50 shadow-2xl backdrop-blur-md">
          {(
            [
              { mode: "day", label: "☀️", fullLabel: "☀️ กลางวัน", title: "กลางวัน สว่างแจ่มใส" },
              { mode: "sunset", label: "🌅", fullLabel: "🌅 ยามเย็น", title: "อาทิตย์อัสดง สีส้มอบอุ่น" },
              { mode: "night", label: "🌙", fullLabel: "🌙 ราตรี", title: "ราตรีเรืองแสง Bioluminescence" },
              { mode: "rain", label: "🌧️", fullLabel: "🌧️ ฝนตก", title: "ฝนตกโมเลกุลน้ำ" },
            ] as const
          ).map((item) => (
            <button
              key={item.mode}
              onClick={() => setWeatherMode(item.mode)}
              title={item.title}
              className={`rounded-full px-2 py-1 text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                weatherMode === item.mode
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md scale-105"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="sm:hidden">{item.label}</span>
              <span className="hidden sm:inline">{item.fullLabel}</span>
            </button>
          ))}
        </div>

        <button
          onClick={toggleMusic}
          className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full text-lg sm:text-xl shadow-2xl backdrop-blur transition-all border-2 ${
            isMusicPlaying
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-white ring-4 ring-pink-400/50 scale-105"
              : "bg-white/95 text-berry border-pink-300 hover:bg-white"
          }`}
          title={isMusicPlaying ? "ปิดเพลงประกอบ RPG" : "เปิดเพลงประกอบ RPG"}
        >
          {isMusicPlaying ? "🎵" : "🔇"}
        </button>
      </div>

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

        {/* ☀️🌅🌙🌧️ Dynamic Time of Day & Weather Tint Overlay */}
        {weatherMode === "sunset" && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/35 via-rose-500/25 to-purple-950/40 mix-blend-color-burn pointer-events-none z-10 transition-all duration-700 animate-sunset-glow" />
        )}
        {weatherMode === "night" && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-purple-950/65 to-slate-950/85 mix-blend-multiply pointer-events-none z-10 transition-all duration-700" />
        )}
        {weatherMode === "rain" && (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-cyan-950/50 mix-blend-multiply pointer-events-none z-10 transition-all duration-700" />
        )}

        {/* 🌧️ Dynamic Falling Raindrops Overlay */}
        {weatherMode === "rain" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-15">
            {Array.from({ length: 30 }).map((_, idx) => (
              <div
                key={idx}
                className="absolute w-0.5 h-12 bg-gradient-to-b from-cyan-200/80 to-transparent rounded-full animate-rain-drop"
                style={{
                  left: `${(idx / 30) * 100}%`,
                  top: `${-20 - (idx % 8) * 15}px`,
                  animationDuration: `${0.6 + (idx % 5) * 0.15}s`,
                  animationDelay: `${(idx % 10) * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* 🌙 Bioluminescent Peptide Glow Particles (Night Mode) */}
        {weatherMode === "night" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-15">
            {[
              { x: 0.18, y: 0.2, color: "bg-cyan-400 shadow-cyan-400" },
              { x: 0.82, y: 0.22, color: "bg-pink-400 shadow-pink-400" },
              { x: 0.5, y: 0.35, color: "bg-amber-300 shadow-amber-300" },
              { x: 0.25, y: 0.65, color: "bg-teal-300 shadow-teal-300" },
              { x: 0.75, y: 0.68, color: "bg-rose-400 shadow-rose-400" },
              { x: 0.48, y: 0.78, color: "bg-purple-300 shadow-purple-300" },
              { x: 0.12, y: 0.85, color: "bg-cyan-300 shadow-cyan-300" },
              { x: 0.88, y: 0.82, color: "bg-emerald-300 shadow-emerald-300" },
            ].map((p, idx) => (
              <div
                key={idx}
                className={`absolute h-3 w-3 rounded-full ${p.color} shadow-lg blur-[1px] animate-bio-pulse`}
                style={{
                  left: `${p.x * mapBounds.w}px`,
                  top: `${p.y * mapBounds.h}px`,
                  animationDelay: `${idx * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

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
          const cd1 = chestCooldowns[chest.id] || 0;
          const cd2 = dismissedCooldowns[chest.id] || 0;
          const cdUntil = Math.max(cd1, cd2);
          const isCooldown = cdUntil > nowTime;
          const remainSec = Math.max(0, Math.ceil((cdUntil - nowTime) / 1000));
          const mins = Math.floor(remainSec / 60);
          const secs = remainSec % 60;
          const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

          const chestPx = (chest.x / 960) * mapBounds.w;
          const chestPy = (chest.y / 600) * mapBounds.h;
          const dist = Math.hypot(playerPos.x - chest.x, playerPos.y - chest.y);
          const isNear = dist < 65;

          return (
            <div
              key={chest.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-35 pointer-events-none ${
                isCooldown ? "opacity-80" : ""
              }`}
              style={{
                left: `${chestPx}px`,
                top: `${chestPy}px`,
              }}
            >
              {/* Glowing Golden Aura Ring */}
              {!isCooldown && (
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 blur-lg opacity-80 animate-pulse group-hover:opacity-100" />
              )}

              <div className="relative flex flex-col items-center">
                {/* Chest Status Label Badge (Only show when in cooldown or when walking near) */}
                {(isCooldown || isNear) && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCooldown) {
                        lastClosedChestRef.current = null;
                        handleOpenChest(chest);
                      }
                    }}
                    className={`mb-1.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-black shadow-2xl border-2 backdrop-blur-md whitespace-nowrap transition-transform pointer-events-auto cursor-pointer ${
                      isCooldown
                        ? "bg-slate-950/95 text-amber-300 border-amber-500/60"
                        : "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 border-white scale-110 animate-bounce shadow-amber-500/50 hover:scale-125"
                    }`}
                  >
                    {isCooldown ? (
                      <>
                        <span className="text-base">⏳</span>
                        <span>คูลดาวน์</span>
                        <span className="font-mono text-amber-300 font-bold">{timeStr}</span>
                      </>
                    ) : (
                      <span>✨ เปิดกล่อง</span>
                    )}
                  </div>
                )}

                {/* 3D Chest Icon */}
                <div
                  className={`relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center transition-all ${
                    isCooldown ? "scale-90 opacity-80" : "group-hover:scale-110 group-hover:rotate-3"
                  }`}
                >
                  <TreasureChest3DSVG isCooldown={isCooldown} />
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
          <div className="card-soft max-w-md w-full p-4 sm:p-6 relative border-4 border-amber-400 shadow-2xl max-h-[85vh] overflow-y-auto">
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
          <div className="card-soft max-w-lg w-full p-4 sm:p-6 relative border-4 border-amber-400 shadow-2xl max-h-[85vh] overflow-y-auto">
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

      {/* 🧰 Protein Treasure Chest Quiz Modal */}
      {activeChest && activeChest.question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border-3 border-amber-400 bg-slate-950 p-4 sm:p-6 md:p-8 shadow-2xl shadow-amber-500/20 text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseChest}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl border border-amber-400/50">
                🧰
              </div>
              <div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  {activeChest.chest?.name || "กล่องสมบัติชีววิทยาโปรตีน"}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">โจทย์ปริศนาโปรตีนรับของรางวัล</h3>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-4 border border-amber-500/30 text-sm sm:text-base font-bold text-amber-100 leading-relaxed shadow-inner">
              {activeChest.question.prompt}
            </div>

            {/* 4 Kahoot-Style Choices */}
            <div className="grid gap-2.5">
              {activeChest.question.options?.map((opt, idx) => {
                const colors = [
                  "bg-red-950/80 hover:bg-red-900 border-red-500/50 text-red-100",
                  "bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-100",
                  "bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-100",
                  "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-100",
                ];
                const badges = ["🔴 A", "🔷 B", "🟡 C", "🟢 D"];

                const isSelected = selectedChestOption === idx;
                const isCorrect = idx === activeChest.question.correctIndex;

                let styleClass = colors[idx % 4];
                if (selectedChestOption !== null) {
                  if (isCorrect) styleClass = "bg-emerald-900 border-2 border-emerald-400 text-white font-black scale-102";
                  else if (isSelected) styleClass = "bg-rose-950 border-2 border-rose-500 text-rose-200 opacity-80";
                  else styleClass = "bg-slate-900/50 border-slate-800 text-slate-500 opacity-40";
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedChestOption !== null}
                    onClick={() => handleAnswerChest(idx)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-xs sm:text-sm font-bold text-left transition-all cursor-pointer ${styleClass}`}
                  >
                    <span className="font-mono font-black text-sm shrink-0">{badges[idx % 4]}</span>
                    <span className="flex-1">{opt}</span>
                    {selectedChestOption !== null && isCorrect && <span>✅</span>}
                    {selectedChestOption !== null && isSelected && !isCorrect && <span>❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Explanation */}
            {chestAnswered && (
              <div className={`rounded-2xl p-4 border text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 ${
                chestAnswered.isCorrect ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" : "bg-rose-950/90 border-rose-500/50 text-rose-200"
              }`}>
                <div className="font-black text-sm flex items-center justify-between">
                  <span>{chestAnswered.isCorrect ? "🎉 ตอบถูกต้อง! เปิดกล่องสำเร็จ" : "❌ ตอบยังไม่ถูกต้อง"}</span>
                  {chestAnswered.isCorrect && <span className="text-amber-300 font-mono text-base">+50 คะแนน 💎</span>}
                </div>
                <p className="leading-relaxed opacity-90">{activeChest.question.explanation}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCloseChest}
                    className="rounded-xl bg-amber-500 text-slate-950 px-5 py-2 text-xs font-black hover:bg-amber-400 transition cursor-pointer shadow-lg"
                  >
                    รับทราบ (ปิดกล่อง) ⏳
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}