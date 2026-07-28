export type ZoneKey = "structural" | "folding" | "enzyme" | "immune";

export type Progress = {
  scores: Partial<Record<ZoneKey, number>>;
  stars: Partial<Record<ZoneKey, number>>;
  unlocked: Partial<Record<ZoneKey, boolean>>;
};

export type KahootQ = {
  id: string;
  prompt: string;
  options: [string, string, string, string]; // 4 Choices: A (Red Triangle), B (Cyan Diamond), C (Yellow Circle), D (Green Square)
  correctIndex: number; // 0 = A, 1 = B, 2 = C, 3 = D
  difficulty: "easy" | "medium" | "hard";
  points: number;
  explanation: string;
  extraVisual?: string; // Emoji / SVG visual context
};

export type Settings = {
  structural: { timeSec: number; passing: number };
  folding: { timeSec: number; passing: number };
  enzyme: { timeSec: number; passing: number };
  immune: { timeSec: number; passing: number };
  adminPassword: string;
};

export type GameData = {
  structural: KahootQ[];
  folding: KahootQ[];
  enzyme: KahootQ[];
  immune: KahootQ[];
  settings: Settings;
};

export const PRESET_AVATARS = [
  { id: "male1", name: "ดร. ลูคัส (นักชีววิทยาชายสุดหล่อ)", img: "/avatars/biologist_male.jpg", emoji: "👨‍🔬" },
  { id: "female1", name: "ดร. อาริน (นักชีววิทยาหญิงสุดน่ารัก)", img: "/avatars/biologist_female.jpg", emoji: "👩‍🔬" },
  { id: "chibi1", name: "น้องพาย (นักวิทยาศาสตร์ Chibi)", img: "/avatars/biologist_chibi.jpg", emoji: "🧑‍🔬" },
  { id: "silver1", name: "ดร. เรน (นักชีวเคมีผมเงินสุดเท่)", img: "/avatars/biologist_silver.jpg", emoji: "✨" },
];

