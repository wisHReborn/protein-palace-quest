import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGameData, logPlay, recordResult } from "@/lib/game-store";
import { GameShell, ResultScreen } from "./game.structural";

export const Route = createFileRoute("/game/folding")({
  head: () => ({
    meta: [
      { title: "Protein Folding — Protein World" },
      { name: "description", content: "พับโปรตีน α-helix / β-sheet และเรียนรู้ Denaturation" },
      { property: "og:title", content: "Protein Folding Factory" },
      { property: "og:description", content: "จัดโครงสร้างโปรตีนภายใต้อุณหภูมิและ pH ที่กำหนด" },
    ],
  }),
  component: FoldingGame,
});

const OPTIONS: { key: "alpha" | "beta" | "denature"; label: string; emoji: string }[] = [
  { key: "alpha", label: "Alpha-helix (เกลียว)", emoji: "🌀" },
  { key: "beta", label: "Beta-sheet (แผ่นซิกแซก)", emoji: "🧻" },
  { key: "denature", label: "Denaturation (เสียสภาพ)", emoji: "🔥" },
];

function FoldingGame() {
  const [data] = useGameData();
  const nav = useNavigate();
  const qs = data.folding;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const q = qs[idx];

  if (!q) return <div className="p-10 text-center">ยังไม่มีโจทย์ในด่านนี้</div>;

  function choose(k: string) {
    if (pick) return;
    setPick(k);
    if (k === q.answer) setScore((s) => s + q.points);
  }
  function next() {
    setPick(null);
    if (idx + 1 < qs.length) setIdx(idx + 1);
    else {
      const total = qs.reduce((a, b) => a + b.points, 0);
      const stars = score >= total * 0.9 ? 3 : score >= total * 0.6 ? 2 : score >= data.settings.folding.passing ? 1 : 0;
      recordResult("folding", score, stars);
      logPlay({ player: "ผู้เล่น", zone: "folding", score, total, stars });
      setDone(true);
    }
  }

  if (done) return <ResultScreen score={score} onHome={() => nav({ to: "/map" })} />;

  return (
    <GameShell title="🎀 Protein Folding Factory" back="/map" score={score} step={`${idx + 1}/${qs.length}`}>
      <div className="card-soft p-8">
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-peach/50 px-3 py-1 font-semibold">🌡️ อุณหภูมิ {q.temperature}°C</span>
          <span className="rounded-full bg-lavender/50 px-3 py-1 font-semibold">🧪 pH {q.ph}</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-berry">{q.prompt}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {OPTIONS.map((o) => {
            const isCorrect = pick && o.key === q.answer;
            const isPicked = pick === o.key;
            const cls = pick
              ? isCorrect ? "border-emerald-400 bg-emerald-50" : isPicked ? "border-rose-400 bg-rose-50" : "border-border bg-white opacity-60"
              : "border-pink bg-white hover:bg-pink/20";
            return (
              <button key={o.key} onClick={() => choose(o.key)} className={`rounded-2xl border-2 p-5 text-left transition ${cls}`}>
                <div className="text-3xl">{o.emoji}</div>
                <div className="mt-2 font-semibold text-berry">{o.label}</div>
              </button>
            );
          })}
        </div>
        {pick && (
          <div className="mt-6 rounded-xl bg-white p-4 text-sm">
            {pick === q.answer ? `✅ ถูกต้อง! +${q.points} คะแนน — ` : "❌ ยังไม่ถูก — "}
            {q.explanation}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button onClick={next} className="btn-primary" disabled={!pick}>ถัดไป →</button>
        </div>
      </div>
    </GameShell>
  );
}