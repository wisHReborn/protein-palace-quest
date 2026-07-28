import { createFileRoute } from "@tanstack/react-router";
import { KahootQuizEngine } from "./game.structural";

export const Route = createFileRoute("/game/enzyme")({
  head: () => ({
    meta: [
      { title: "Enzyme Station — Protein World Kahoot Quiz" },
      { name: "description", content: "ตอบคำถามเอนไซม์ Lock & Key พลังงานกระตุ้น Ea และตัวยับยั้งเอนไซม์" },
      { property: "og:title", content: "Enzyme Station — Protein World Kahoot Quiz" },
      { property: "og:description", content: "เรียนรู้กลไกเอนไซม์และพลังงานกระตุ้นสไตล์ Kahoot" },
    ],
  }),
  component: EnzymeGame,
});

function EnzymeGame() {
  return <KahootQuizEngine zoneKey="enzyme" zoneTitle="ห้องปฏิบัติการเอนไซม์ (Enzyme Station)" zoneEmoji="🧪" />;
}