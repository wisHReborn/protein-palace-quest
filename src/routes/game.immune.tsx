import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGameData, logPlay, recordResult } from "@/lib/game-store";
import { GameShell, ResultScreen } from "./game.structural";

export const Route = createFileRoute("/game/immune")({
  head: () => ({
    meta: [
      { title: "Immune Clinic — Protein World" },
      { name: "description", content: "วินิจฉัยผู้ป่วยและเลือกโปรตีนไปรักษา" },
      { property: "og:title", content: "Immune Clinic" },
      { property: "og:description", content: "จับคู่โปรตีนกับหน้าที่ในร่างกาย" },
    ],
  }),
  component: ImmuneGame,
});

function ImmuneGame() {
  const [data] = useGameData();
  const nav = useNavigate();
  const qs = data.immune;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const q = qs[idx];

  if (!q) return <div className="p-10 text-center">ยังไม่มีเคสในด่านนี้</div>;

  function choose(o: string) {
    if (pick) return;
    setPick(o);
    if (o === q.answer) setScore((s) => s + q.points);
  }
  function next() {
    setPick(null);
    if (idx + 1 < qs.length) setIdx(idx + 1);
    else {
      const total = qs.reduce((a, b) => a + b.points, 0);
      const stars = score >= total * 0.9 ? 3 : score >= total * 0.6 ? 2 : score >= data.settings.immune.passing ? 1 : 0;
      recordResult("immune", score, stars);
      logPlay({ player: "ผู้เล่น", zone: "immune", score, total, stars });
      setDone(true);
    }
  }

  if (done) return <ResultScreen score={score} onHome={() => nav({ to: "/map" })} />;

  return (
    <GameShell title="💗 Immune Clinic" back="/map" score={score} step={`${idx + 1}/${qs.length}`}>
      <div className="card-soft p-8">
        <div className="rounded-2xl bg-gradient-to-br from-pink/40 to-lavender/40 p-6">
          <div className="text-sm font-semibold text-berry">🏥 เคสผู้ป่วย: {q.patient}</div>
          <p className="mt-2 text-base text-foreground">{q.symptoms}</p>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">เลือกโปรตีนที่ควรใช้รักษา:</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {q.options.map((o) => {
            const isCorrect = pick && o === q.answer;
            const isPicked = pick === o;
            const cls = pick
              ? isCorrect ? "border-emerald-400 bg-emerald-50" : isPicked ? "border-rose-400 bg-rose-50" : "border-border bg-white opacity-60"
              : "border-pink bg-white hover:bg-pink/20";
            return (
              <button key={o} onClick={() => choose(o)} className={`rounded-2xl border-2 p-5 text-left text-lg font-semibold text-berry transition ${cls}`}>
                💊 {o}
              </button>
            );
          })}
        </div>
        {pick && (
          <div className="mt-6 rounded-xl bg-white p-4 text-sm">
            {pick === q.answer ? `✅ วินิจฉัยถูกต้อง! +${q.points} คะแนน — ` : "❌ ยังไม่ตรง — "}
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