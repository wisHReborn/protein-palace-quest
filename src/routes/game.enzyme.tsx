import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGameData, logPlay, recordResult } from "@/lib/game-store";
import { GameShell, ResultScreen } from "./game.structural";

export const Route = createFileRoute("/game/enzyme")({
  head: () => ({
    meta: [
      { title: "Enzyme Station — Protein World" },
      { name: "description", content: "จับคู่เอนไซม์กับสารตั้งต้นแบบ Lock and Key" },
      { property: "og:title", content: "Enzyme Station" },
      { property: "og:description", content: "เลือกเอนไซม์ที่จำเพาะให้ทันเวลา" },
    ],
  }),
  component: EnzymeGame,
});

function EnzymeGame() {
  const [data] = useGameData();
  const nav = useNavigate();
  const qs = data.enzyme;
  const totalTime = data.settings.enzyme.timeSec;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [time, setTime] = useState(totalTime);
  const q = qs[idx];

  useEffect(() => {
    if (done || pick) return;
    const t = setInterval(() => setTime((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [done, pick]);

  useEffect(() => {
    if (time === 0 && !pick) setPick("__timeout__");
  }, [time, pick]);

  const shuffled = useMemo(() => (q ? [...q.enzymes].sort(() => Math.random() - 0.5) : []), [idx, q]);

  if (!q) return <div className="p-10 text-center">ยังไม่มีโจทย์ในด่านนี้</div>;

  function choose(e: string) {
    if (pick) return;
    setPick(e);
    if (e === q.correctEnzyme) setScore((s) => s + q.points);
  }
  function next() {
    setPick(null);
    setTime(totalTime);
    if (idx + 1 < qs.length) setIdx(idx + 1);
    else {
      const total = qs.reduce((a, b) => a + b.points, 0);
      const stars = score >= total * 0.9 ? 3 : score >= total * 0.6 ? 2 : score >= data.settings.enzyme.passing ? 1 : 0;
      recordResult("enzyme", score, stars);
      logPlay({ player: "ผู้เล่น", zone: "enzyme", score, total, stars });
      setDone(true);
    }
  }

  if (done) return <ResultScreen score={score} onHome={() => nav({ to: "/map" })} />;

  return (
    <GameShell title="🧪 Enzyme Station" back="/map" score={score} step={`${idx + 1}/${qs.length}`}>
      <div className="card-soft p-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Substrate ที่รอย่อย:</div>
          <div className={`rounded-full px-4 py-1 text-sm font-bold ${time < 10 ? "bg-rose-100 text-rose-700" : "bg-mint/50 text-berry"}`}>⏱ {time}s</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-peach/50 to-pink/40 p-8 text-center">
          <div className="text-5xl">🔒</div>
          <div className="mt-3 text-2xl font-bold text-berry">{q.substrate}</div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">เลือกเอนไซม์ (กุญแจ) ที่จำเพาะให้ตรงกับ Substrate:</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {shuffled.map((e) => {
            const isCorrect = pick && e === q.correctEnzyme;
            const isPicked = pick === e;
            const cls = pick
              ? isCorrect ? "border-emerald-400 bg-emerald-50" : isPicked ? "border-rose-400 bg-rose-50" : "border-border bg-white opacity-60"
              : "border-pink bg-white hover:bg-pink/20";
            return (
              <button key={e} onClick={() => choose(e)} className={`rounded-2xl border-2 p-5 text-lg font-semibold text-berry transition ${cls}`}>
                🗝️ {e}
              </button>
            );
          })}
        </div>
        {pick && (
          <div className="mt-6 rounded-xl bg-white p-4 text-sm">
            {pick === q.correctEnzyme ? `✅ ถูกต้อง! +${q.points} คะแนน — ` : pick === "__timeout__" ? "⏰ หมดเวลา! — " : "❌ ยังไม่ถูก — "}
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