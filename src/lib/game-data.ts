export type ZoneKey = "structural" | "folding" | "enzyme" | "immune";

export type Progress = {
  scores: Partial<Record<ZoneKey, number>>;
  stars: Partial<Record<ZoneKey, number>>;
  unlocked: Partial<Record<ZoneKey, boolean>>;
};

export type StructuralQ = {
  id: string;
  prompt: string;
  sequence: string[]; // e.g. ["Gly","Ala","Ser"]
  difficulty: "easy" | "medium" | "hard";
  points: number;
  explanation: string;
};

export type FoldingQ = {
  id: string;
  prompt: string;
  answer: "alpha" | "beta" | "denature";
  temperature: number;
  ph: number;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  explanation: string;
};

export type EnzymeQ = {
  id: string;
  substrate: string;
  correctEnzyme: string;
  enzymes: string[];
  difficulty: "easy" | "medium" | "hard";
  points: number;
  explanation: string;
};

export type ImmuneQ = {
  id: string;
  patient: string;
  symptoms: string;
  options: string[];
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  explanation: string;
};

export type Settings = {
  structural: { timeSec: number; passing: number };
  folding: { timeSec: number; passing: number };
  enzyme: { timeSec: number; passing: number };
  immune: { timeSec: number; passing: number };
  adminPassword: string;
};

export type GameData = {
  structural: StructuralQ[];
  folding: FoldingQ[];
  enzyme: EnzymeQ[];
  immune: ImmuneQ[];
  settings: Settings;
};

export const AMINO_POOL = ["Gly", "Ala", "Ser", "Val", "Leu", "Lys", "Cys", "Phe", "Tyr", "His"];
export const ENZYME_POOL = ["Amylase", "Lipase", "Protease", "Lactase", "Sucrase", "Maltase"];

