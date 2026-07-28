import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGameData, logPlay, recordResult } from "@/lib/game-store";
import { AMINO_POOL } from "@/lib/game-data";

export const Route = createFileRoute("/game/structural")({
  head: () => ({
    meta: [
      { title: "Structural Lab — Protein World" },
      { name: "description", content: "ต่อกรดอะมิโนสร้างพันธะเปปไทด์" },
      { property: "og:title", content: "Structural Lab" },
      { property: "og:description", content: "ประกอบสายพอลิเปปไทด์ผ่าน Dehydration Synthesis" },
    ],
  }),
  component: StructuralGame,
});

export function GameShell({ title, back, score, step, children }: { title: string; back: string; score: number; step: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <Link to={back} className="text-berry hover:underline">← ออกจากด่าน</Link>
        <div className="flex gap-3">
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-berry">💎 {score}</div>
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-berry">ข้อ {step}</div>
        </div>
      </header>
      <div className="mx-auto mt-4 max-w-4xl">
        <h1 className="mb-4 text-center text-3xl font-extrabold text-berry">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function ResultScreen({ score, onHome }: { score: number; onHome: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-soft max-w-md p-10 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold text-berry">จบด่านแล้ว!</h2>
        <p className="mt-2 text-muted-foreground">คุณได้ {score} คะแนน</p>
        <button onClick={onHome} className="btn-primary mt-6">กลับสู่แผนที่</button>
      </div>
    </div>
  );
}

function StructuralGame() {
  const [data] = useGameData();
  const nav = useNavigate();
  const questions = data.structural;
  const [idx, setIdx] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const pool = useMemo(() => {
    if (!q) return [] as string[];
    const extras = AMINO_POOL.filter((a) => !q.sequence.includes(a)).slice(0, 4);
    return [...q.sequence, ...extras].sort(() => Math.random() - 0.5);
  }, [idx, q]);

  if (!q) return <div className="p-10 text-center">ยังไม่มีโจทย์ในด่านนี้</div>;

  function add(a: string) {
    if (feedback) return;
    setBuilt((b) => [...b, a]);
  }
  function undo() { setBuilt((b) => b.slice(0, -1)); }
  function check() {
    const correct = JSON.stringify(built) === JSON.stringify(q.sequence);
    if (correct) {
      setScore((s) => s + q.points);
      setFeedback(`✅ ถูกต้อง! +${q.points} คะแนน — ${q.explanation}`);
    } else {
      setFeedback(`❌ ยังไม่ถูก ลำดับที่ถูกคือ ${q.sequence.join(" – ")}. ${q.explanation}`);
    }
  }
  function next() {
    setBuilt([]); setFeedback(null);
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else finish();
  }
  function finish() {
    const total = questions.reduce((a, b) => a + b.points, 0);
    const stars = score >= total * 0.9 ? 3 : score >= total * 0.6 ? 2 : score >= data.settings.structural.passing ? 1 : 0;
    recordResult("structural", score, stars);
    logPlay({ player: "ผู้เล่น", zone: "structural", score, total, stars });
    setDone(true);
  }

  if (done) return <ResultScreen score={score} onHome={() => nav({ to: "/map" })} />;

  return (
    <GameShell title="🧬 Structural Lab" back="/map" score={score} step={`${idx + 1}/${questions.length}`}>
      <div className="card-soft p-8">
        <h2 className="text-lg font-semibold text-berry">โจทย์: {q.prompt}</h2>
        <p className="mt-1 text-sm text-muted-foreground">คลิกกรดอะมิโนตามลำดับ เกิดพันธะเปปไทด์ + น้ำหลุด 1 โมเลกุลต่อพันธะ</p>
        <div className="mt-6 min-h-24 rounded-2xl border-2 border-dashed border-pink bg-pink/10 p-4">
          <div className="text-xs text-muted-foreground">สายที่สร้าง:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {built.length === 0 && <span className="text-muted-foreground">— ว่าง —</span>}
            {built.map((a, i) => (
              <span key={i} className="rounded-full bg-gradient-to-br from-primary to-berry px-4 py-2 font-semibold text-white shadow">
                {a}{i < built.length - 1 && <span className="mx-1 opacity-60">–</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="text-xs text-muted-foreground">คลังกรดอะมิโน:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pool.map((a) => (
              <button key={a} onClick={() => add(a)} className="rounded-2xl border border-pink bg-white px-4 py-2 font-semibold text-berry shadow-sm hover:bg-pink/20">
                {a}
              </button>
            ))}
          </div>
        </div>
        {feedback && <div className="mt-6 rounded-xl bg-white p-4 text-sm">{feedback}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={undo} className="btn-soft" disabled={!!feedback}>↩︎ ย้อน</button>
          {!feedback ? (
            <button onClick={check} className="btn-primary" disabled={built.length === 0}>✅ ตรวจคำตอบ</button>
          ) : (
            <button onClick={next} className="btn-primary">ถัดไป →</button>
          )}
        </div>
      </div>
    </GameShell>
  );
}