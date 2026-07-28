import { useEffect, useState, useCallback } from "react";
import { defaultData, type GameData, type Progress, type KahootQ, type ZoneKey } from "./game-data";

// ─────────────── Keys for localStorage (per-device data) ───────────────
const PROGRESS_KEY = "pw:progress:v1";
const ADMIN_KEY = "pw:admin:v1";
const AVATAR_KEY = "pw:avatar:v1";
const PLAYER_NAME_KEY = "pw:player_name:v1";
const ADMIN_PW_CACHE_KEY = "pw:admin_pw:v1";

export type PlayLog = {
  id: string;
  player: string;
  zone: string;
  score: number;
  total: number;
  stars: number;
  at: number;
};

// ─────────────── localStorage helpers (per-device only) ───────────────

function readLocal<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}

function writeLocal<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("pw:sync", { detail: k }));
}

// ─────────────── API helpers (server-side D1/KV) ───────────────

async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

let localGameDataCache: GameData | null = null;
let lastSaveTimestamp = 0;

// ─────────────── Direct D1 CRUD Helper Functions ───────────────

export async function addQuestionD1(zone: ZoneKey, question: KahootQ): Promise<GameData | null> {
  lastSaveTimestamp = Date.now();
  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone, question }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.data) {
        localGameDataCache = payload.data;
        window.dispatchEvent(new CustomEvent("pw:data-updated", { detail: payload.data }));
        return payload.data;
      }
    }
  } catch (err) {
    console.error("addQuestionD1 error:", err);
  }
  return null;
}

export async function deleteQuestionD1(id: string): Promise<GameData | null> {
  lastSaveTimestamp = Date.now();
  try {
    const res = await fetch("/api/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.data) {
        localGameDataCache = payload.data;
        window.dispatchEvent(new CustomEvent("pw:data-updated", { detail: payload.data }));
        return payload.data;
      }
    }
  } catch (err) {
    console.error("deleteQuestionD1 error:", err);
  }
  return null;
}

export async function updateQuestionD1(id: string, zone: ZoneKey | "chest", question: KahootQ): Promise<GameData | null> {
  lastSaveTimestamp = Date.now();
  try {
    const res = await fetch("/api/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, zone, question }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.data) {
        localGameDataCache = payload.data;
        window.dispatchEvent(new CustomEvent("pw:data-updated", { detail: payload.data }));
        return payload.data;
      }
    }
  } catch (err) {
    console.error("updateQuestionD1 error:", err);
  }
  return null;
}

export async function addChestQuestionD1(question: KahootQ): Promise<GameData | null> {
  lastSaveTimestamp = Date.now();
  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone: "chest", question }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.data) {
        localGameDataCache = payload.data;
        window.dispatchEvent(new CustomEvent("pw:data-updated", { detail: payload.data }));
        return payload.data;
      }
    }
  } catch (err) {
    console.error("addChestQuestionD1 error:", err);
  }
  return null;
}

// ─────────────── useGameData — reads/writes from D1 Database ───────────────

export function useGameData(): [GameData, (d: GameData) => void] {
  const [data, setData] = useState<GameData>(() => localGameDataCache || defaultData);

  useEffect(() => {
    // Initial fetch
    fetchApi<GameData>("/api/game-data", defaultData).then((d) => {
      if (d && Date.now() - lastSaveTimestamp > 5000) {
        localGameDataCache = d;
        setData(d);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setData(e.detail);
      }
    };
    window.addEventListener("pw:data-updated", handleUpdate);

    // Auto-sync polling every 5 seconds
    const interval = setInterval(() => {
      if (Date.now() - lastSaveTimestamp < 5000) return;

      fetchApi<GameData>("/api/game-data", defaultData).then((d) => {
        if (d && Date.now() - lastSaveTimestamp > 5000) {
          localGameDataCache = d;
          setData((prev) => (JSON.stringify(prev) !== JSON.stringify(d) ? d : prev));
        }
      });
    }, 5000);

    return () => {
      window.removeEventListener("pw:data-updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const save = useCallback(
    async (d: GameData) => {
      lastSaveTimestamp = Date.now();
      localGameDataCache = d;
      setData(d); // Optimistic UI update

      const password =
        readLocal<string>(ADMIN_PW_CACHE_KEY, "") || d.settings?.adminPassword || "protein123";

      try {
        const res = await fetch("/api/game-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: d, password }),
        });

        if (res.ok) {
          writeLocal(ADMIN_PW_CACHE_KEY, d.settings?.adminPassword || password);
        } else {
          console.error("Save to D1 failed with status:", res.status);
        }
      } catch (err) {
        console.error("Save to D1 error:", err);
      }
    },
    [],
  );

  return [data, save];
}

// ─────────────── usePlays — reads/writes from D1 Database ───────────────

export function usePlays(): [PlayLog[], (l: PlayLog[]) => void] {
  const [list, setList] = useState<PlayLog[]>([]);

  const refreshPlays = useCallback(() => {
    fetchApi<PlayLog[]>("/api/plays", []).then(setList);
  }, []);

  useEffect(() => {
    refreshPlays();

    const interval = setInterval(refreshPlays, 5000);
    return () => clearInterval(interval);
  }, [refreshPlays]);

  const save = useCallback(async (l: PlayLog[]) => {
    setList(l);
    if (l.length === 0) {
      try {
        await fetch("/api/plays", { method: "DELETE" });
      } catch {}
    }
  }, []);

  return [list, save];
}

// ─────────────── useProgress — stays in localStorage (per-device) ───────────────

export function useProgress(): [Progress, (p: Progress) => void] {
  const [p, setP] = useState<Progress>({ scores: {}, stars: {}, unlocked: { structural: true } });
  useEffect(() => {
    setP(readLocal<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } }));
    const h = () => setP(readLocal<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } }));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((n: Progress) => {
    writeLocal(PROGRESS_KEY, n);
    setP(n);
  }, []);
  return [p, save];
}