export const defaultData: GameData = {
  structural: [
    { id: "s1", prompt: "สร้างไดเปปไทด์ Gly–Ala", sequence: ["Gly", "Ala"], difficulty: "easy", points: 10, explanation: "พันธะเปปไทด์เกิดระหว่าง –COOH ของกรดอะมิโนตัวแรกกับ –NH₂ ของตัวถัดไป พร้อมปล่อยน้ำ 1 โมเลกุล" },
    { id: "s2", prompt: "ต่อสายไตรเปปไทด์ Ser–Val–Leu", sequence: ["Ser", "Val", "Leu"], difficulty: "medium", points: 20, explanation: "การเรียงกรดอะมิโนตามลำดับคือโครงสร้างปฐมภูมิ (Primary structure)" },
    { id: "s3", prompt: "สายพอลิเปปไทด์ Lys–Cys–Phe–Tyr", sequence: ["Lys", "Cys", "Phe", "Tyr"], difficulty: "hard", points: 30, explanation: "หมู่ R ที่ต่างกันของแต่ละกรดอะมิโนจะเป็นตัวกำหนดคุณสมบัติของโปรตีน" },
  ],
  folding: [
    { id: "f1", prompt: "โปรตีนที่ค่อยๆ ขดเป็นเกลียวโดยพันธะไฮโดรเจน ควรเป็นโครงสร้างใด?", answer: "alpha", temperature: 37, ph: 7, difficulty: "easy", points: 10, explanation: "Alpha-helix เกิดจากพันธะไฮโดรเจนระหว่างหมู่ C=O และ N–H ในสายเดียวกัน" },
    { id: "f2", prompt: "สายพับกลับไปมาแบบซิกแซกจับกันเป็นแผ่น", answer: "beta", temperature: 37, ph: 7, difficulty: "medium", points: 20, explanation: "Beta-sheet เกิดจากสายพอลิเปปไทด์หลายเส้นวางขนานกัน เชื่อมด้วยพันธะไฮโดรเจน" },
    { id: "f3", prompt: "อุณหภูมิ 90°C ทำให้เกิดอะไรกับโปรตีน?", answer: "denature", temperature: 90, ph: 7, difficulty: "easy", points: 10, explanation: "ความร้อนสูงทำให้พันธะที่ยึดโครงสร้างขาด โปรตีนเสียสภาพ (Denaturation)" },
    { id: "f4", prompt: "pH 2 (กรดจัด) มีผลอย่างไร?", answer: "denature", temperature: 37, ph: 2, difficulty: "medium", points: 20, explanation: "pH สุดโต่งเปลี่ยนประจุของหมู่ R ทำให้โครงสร้างพังและเสียสภาพ" },
  ],
  enzyme: [
    { id: "e1", substrate: "แป้ง (Starch)", correctEnzyme: "Amylase", enzymes: ["Amylase", "Lipase", "Protease"], difficulty: "easy", points: 10, explanation: "อะไมเลสย่อยแป้งเป็นน้ำตาลมอลโทส" },
    { id: "e2", substrate: "ไขมัน (Fat)", correctEnzyme: "Lipase", enzymes: ["Lipase", "Lactase", "Amylase"], difficulty: "easy", points: 10, explanation: "ไลเปสย่อยไขมันเป็นกรดไขมันและกลีเซอรอล" },
    { id: "e3", substrate: "โปรตีน", correctEnzyme: "Protease", enzymes: ["Protease", "Sucrase", "Amylase"], difficulty: "medium", points: 20, explanation: "โปรทีเอสย่อยโปรตีนเป็นกรดอะมิโน" },
    { id: "e4", substrate: "แลคโตส (นม)", correctEnzyme: "Lactase", enzymes: ["Lactase", "Maltase", "Lipase"], difficulty: "medium", points: 20, explanation: "แลคเทสย่อยแลคโตสเป็นกลูโคส + กาแลคโตส (ผู้แพ้นมมักขาดเอนไซม์นี้)" },
  ],
  immune: [
    { id: "i1", patient: "คุณมิ้นท์", symptoms: "เหนื่อยง่าย ซีด ตรวจพบเลือดขนส่งออกซิเจนได้น้อย", options: ["ฮีโมโกลบิน", "คอลลาเจน", "เคอราติน", "แอนติบอดี"], answer: "ฮีโมโกลบิน", difficulty: "easy", points: 10, explanation: "ฮีโมโกลบินอยู่ในเม็ดเลือดแดง ทำหน้าที่ขนส่ง O₂" },
    { id: "i2", patient: "น้องพลอย", symptoms: "ติดเชื้อไวรัสบ่อย ระบบภูมิคุ้มกันอ่อนแอ", options: ["แอนติบอดี", "ฮีโมโกลบิน", "ฮอร์โมนอินซูลิน", "เคอราติน"], answer: "แอนติบอดี", difficulty: "easy", points: 10, explanation: "แอนติบอดี (Immunoglobulin) จับเชื้อโรคเพื่อกำจัด" },
    { id: "i3", patient: "คุณป้าใหม่", symptoms: "ผิวหนังเหี่ยว ข้อต่อไม่แข็งแรง แผลหายช้า", options: ["คอลลาเจน", "ฮีโมโกลบิน", "แอนติบอดี", "โปรทีเอส"], answer: "คอลลาเจน", difficulty: "medium", points: 20, explanation: "คอลลาเจนเป็นโปรตีนโครงสร้างของผิว กระดูก และเนื้อเยื่อเกี่ยวพัน" },
    { id: "i4", patient: "น้องแพร", symptoms: "ผมเปราะ เล็บฉีกง่าย", options: ["เคอราติน", "อินซูลิน", "อะไมเลส", "แอนติบอดี"], answer: "เคอราติน", difficulty: "medium", points: 20, explanation: "เคอราตินเป็นโปรตีนโครงสร้างของผม เล็บ และผิวหนังชั้นนอก" },
  ],
  settings: {
    structural: { timeSec: 90, passing: 20 },
    folding: { timeSec: 60, passing: 20 },
    enzyme: { timeSec: 45, passing: 20 },
    immune: { timeSec: 90, passing: 20 },
    adminPassword: "protein123",
  },
};

export const ZONES: { key: ZoneKey; name: string; emoji: string; tint: string; blurb: string; path: string }[] = [
  { key: "structural", name: "สถาบันโครงสร้างชีวะ", emoji: "🧬", tint: "from-pink-200 to-rose-100", blurb: "ต่อกรดอะมิโนสร้างพันธะเปปไทด์", path: "/game/structural" },
  { key: "folding", name: "โรงงานพับม้วนโปรตีน", emoji: "🎀", tint: "from-purple-200 to-pink-100", blurb: "พับโครงสร้างและเลี่ยง Denaturation", path: "/game/folding" },
  { key: "enzyme", name: "ห้องปฏิบัติการเอนไซม์", emoji: "🧪", tint: "from-teal-100 to-pink-100", blurb: "จับคู่เอนไซม์กับสารตั้งต้น", path: "/game/enzyme" },
  { key: "immune", name: "โรงพยาบาลภูมิคุ้มกัน", emoji: "💗", tint: "from-rose-200 to-orange-100", blurb: "วินิจฉัยและรักษาด้วยโปรตีน", path: "/game/immune" },
];