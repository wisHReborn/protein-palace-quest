import { createFileRoute } from "@tanstack/react-router";
import { KahootQuizEngine } from "./game.structural";

export const Route = createFileRoute("/game/immune")({
  head: () => ({
    meta: [
      { title: "Immune Clinic — Protein World Kahoot Quiz" },
      { name: "description", content: "ตอบคำถามหน้าที่ของโปรตีน แอนติบอดี คอลลาเจน อินซูลิน และกล้ามเนื้อ" },
      { property: "og:title", content: "Immune Clinic — Protein World Kahoot Quiz" },
      { property: "og:description", content: "เรียนรู้หน้าที่ของโปรตีนในสิ่งมีชีวิตสไตล์ Kahoot" },
    ],
  }),
  component: ImmuneGame,
});

function ImmuneGame() {
  return <KahootQuizEngine zoneKey="immune" zoneTitle="โรงพยาบาลภูมิคุ้มกัน (Immune Clinic)" zoneEmoji="💗" />;
}