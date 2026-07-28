import { useEffect, useState, useCallback } from "react";
import { defaultData, type GameData, type Progress } from "./game-data";

const DATA_KEY = "pw:data:v1";
const PROGRESS_KEY = "pw:progress:v1";
const PLAYS_KEY = "pw:plays:v1";
const ADMIN_KEY = "pw:admin:v1";

export type PlayLog = {
  id: string;
  player: string;
  zone: string;
  score: number;
  total: number;
  stars: number;
  at: number;
};

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("pw:sync", { detail: k }));
}

export function useGameData(): [GameData, (d: GameData) => void] {
  const [data, setData] = useState<GameData>(defaultData);
  useEffect(() => {
    setData(read<GameData>(DATA_KEY, defaultData));
    const h = () => setData(read<GameData>(DATA_KEY, defaultData));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((d: GameData) => {
    write(DATA_KEY, d);
    setData(d);
  }, []);
  return [data, save];
}

export function useProgress(): [Progress, (p: Progress) => void] {
  const [p, setP] = useState<Progress>({ scores: {}, stars: {}, unlocked: { structural: true } });
  useEffect(() => {
    setP(read<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } }));
    const h = () => setP(read<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } }));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((n: Progress) => {
    write(PROGRESS_KEY, n);
    setP(n);
  }, []);
  return [p, save];
}

export function usePlays(): [PlayLog[], (l: PlayLog[]) => void] {
  const [list, setList] = useState<PlayLog[]>([]);
  useEffect(() => {
    setList(read<PlayLog[]>(PLAYS_KEY, []));
    const h = () => setList(read<PlayLog[]>(PLAYS_KEY, []));
    window.addEventListener("pw:sync", h);
    return () => window.removeEventListener("pw:sync", h);
  }, []);
  const save = useCallback((l: PlayLog[]) => {
    write(PLAYS_KEY, l);
    setList(l);
  }, []);
  return [list, save];
}

export function logPlay(entry: Omit<PlayLog, "id" | "at">) {
  const list = read<PlayLog[]>(PLAYS_KEY, []);
  const item: PlayLog = { ...entry, id: crypto.randomUUID(), at: Date.now() };
  write(PLAYS_KEY, [item, ...list].slice(0, 500));
}

export function recordResult(zone: keyof Progress["scores"], score: number, stars: number) {
  const prog = read<Progress>(PROGRESS_KEY, { scores: {}, stars: {}, unlocked: { structural: true } });
  const prev = prog.scores[zone] ?? 0;
  prog.scores[zone] = Math.max(prev, score);
  prog.stars[zone] = Math.max(prog.stars[zone] ?? 0, stars);
  const order: (keyof Progress["scores"])[] = ["structural", "folding", "enzyme", "immune"];
  const idx = order.indexOf(zone);
  if (stars >= 1 && idx >= 0 && idx < order.length - 1) prog.unlocked[order[idx + 1]] = true;
  write(PROGRESS_KEY, prog);
}

export function isAdminLoggedIn(): boolean {
  return read<boolean>(ADMIN_KEY, false);
}
export function setAdminLoggedIn(v: boolean) {
  write(ADMIN_KEY, v);
}

export function resetAll() {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(PLAYS_KEY);
  window.dispatchEvent(new CustomEvent("pw:sync"));
}