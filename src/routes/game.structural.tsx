import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useEffect, useState } from "react";
import { useGameData, logPlay, recordResult, getCurrentPlayerName } from "@/lib/game-store";
import type { KahootQ, ZoneKey } from "@/lib/game-data";
import { rpgAudio } from "@/lib/audio-player";

export const Route = createFileRoute("/game/structural")({
  head: () => ({
    meta: [
      { title: "สถาบันโครงสร้างชีวะ — Protein World Kahoot Quiz" },
      { name: "description", content: "ตอบคำถามเกี่ยวกับพันธะเปปไทด์ กรดอะมิโน และโครงสร้างปฐมภูมิของโปรตีน" },
      { property: "og:title", content: "สถาบันโครงสร้างชีวะ — Protein World Kahoot Quiz" },
      { property: "og:description", content: "เรียนรู้โครงสร้างกรดอะมิโนและพันธะเปปไทด์สไตล์ Kahoot" },
    ],
  }),
  component: StructuralGame,
});

export function KahootQuizEngine({
  zoneKey,
  zoneTitle,
  zoneEmoji,
  backPath = "/map",
}: {
  zoneKey: ZoneKey;
  zoneTitle: string;
  zoneEmoji: string;
  backPath?: string;
}) {
  const [data] = useGameData();
  const nav = useNavigate();

  const questions: KahootQ[] = data[zoneKey] || [];
  const totalTimePerQ = data.settings[zoneKey]?.timeSec || 20;

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(totalTimePerQ);
  const [done, setDone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const q = questions[idx];

  // Timer countdown loop
  useEffect(() => {
    if (done || pickedIndex !== null) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [idx, pickedIndex, done]);

  if (!q) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold">ยังไม่มีโจทย์ในด่านนี้</h2>
          <button onClick={() => nav({ to: "/map" })} className="mt-4 rounded-full bg-pink-500 px-6 py-2 text-sm font-bold">
            🗺️ กลับสู่แผนที่
          </button>
        </div>
      </div>
    );
  }

  function handleTimeOut() {
    if (pickedIndex !== null) return;
    setPickedIndex(-1); // Timeout indicator
    setStreak(0);
    rpgAudio.playWrongSfx();
  }

  function chooseOption(optionIdx: number) {
    if (pickedIndex !== null) return;
    setPickedIndex(optionIdx);

    const isCorrect = optionIdx === q.correctIndex;
    if (isCorrect) {
      rpgAudio.playCorrectSfx();
      const speedBonus = Math.floor((timeLeft / totalTimePerQ) * 10);
      const streakMultiplier = Math.min(3, 1 + streak * 0.5);
      const earned = Math.round((q.points + speedBonus) * streakMultiplier);

      setScore((s) => s + earned);
      setStreak((st) => st + 1);
    } else {
      rpgAudio.playWrongSfx();
      setStreak(0);
    }
  }

  function handleNextQuestion() {
    setPickedIndex(null);
    setTimeLeft(totalTimePerQ);

    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1);
    } else {
      finishGame();
    }
  }

  function finishGame() {
    const totalMax = questions.reduce((a, b) => a + b.points, 0);
    const passingScore = data.settings[zoneKey]?.passing || 20;

    const stars = score >= totalMax * 0.85 ? 3 : score >= totalMax * 0.5 ? 2 : score >= passingScore ? 1 : 0;

    recordResult(zoneKey, score, stars);
    logPlay({ player: getCurrentPlayerName(), zone: zoneKey, score, total: totalMax, stars });
    setDone(true);
  }

  function handleToggleFullscreen() {
    toggleFullscreen((active) => setIsFullscreen(active));
  }

  // Result Screen
  if (done) {
    const totalMax = questions.reduce((a, b) => a + b.points, 0);
    const stars = score >= totalMax * 0.85 ? 3 : score >= totalMax * 0.5 ? 2 : score >= data.settings[zoneKey]?.passing ? 1 : 0;

    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-white font-sans">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-10 text-center shadow-2xl border-4 border-pink-500/60 max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="text-6xl animate-bounce mb-2">{stars >= 2 ? "🎉" : "💪"}</div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
            ภารกิจดันเจี้ยนสำเร็จ!
          </h2>
          <p className="mt-1 text-slate-400 text-xs sm:text-sm font-semibold">{zoneTitle}</p>

          <div className="my-6 flex justify-center gap-2 text-4xl">
            {"⭐".repeat(stars) + "☆".repeat(3 - stars)}
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-white/10 my-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>คะแนนที่ทำได้:</span>
              <span className="font-black text-amber-300 text-base">💎 {score} คะแนน</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>เกณฑ์ดาวประเมิน:</span>
              <span className="font-bold text-emerald-400">{stars} / 3 ดาว</span>
            </div>
          </div>

          <button
            onClick={() => nav({ to: backPath })}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-4 text-base font-black text-white shadow-xl hover:scale-105 transition cursor-pointer"
          >
            🗺️ กลับสู่แผนที่เมืองโปรตีน
          </button>
        </div>
      </div>
    );
  }

  // Choice button styles for Kahoot 4 Colors
  const CHOICE_STYLES = [
    {
      bg: "bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-red-400/50",
      pickedBg: "bg-red-950 border-red-500 ring-4 ring-red-500/50",
      shape: "▲",
      label: "A",
    },
    {
      bg: "bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border-cyan-400/50",
      pickedBg: "bg-blue-950 border-cyan-500 ring-4 ring-cyan-500/50",
      shape: "◆",
      label: "B",
    },
    {
      bg: "bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border-amber-300/50 text-slate-950",
      pickedBg: "bg-amber-950 border-amber-400 ring-4 ring-amber-400/50 text-white",
      shape: "●",
      label: "C",
    },
    {
      bg: "bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 border-emerald-400/50",
      pickedBg: "bg-emerald-950 border-emerald-500 ring-4 ring-emerald-500/50",
      shape: "■",
      label: "D",
    },
  ];

  const timerPercent = (timeLeft / totalTimePerQ) * 100;

  return (
    <div className="min-h-screen w-screen p-4 md:p-6 flex flex-col justify-between bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      {/* Background ambient light */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-pink-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-[130px]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          onClick={() => nav({ to: backPath })}
          className="flex items-center gap-2 font-black text-pink-300 bg-slate-900/90 border border-pink-500/30 px-4 py-2 rounded-full shadow-lg backdrop-blur hover:bg-slate-800 transition cursor-pointer text-xs sm:text-sm"
        >
          ← ออกจากด่าน
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {streak > 1 && (
            <div className="animate-bounce rounded-full bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-black shadow-lg">
              ⚡ Streak x{streak}!
            </div>
          )}
          <div className="rounded-full bg-slate-900/90 border border-amber-400/40 px-4 py-2 text-xs sm:text-sm font-black text-amber-300 shadow-lg backdrop-blur">
            💎 {score} คะแนน
          </div>
          <div className="rounded-full bg-slate-900/90 border border-pink-500/40 px-4 py-2 text-xs sm:text-sm font-black text-pink-300 shadow-lg backdrop-blur">
            ข้อ {idx + 1} / {questions.length}
          </div>
          <button
            onClick={handleToggleFullscreen}
            className="rounded-full bg-slate-900/90 border border-white/20 px-3.5 py-2 text-xs font-extrabold text-slate-200 shadow-lg hover:bg-slate-800 transition cursor-pointer"
          >
            {isFullscreen ? "🔲" : "🖥️"}
          </button>
        </div>
      </header>

      {/* Main Kahoot PC Quiz Arena */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-5xl py-4 space-y-6">
        {/* Question Prompt Card */}
        <div className="rounded-3xl bg-slate-900/90 p-6 md:p-8 border-2 border-pink-500/40 shadow-2xl backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-black text-pink-400 uppercase tracking-wider">
              <span>{zoneEmoji}</span>
              <span>{zoneTitle}</span>
            </div>

            {/* Countdown Timer Badge */}
            <div
              className={`rounded-full px-4 py-1 text-xs sm:text-sm font-black transition-all ${
                timeLeft <= 5 ? "bg-rose-600 text-white animate-bounce" : "bg-slate-950 text-cyan-300 border border-cyan-400/40"
              }`}
            >
              ⏱️ เหลือ {timeLeft} วินาที
            </div>
          </div>

          {/* Live Animated Timer Bar */}
          <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-white/10 mb-6">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                timeLeft <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-pink-500 to-cyan-400"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="flex items-start gap-4">
            {q.extraVisual && (
              <span className="text-4xl sm:text-5xl filter drop-shadow hidden sm:inline-block">
                {q.extraVisual}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-relaxed">
              {q.prompt}
            </h2>
          </div>
        </div>

        {/* 4 Kahoot PC Choice Buttons (2x2 Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {q.options.map((optText, optionIdx) => {
            const style = CHOICE_STYLES[optionIdx];
            const isCorrect = pickedIndex !== null && optionIdx === q.correctIndex;
            const isPicked = pickedIndex === optionIdx;

            let buttonClass = `${style.bg} border-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]`;

            if (pickedIndex !== null) {
              if (isCorrect) {
                buttonClass = "bg-emerald-600 border-emerald-300 text-white ring-4 ring-emerald-400/60 scale-[1.02] shadow-2xl";
              } else if (isPicked) {
                buttonClass = "bg-rose-950 border-rose-500 text-rose-300 opacity-90 stroke-rose-500";
              } else {
                buttonClass = "bg-slate-900/60 border-white/10 opacity-30 text-slate-500";
              }
            }

            return (
              <button
                key={optionIdx}
                onClick={() => chooseOption(optionIdx)}
                disabled={pickedIndex !== null}
                className={`rounded-2xl p-5 text-left transition-all flex items-center gap-4 cursor-pointer min-h-[90px] ${buttonClass}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/30 font-black text-xl border border-white/20">
                  <span>{style.shape}</span>
                </div>
                <div className="flex-1 font-black text-base sm:text-lg leading-snug">
                  {optText}
                </div>
                {pickedIndex !== null && isCorrect && (
                  <span className="text-2xl font-black text-emerald-300">✓</span>
                )}
                {pickedIndex !== null && isPicked && !isCorrect && (
                  <span className="text-2xl font-black text-rose-400">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Answer Feedback & Biology Explanation */}
        {pickedIndex !== null && (
          <div
            className={`rounded-2xl p-5 border-2 shadow-2xl transition-all space-y-2 ${
              pickedIndex === q.correctIndex
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                : "bg-rose-950/90 text-rose-300 border-rose-500/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-black flex items-center gap-2">
                <span>{pickedIndex === q.correctIndex ? "✅ คำตอบถูกต้อง!" : pickedIndex === -1 ? "⏰ หมดเวลา!" : "❌ ยังไม่ถูกต้อง!"}</span>
              </div>
              {pickedIndex === q.correctIndex && (
                <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40">
                  +{(q.points + Math.floor((timeLeft / totalTimePerQ) * 10)) * Math.min(3, 1 + (streak - 1) * 0.5)} คะแนน
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-semibold bg-slate-950/60 p-3 rounded-xl border border-white/10">
              💡 {q.explanation}
            </p>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleNextQuestion}
                className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 text-xs sm:text-sm font-black shadow-lg hover:scale-105 transition cursor-pointer"
              >
                {idx + 1 < questions.length ? "ข้อถัดไป →" : "ดูผลรวมคะแนน 🏆"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StructuralGame() {
  return <KahootQuizEngine zoneKey="structural" zoneTitle="สถาบันโครงสร้างชีวะ (Structural Lab)" zoneEmoji="🧬" />;
}