export const defaultData: GameData = {
  structural: [
    {
      id: "s1",
      prompt: "พันธะเคมีชนิดใดที่ยึดเหนี่ยวระหว่างกรดอะมิโน 2 โมเลกุลเข้าด้วยกัน เกิดเป็นสายพอลิเปปไทด์?",
      options: [
        "พันธะเปปไทด์ (Peptide bond)",
        "พันธะไอออนิก (Ionic bond)",
        "พันธะไฮโดรเจน (Hydrogen bond)",
        "พันธะไดซัลไฟด์ (Disulfide bond)",
      ],
      correctIndex: 0,
      difficulty: "easy",
      points: 10,
      explanation: "พันธะเปปไทด์เป็นพันธะโคเวเลนต์ยึดระหว่างหมู่ Carboxyl (-COOH) ของกรดอะมิโนตัวหนึ่ง กับหมู่ Amino (-NH2) ของกรดอะมิโนอีกตัวหนึ่ง",
      extraVisual: "🧬",
    },
    {
      id: "s2",
      prompt: "ปฏิกิริยา Dehydration Synthesis ที่สร้างพันธะเปปไทด์ มีโมเลกุลใดหลุดออกมาเป็น ผลพลอยได้?",
      options: [
        "แก๊สคาร์บอนไดออกไซด์ (CO₂)",
        "โมเลกุลน้ำ (H₂O)",
        "แก๊สแอมโมเนีย (NH₃)",
        "โมเลกุลกลูโคส (C₆H₁₂O₆)",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 10,
      explanation: "Dehydration Synthesis เป็นการดึงหมู่ -OH จากคาร์บอกซิล และ -H จากแอมิโน มารวมกันเกิดเป็นน้ำ (H₂O) 1 โมเลกุลต่อ 1 พันธะ",
      extraVisual: "💧",
    },
    {
      id: "s3",
      prompt: "โครงสร้างส่วนใดของกรดอะมิโนทั้ง 20 ชนิด ที่มีความแตกต่างกัน ทำให้กรดอะมิโนแต่ละชนิดมีสมบัติทางเคมีเฉพาะตัว?",
      options: [
        "หมู่แอมิโน (-NH₂)",
        "หมู่คาร์บอกซิล (-COOH)",
        "หมู่สายข้าง (R-group / Side chain)",
        "อะตอมไฮโดรเจนอิสระ (-H)",
      ],
      correctIndex: 2,
      difficulty: "medium",
      points: 20,
      explanation: "กรดอะมิโนทุกชนิดมีโครงสร้างแกนกลางเหมือนกัน แต่ต่างกันที่ R-group ซึ่งกำหนดสมบัติว่าเป็น มีขั้ว, ไม่มีขั้ว, หรือเป็นประจุ",
      extraVisual: "🧪",
    },
    {
      id: "s4",
      prompt: "โครงสร้างปฐมภูมิ (Primary structure) ของโปรตีนหมายถึงลักษณะใดต่อไปนี้?",
      options: [
        "การพับเป็นเกลียวหรือแผ่นซิกแซก",
        "ลำดับการเรียงตัวของกรดอะมิโนในสายพอลิเปปไทด์",
        "การรวมตัวกันของสายพอลิเปปไทด์หลายสาย",
        "การสูญเสียสภาพ 3 มิติเนื่องจากความร้อน",
      ],
      correctIndex: 1,
      difficulty: "medium",
      points: 20,
      explanation: "โครงสร้างปฐมภูมิคือลำดับเชิงเส้นของกรดอะมิโนที่เชื่อมต่อกันด้วยพันธะเปปไทด์ เริ่มจากปลาย N-terminus ไปยัง C-terminus",
      extraVisual: "🔗",
    },
  ],
  folding: [
    {
      id: "f1",
      prompt: "โครงสร้างทุติยภูมิ (Secondary structure) แบบ Alpha-helix และ Beta-sheet ยึดเหนี่ยวกันด้วยพันธะชนิดใด?",
      options: [
        "พันธะเพปไทด์เพิ่มเติม",
        "พันธะไฮโดรเจน (Hydrogen bond)",
        "พันธะไดซัลไฟด์ (Disulfide bond)",
        "พันธะไอออนิก (Ionic bond)",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 15,
      explanation: "โครงสร้างทุติยภูมิเกิดจากพันธะไฮโดรเจนระหว่าง C=O และ N-H ของกระดูกสันหลังพอลิเปปไทด์ ทำให้สายม้วนพับเป็นเกลียวหรือแผ่นซิกแซก",
      extraVisual: "🌀",
    },
    {
      id: "f2",
      prompt: "ฮีโมโกลบิน (Hemoglobin) ประกอบด้วยสายพอลิเปปไทด์ 4 สายรวมกัน จัดเป็นโครงสร้างโปรตีนระดับใด?",
      options: [
        "โครงสร้างปฐมภูมิ (Primary structure)",
        "โครงสร้างทุติยภูมิ (Secondary structure)",
        "โครงสร้างตติยภูมิ (Tertiary structure)",
        "โครงสร้างจตุรภูมิ (Quaternary structure)",
      ],
      correctIndex: 3,
      difficulty: "medium",
      points: 20,
      explanation: "โครงสร้างจตุรภูมิเกิดจากการรวมตัวกันของสายพอลิเปปไทด์มากกว่า 1 สายขึ้นไป (Subunits) เช่น ฮีโมโกลบินมี 4 สาย",
      extraVisual: "🔮",
    },
    {
      id: "f3",
      prompt: "การเกิด Denaturation (การเสียสภาพของโปรตีน) ส่งผลกระทบต่อโครงสร้างโปรตีนอย่างไร?",
      options: [
        "ทำลายเฉพาะพันธะเปปไทด์ในโครงสร้างปฐing",
        "ทำลายพันธะในโครงสร้างระดับที่ 2, 3, 4 แต่สายปฐมภูมิมักยังคงอยู่",
        "สลายอะตอมคาร์บอนให้กลายเป็นแก๊ส CO₂",
        "เปลี่ยนกรดอะมิโนให้กลายเป็นโมเลกุลน้ำตาล",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 15,
      explanation: "Denaturation ทำลายพันธะไฮโดรเจนและแรงยึดเหนี่ยว 3 มิติ ทำให้โปรตีนเสียรูปร่างและสูญเสียหน้าที่ แต่สายพันธะเปปไทด์หลักยังไม่ถูกย่อย",
      extraVisual: "🔥",
    },
    {
      id: "f4",
      prompt: "ปัจจัยในข้อใดที่ทำให้โปรตีนเกิดการเสียสภาพ (Denaturation) ได้อย่างรุนแรงที่สุด?",
      options: [
        "อุณหภูมิสูงเกิน 60°C และ การเปลี่ยนค่า pH อย่างรุนแรง",
        "แสงสว่างจ้า และ เสียงระดับคลื่นความถี่สูง",
        "การได้รับแก๊สออกซิเจนในปริมาณมาก",
        "การแช่ในน้ำบริสุทธิ์อุณหภูมิห้อง",
      ],
      correctIndex: 0,
      difficulty: "easy",
      points: 15,
      explanation: "ความร้อนสูงเกินไป และ สภาวะกรด-เบสรุนแรง จะรบกวนแรงยึดเหนี่ยวทางเคมีในโครงสร้าง 3D ของโปรตีนอย่างสิ้นเชิง",
      extraVisual: "🧪",
    },
  ],
  enzyme: [
    {
      id: "e1",
      prompt: "เอนไซม์ (Enzyme) ทำหน้าที่สำคัญประการใดในปฏิกิริยาชีวเคมีของสิ่งมีชีวิต?",
      options: [
        "เพิ่มอุณหภูมิของปฏิกิริยาให้ร้อนขึ้น",
        "เป็นตัวเร่งชีวภาพ ช่วยลดพลังงานกระตุ้น (Activation Energy: Ea)",
        "เพิ่มพลังงานกระตุ้น Ea ให้สูงขึ้นมาก",
        "ถูกใช้หมดไปและกลายเป็นสารผลิตภัณฑ์",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 15,
      explanation: "เอนไซม์เป็น Biological Catalyst ช่วยลดพลังงานกระตุ้น Ea ทำให้ปฏิกิริยาเกิดรวดเร็วขึ้นโดยที่เอนไซม์ไม่ถูกใช้หมดไป",
      extraVisual: "📉",
    },
    {
      id: "e2",
      prompt: "บริเวณบนโมเลกุลเอนไซม์ที่ทำหน้าที่จับกับสารตั้งต้น (Substrate) อย่างจำเพาะเจาะจง เรียกว่าอะไร?",
      options: [
        "บริเวณเร่ง (Active site)",
        "บริเวณสลาย (Binding zone)",
        "นิวเคลียส (Nucleus)",
        "รูพรุนชีวะ (Bio-pore)",
      ],
      correctIndex: 0,
      difficulty: "easy",
      points: 15,
      explanation: "Active site มีรูปร่างและประจุที่เข้ากันได้พอดีกับ Substrate ตามแบบจำลอง Lock and Key Model",
      extraVisual: "🔒",
    },
    {
      id: "e3",
      prompt: "ข้อใดอธิบายแบบจำลอง Lock and Key Model ของเอนไซม์ได้อย่างถูกต้องที่สุด?",
      options: [
        "เอนไซม์ 1 ชนิด ย่อยสารตั้งต้นได้ทุกชนิดในโลก",
        "Substrate เปรียบเหมือนแม่กุญแจ ส่วนเอนไซม์เป็นลูกกุญแจที่มีรูปร่างจำเพาะเจาะจง",
        "เอนไซม์จะเปลี่ยนรูปร่างกลายเป็นไขมันหลังปฏิกิริยา",
        "เอนไซม์ทำงานได้ดีที่สุดเฉพาะที่ 100°C เท่านั้น",
      ],
      correctIndex: 1,
      difficulty: "medium",
      points: 20,
      explanation: "Lock and Key อธิบายว่าเอนไซม์มีความจำเพาะเจาะจง (Specificity) สูงมาก ต่อ สารตั้งต้นเฉพาะชนิดเท่านั้น",
      extraVisual: "🗝️",
    },
    {
      id: "e4",
      prompt: "ตัวยับยั้งเอนไซม์แบบแย่งจับ (Competitive Inhibitor) มีกลไกการทำงานอย่างไร?",
      options: [
        "แย่งเข้าจับกับบริเวณเร่ง (Active site) เนื่องจากมีรูปร่างคล้าย Substrate",
        "ทำลายโมเลกุลเอนไซม์ให้แตกออกเป็นชิ้นๆ",
        "เพิ่มปริมาณ Substrate ให้มากขึ้นเป็น 2 เท่า",
        "รวมตัวกับน้ำทำให้เอนไซม์ตกตะกอน",
      ],
      correctIndex: 0,
      difficulty: "hard",
      points: 25,
      explanation: "Competitive Inhibitors มีโครงสร้างโมเลกุลคล้ายกับ Substrate จึงแย่งเข้าจับ Active site ทำให้ Substrate จริงเข้าจับไม่ได้",
      extraVisual: "⚔️",
    },
  ],
  immune: [
    {
      id: "i1",
      prompt: "แอนติบอดี (Antibody / Immunoglobulin) เป็นโปรตีนทำหน้าที่สำคัญในด้านใด?",
      options: [
        "สะสมพันธุกรรมรหัส DNA",
        "จับกับแอนติเจนของเชื้อโรคอย่างจำเพาะเจาะจงเพื่อปกป้องร่างกาย",
        "ลำเลียงแก๊สออกซิเจนไปเลี้ยงสมอง",
        "สะสมพลังงานสำรองในรูปแบบไขมัน",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 15,
      explanation: "แอนติบอดีเป็นโปรตีนระบบภูมิคุ้มกัน สร้างจากเม็ดเลือดขาวพลาสมาเซลล์ ทำหน้าที่เข้าจับและทำลายเชื้อโรคสิ่งแปลกปลอม",
      extraVisual: "🛡️",
    },
    {
      id: "i2",
      prompt: "โปรตีนชนิดใดทำหน้าที่เป็นโครงสร้างหลัก ให้ความยืดหยุ่นแก่ผิวหนัง กระดูก และข้อต่อ?",
      options: [
        "ฮอร์โมนอินซูลิน (Insulin)",
        "คอลลาเจน (Collagen)",
        "เอนไซม์อะไมเลส (Amylase)",
        "ฮีโมโกลบิน (Hemoglobin)",
      ],
      correctIndex: 1,
      difficulty: "easy",
      points: 15,
      explanation: "คอลลาเจนเป็นโปรตีนโครงสร้างเส้นใยที่พบมากที่สุดในร่างกาย ให้ความแข็งแรงและยืดหยุ่นแก่ผิวหนังและข้อต่อ",
      extraVisual: "🦴",
    },
    {
      id: "i3",
      prompt: "ฮอร์โมนอินซูลิน (Insulin) ทำหน้าที่สำคัญในการควบคุมสิ่งใดในร่างกาย?",
      options: [
        "รักษาระดับน้ำตาลกลูโคสในกระแสเลือด",
        "ควบคุมสีผมและเม็ดสีผิวหนัง",
        "ย่อยแป้งในน้ำลาย",
        "ยับยั้งการเจริญเติบโตของเส้นผม",
      ],
      correctIndex: 0,
      difficulty: "medium",
      points: 20,
      explanation: "อินซูลินเป็นโปรตีนฮอร์โมนสร้างจากตับอ่อน กระตุ้นให้เซลล์นำกลูโคสในเลือดไปใช้และเปลี่ยนเป็นไกลโคเจนสะสม",
      extraVisual: "💉",
    },
    {
      id: "i4",
      prompt: "โปรตีน แอคติน (Actin) และ ไมโอซิน (Myosin) ทำหน้าที่สำคัญในระบบใดของร่างกาย?",
      options: [
        "การหดตัวและการเคลื่อนไหวของกล้ามเนื้อ",
        "การรับรสชาติอาหารบนลิ้น",
        "การกรองของเสียในหน่วยไต",
        "การสร้างสีเม็ดเลือดแดง",
      ],
      correctIndex: 0,
      difficulty: "medium",
      points: 20,
      explanation: "Actin และ Myosin เป็นโปรตีนเกี่ยวกับการเคลื่อนไหว (Contractile protein) ที่เลื่อนขนานกันเพื่อการหดตัวของกล้ามเนื้อ",
      extraVisual: "💪",
    },
  ],
  settings: {
    structural: { timeSec: 20, passing: 20 },
    folding: { timeSec: 20, passing: 20 },
    enzyme: { timeSec: 15, passing: 20 },
    immune: { timeSec: 20, passing: 20 },
    adminPassword: "protein123",
  },
};

// Symmetrical 2x2 grid positioning: x=180 (Left) / x=780 (Right), y=200 (Top) / y=440 (Bottom)
export const ZONES: { key: ZoneKey; name: string; emoji: string; tint: string; blurb: string; path: string; x: number; y: number; img: string }[] = [
  { key: "structural", name: "สถาบันโครงสร้างชีวะ", emoji: "🧬", tint: "from-pink-500 to-rose-400", blurb: "ตอบคำถามพันธะเปปไทด์ กรดอะมิโน และโครงสร้างปฐมภูมิ", path: "/game/structural", x: 180, y: 200, img: "/structural_lab.jpg" },
  { key: "folding", name: "โรงงานพับม้วนโปรตีน", emoji: "🎀", tint: "from-purple-500 to-pink-400", blurb: "ตอบคำถามการพับ Alpha-helix, Beta-sheet และ Denaturation", path: "/game/folding", x: 780, y: 200, img: "/folding_factory.jpg" },
  { key: "enzyme", name: "ห้องปฏิบัติการเอนไซม์", emoji: "🧪", tint: "from-teal-400 to-emerald-500", blurb: "ตอบคำถาม Lock & Key, พลังงานกระตุ้น Ea และตัวยับยั้ง", path: "/game/enzyme", x: 180, y: 440, img: "/enzyme_station.jpg" },
  { key: "immune", name: "โรงพยาบาลภูมิคุ้มกัน", emoji: "💗", tint: "from-rose-500 to-amber-400", blurb: "ตอบคำถามหน้าที่โปรตีน แอนติบอดี คอลลาเจน และฮอร์โมน", path: "/game/immune", x: 780, y: 440, img: "/immune_clinic.jpg" },
];