// ─────────────── usePlayerAvatar — stays in localStorage (per-device) ───────────────

export function usePlayerAvatar(): [string, (url: string) => void] {
  const [avatar, setAvatar] = useState<string>("/avatars/biologist_male.jpg");
  useEffect(() => {
    setAvatar(readLocal<string>(AVATAR_KEY, "/avatars/biologist_male.jpg"));
    const h = () => setAvatar(readLocal<string>(AVATAR_KEY, "/avatars/biologist_male.jpg"));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((url: string) => {
    writeLocal(AVATAR_KEY, url);
    setAvatar(url);
  }, []);
  return [avatar, save];
}

// ─────────────── usePlayerName — stays in localStorage (per-device) ───────────────

export function usePlayerName(): [string, (name: string) => void] {
  const [name, setName] = useState<string>("นักชีววิทยาฝึกหัด");
  useEffect(() => {
    setName(readLocal<string>(PLAYER_NAME_KEY, "นักชีววิทยาฝึกหัด"));
    const h = () => setName(readLocal<string>(PLAYER_NAME_KEY, "นักชีววิทยาฝึกหัด"));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((n: string) => {
    writeLocal(PLAYER_NAME_KEY, n);
    setName(n);
  }, []);
  return [name, save];
}

export function getCurrentPlayerName(): string {
  return readLocal<string>(PLAYER_NAME_KEY, "นักชีววิทยาฝึกหัด");
}

// ─────────────── logPlay ───────────────

export async function logPlay(entry: Omit<PlayLog, "id" | "at">) {
  const item: PlayLog = { ...entry, id: crypto.randomUUID(), at: Date.now() };
  try {
    await fetch("/api/plays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {}
}

// ─────────────── recordResult ───────────────

export function recordResult(zone: keyof Progress["scores"], score: number, stars: number) {
  const prog = readLocal<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } });
  const prev = prog.scores[zone] ?? 0;
  prog.scores[zone] = Math.max(prev, score);
  prog.stars[zone] = Math.max(prog.stars[zone] ?? 0, stars);
  const order: (keyof Progress["scores"])[] = ["structural", "folding", "enzyme", "immune"];
  const idx = order.indexOf(zone);
  if (stars >= 1 && idx >= 0 && idx < order.length - 1) prog.unlocked[order[idx + 1]] = true;
  writeLocal(PROGRESS_KEY, prog);
}

// ─────────────── Admin auth ───────────────

export function isAdminLoggedIn(): boolean {
  return readLocal<boolean>(ADMIN_KEY, false);
}

export function setAdminLoggedIn(v: boolean) {
  writeLocal(ADMIN_KEY, v);
}

// ─────────────── resetAll ───────────────

export function resetAll() {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(AVATAR_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
  localStorage.removeItem(ADMIN_PW_CACHE_KEY);
  window.dispatchEvent(new CustomEvent("pw:sync"));
}

// ─────────────── Export JSON ───────────────

export function exportGameDataJSON(data: GameData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `protein-world-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────── Cache admin password on login ───────────────

export function cacheAdminPassword(pw: string) {
  writeLocal(ADMIN_PW_CACHE_KEY, pw);
}