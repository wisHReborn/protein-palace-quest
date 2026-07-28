import { createFileRoute } from "@tanstack/react-router";
import { KahootQuizEngine } from "./game.structural";

export const Route = createFileRoute("/game/folding")({
  head: () => ({
    meta: [
      { title: "Protein Folding Factory — Protein World Kahoot Quiz" },
      { name: "description", content: "ตอบคำถามการพับโปรตีน Alpha-helix, Beta-sheet และการเสียสภาพ Denaturation" },
      { property: "og:title", content: "Protein Folding Factory — Protein World Kahoot Quiz" },
      { property: "og:description", content: "เรียนรู้โครงสร้าง 3 มิติและการพับม้วนโปรตีนสไตล์ Kahoot" },
    ],
  }),
  component: FoldingGame,
});

function FoldingGame() {
  return <KahootQuizEngine zoneKey="folding" zoneTitle="โรงงานพับม้วนโปรตีน (Protein Folding Factory)" zoneEmoji="🎀" />;
}