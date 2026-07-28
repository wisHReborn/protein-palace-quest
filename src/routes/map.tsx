import { createFileRoute, Link } from "@tanstack/react-router";
import { useProgress } from "@/lib/game-store";
import { ZONES } from "@/lib/game-data";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "แผนที่มหานครโปรตีน — Protein World" },
      { name: "description", content: "เลือกด่านมินิเกมในมหานครโปรตีน" },
      { property: "og:title", content: "แผนที่มหานครโปรตีน" },
      { property: "og:description", content: "เลือกโซนที่ต้องการเล่น" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [progress] = useProgress();
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + (b ?? 0), 0);
  const totalScore = Object.values(progress.scores).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="min-h-screen px-6 py-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="text-berry hover:underline">← กลับหน้าแรก</Link>
        <div className="flex gap-3">
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-berry">⭐ {totalStars} ดาว</div>
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-berry">💎 {totalScore} คะแนน</div>
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-6xl text-center">
        <h1 className="text-4xl font-extrabold text-berry">🗺️ มหานครโปรตีน</h1>
        <p className="mt-2 text-muted-foreground">เลือกด่านที่ต้องการเข้าไปผจญภัย</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2">
        {ZONES.map((z, i) => {
          const unlocked = progress.unlocked[z.key] ?? false;
          const stars = progress.stars[z.key] ?? 0;
          const score = progress.scores[z.key] ?? 0;
          return (
            <div key={z.key} className={`card-soft relative overflow-hidden p-8 transition ${unlocked ? "hover:-translate-y-1" : "opacity-60"}`}>
              <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${z.tint} opacity-70`} />
              <div className="relative">
                <div className="text-xs font-semibold text-muted-foreground">ด่านที่ {i + 1}</div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-5xl">{z.emoji}</span>
                  <h2 className="text-2xl font-bold text-berry">{z.name}</h2>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{z.blurb}</p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="mr-3">{"⭐".repeat(stars) + "☆".repeat(3 - stars)}</span>
                    <span className="text-muted-foreground">{score} คะแนน</span>
                  </div>
                  {unlocked ? (
                    <Link to={z.path} className="btn-primary text-sm">เข้าเล่น</Link>
                  ) : (
                    <span className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">🔒 ปลดล็อกด่านก่อน</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}