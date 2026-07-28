-- ─── Cloudflare D1 (SQLite) Schema for Protein World ───

-- 1. Table for Kahoot Questions across 4 zones
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  zone TEXT NOT NULL, -- 'structural' | 'folding' | 'enzyme' | 'immune'
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_index INTEGER NOT NULL DEFAULT 0, -- 0=A, 1=B, 2=C, 3=D
  difficulty TEXT NOT NULL DEFAULT 'easy',
  points INTEGER NOT NULL DEFAULT 15,
  explanation TEXT NOT NULL,
  extra_visual TEXT DEFAULT '🧬',
  created_at INTEGER NOT NULL
);

-- 2. Table for Zone Settings (timer & passing score)
CREATE TABLE IF NOT EXISTS zone_settings (
  zone TEXT PRIMARY KEY,
  time_sec INTEGER NOT NULL DEFAULT 30,
  passing INTEGER NOT NULL DEFAULT 60
);

-- 3. Table for Admin Configurations
CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 4. Table for Player Play Audit Logs
CREATE TABLE IF NOT EXISTS play_logs (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- ─── Seed Initial Settings ───
INSERT OR IGNORE INTO zone_settings (zone, time_sec, passing) VALUES
  ('structural', 30, 60),
  ('folding', 30, 60),
  ('enzyme', 30, 60),
  ('immune', 30, 60);

INSERT OR IGNORE INTO admin_config (key, value) VALUES
  ('admin_password', 'protein123');

-- ─── Seed Default Grade 10 Biology Questions ───

-- Zone 1: Structural Lab (สถาบันโครงสร้างชีวะ)
INSERT OR IGNORE INTO questions (id, zone, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, points, explanation, extra_visual, created_at) VALUES
  ('s1', 'structural', 'พันธะเคมีชนิดใดที่ยึดเหนี่ยวระหว่างกรดอะมิโน 2 โมเลกุลเข้าด้วยกัน เกิดเป็นสายพอลิเปปไทด์?', 'พันธะเปปไทด์ (Peptide bond)', 'พันธะไอออนิก (Ionic bond)', 'พันธะไฮโดรเจน (Hydrogen bond)', 'พันธะไดซัลไฟด์ (Disulfide bond)', 0, 'easy', 10, 'พันธะเปปไทด์เป็นพันธะโคเวเลนต์ยึดระหว่างหมู่ Carboxyl (-COOH) ของกรดอะมิโนตัวหนึ่ง กับหมู่ Amino (-NH2) ของกรดอะมิโนอีกตัวหนึ่ง', '🧬', 1700000000000),
  ('s2', 'structural', 'ปฏิกิริยาการสร้างพันธะเปปไทด์ระหว่างกรดอะมิโน มีผลผลิตพลอยได้ (Byproduct) คือสารใด?', 'น้ำ (H2O)', 'แก๊สคาร์บอนไดออกไซด์ (CO2)', 'แก๊สออกซิเจน (O2)', 'กรดไฮโดรคลอริก (HCl)', 0, 'easy', 15, 'เป็นปฏิกิริยา Dehydration synthesis (Condensation) ซึ่งกำจัดน้ำออก 1 โมเลกุลต่อ 1 พันธะเปปไทด์', '💧', 1700000000000),
  ('s3', 'structural', 'ส่วนใดของโครงสร้างกรดอะมิโนที่เป็นตัวกำหนดความแตกต่างของกรดอะมิโนทั้ง 20 ชนิด?', 'หมู่ R (Side chain / R-group)', 'หมู่คาร์บอกซิล (Carboxyl group)', 'ูหมู่อะมิโน (Amino group)', 'อะตอมไฮโดรเจนตำแหน่งอัลฟา', 0, 'medium', 15, 'กรดอะมิโนทุกชนิดมีโครงสร้างพื้นฐานเหมือนกัน ต่างกันที่ R-group ซึ่งมีสมบัติทางเคมีต่างกัน เช่น มีขั้ว ไม่มีขั้ว หรือเป็นกรด-เบส', '🧪', 1700000000000),
  ('s4', 'structural', 'โครงสร้างของโปรตีนระดับปฐมภูมิ (Primary structure) หมายถึงสิ่งใด?', 'ลำดับการเรียงตัวของกรดอะมิโนในสายพอลิเปปไทด์', 'การม้วนเกลียวอัลฟาฮีลิกซ์', 'การรวมตัวของหลายสายพอลิเปปไทด์', 'รูปทรงก้อนกลม 3 มิติ', 0, 'easy', 10, 'โครงสร้างปฐมภูมิคือลำดับการเรียงตัวของกรดอะมิโนที่เชื่อมต่อด้วยพันธะเปปไทด์เป็นเส้นตรงตามรหัสพันธุกรรม', '🔗', 1700000000000);

-- Zone 2: Folding Factory (โรงงานพับม้วนโปรตีน)
INSERT OR IGNORE INTO questions (id, zone, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, points, explanation, extra_visual, created_at) VALUES
  ('f1', 'folding', 'โครงสร้างทุติยภูมิของโปรตีน เช่น เกลียวอัลฟา (Alpha-helix) ยึดเหนี่ยวด้วยพันธะเคมีประเภทใด?', 'พันธะไฮโดรเจน (Hydrogen bond)', 'พันธะเปปไทด์ (Peptide bond)', 'พันธะโคเวเลนต์เชิงซ้อน', 'พันธะโลหะ (Metallic bond)', 0, 'easy', 10, 'พันธะไฮโดรเจนเกิดระหว่างอะตอม O ของหมู่ C=O และ H ของหมู่ N-H ในสายพอลิเปปไทด์เดียวกัน ทำให้เกิดเกลียวหรือแผ่นพับ', '🌀', 1700000000000),
  ('f2', 'folding', 'เฮโมโกลบิน (Hemoglobin) ในเม็ดเลือดแดง จัดเป็นโปรตีนที่มีโครงสร้างระดับใด?', 'โครงสร้างจตุรภูมิ (Quaternary structure)', 'โครงสร้างตติยภูมิ (Tertiary structure)', 'โครงสร้างทุติยภูมิ (Secondary structure)', 'โครงสร้างปฐมภูมิ (Primary structure)', 0, 'medium', 15, 'เฮโมโกลบินประกอบด้วยสายพอลิเปปไทด์ 4 สาย (2 Alpha + 2 Beta) มารวมตัวกันทำงานเป็นหน่วยเดียว', '🩸', 1700000000000),
  ('f3', 'folding', 'การที่โปรตีนสูญเสียสภาพธรรมชาติ (Denaturation) ส่งผลกระทบต่อสิ่งใดมากที่สุด?', 'การสูญเสียรูปทรง 3 มิติและการทำงานทางชีวภาพ', 'การสลายตัวของกรดอะมิโนกลายเป็นแก๊ส', 'การเพิ่มขึ้นของพันธะเปปไทด์', 'การเปลี่ยนกรดอะมิโนเป็นไขมัน', 0, 'medium', 15, 'การเสียสภาพทำให้พันธะแรงอ่อน (เช่น พันธะไฮโดรเจน) ถูกทำลาย โครงสร้าง 3 มิติเปลี่ยนไป โปรตีนจึงทำงานไม่ได้ แม้ลำดับกรดอะมิโนยังคงเดิม', '🔥', 1700000000000),
  ('f4', 'folding', 'ปัจจัยในข้อใดต่อไปนี้ที่สามารถทำให้โปรตีนเกิดการเสียสภาพ (Denaturation) ได้?', 'อุณหภูมิสูงและค่า pH ที่เปลี่ยนแปลงรุนแรง', 'แสงแดดอ่อนๆ ตอนเช้า', 'การเจือจางด้วยน้ำบริสุทธิ์', 'การเก็บในตู้เย็นอุณหภูมิ 4 องศาเซลเซียส', 0, 'easy', 10, 'ความร้อนสูง เปลี่ยนแปลง pH สารเคมีรุนแรง หรือโลหะหนัก ทำลายแรงยึดเหนี่ยวภายในโมเลกุลโปรตีน', '🌡️', 1700000000000);

-- Zone 3: Enzyme Station (ห้องปฏิบัติการเอนไซม์)
INSERT OR IGNORE INTO questions (id, zone, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, points, explanation, extra_visual, created_at) VALUES
  ('e1', 'enzyme', 'เอนไซม์ทำหน้าที่เป็นตัวเร่งปฏิกิริยาชีวเคมี โดยมีกลไกหลักในการทำงานอย่างไร?', 'ลดพลังงานกระตุ้น (Activation energy - Ea)', 'เพิ่มพลังงานกระตุ้น (Ea) ของระบบ', 'เปลี่ยนทิศทางของปฏิกิริยาให้ย้อนกลับ', 'ทำลายสารตั้งต้นให้หมดไปทันที', 0, 'easy', 10, 'เอนไซม์ช่วยลดพลังงานกระตุ้น (Ea) ทำให้ปฏิกิริยาเกิดได้เร็วขึ้นที่อุณหภูมิของร่างกาย', '⚡', 1700000000000),
  ('e2', 'enzyme', 'ตำแหน่งบนโมเลกุลเอนไซม์ที่จับกับสารตั้งต้น (Substrate) เพื่อเกิดปฏิกิริยา เรียกว่าอะไร?', 'บริเวณเร่ง (Active site)', 'บริเวณยับยั้ง (Inhibitor site)', 'หมู่พรอสทีติก (Prosthetic group)', 'โคเอนไซม์ (Coenzyme)', 0, 'easy', 10, 'Active site คือบริเวณที่มีรูปร่างและสมบัติเคมีจำเพาะต่อ Substrate เข้าจับเกิดเป็น Enzyme-Substrate Complex', '🔑', 1700000000000),
  ('e3', 'enzyme', 'ทฤษฎีแม่กุญแจกับลูกกุญแจ (Lock and Key Model) อธิบายสมบัติใดของเอนไซม์?', 'ความจำเพาะเจาะจง (Specificity) ต่อสารตั้งต้น', 'การทำงานได้ไม่จำกัดอุณหภูมิ', 'การเปลี่ยนสภาพเป็นกรดอะมิโนอิสระ', 'การเร่งปฏิกิริยาโดยไม่ใช้พลังงาน', 0, 'medium', 15, 'เปรียบ Active site ของเอนไซม์เหมือนแม่กุญแจ และ Substrate เหมือนลูกกุญแจที่มีรูปร่างเข้ากันได้อย่างพอดี', '🔒', 1700000000000),
  ('e4', 'enzyme', 'ตัวยับยั้งเอนไซม์แบบแย่งจับ (Competitive inhibitor) มีลักษณะอย่างไร?', 'มีโครงสร้างคล้าย Substrate และเข้าจับที่ Active site', 'จับกับเอนไซม์ที่ตำแหน่งอื่นที่ไม่ใช่ Active site', 'ทำลายเอนไซม์ถาวรไม่ให้ทำงานได้อีก', 'ช่วยเพิ่มความเร็วของปฏิกิริยาเป็น 2 เท่า', 0, 'hard', 20, 'Competitive inhibitor มีรูปร่างคล้ายสารตั้งต้น จึงเข้าแย่งจับ Active site แก้ไขได้โดยการเพิ่มความเข้มข้นของ Substrate', '🚫', 1700000000000);

-- Zone 4: Immune Clinic (โรงพยาบาลภูมิคุ้มกัน)
INSERT OR IGNORE INTO questions (id, zone, prompt, option_a, option_b, option_c, option_d, correct_index, difficulty, points, explanation, extra_visual, created_at) VALUES
  ('i1', 'immune', 'สารในข้อใดจัดเป็นโปรตีนทำหน้าที่ในระบบภูมิคุ้มกันของร่างกาย เข้าจับกับสิ่งแปลกปลอมอย่างจำเพาะ?', 'แอนติบอดี (Antibody / Immunoglobulin)', 'แอนติเจน (Antigen)', 'ฮีโมโกลบิน (Hemoglobin)', 'คอลลาเจน (Collagen)', 0, 'easy', 10, 'แอนติบอดีเป็นกลอบิวลาร์โปรตีนรูปตัว Y สร้างจากเม็ดเลือดขาวชนิด B-cell ทำหน้าที่จับและทำลายเชื้อโรค', '🛡️', 1700000000000),
  ('i2', 'immune', 'โปรตีนโครงสร้างชนิดใดพบมากที่สุดในร่างกายมนุษย์ เป็นส่วนประกอบหลักของผิวหนัง กระดูก และเส้นเอ็น?', 'คอลลาเจน (Collagen)', 'เคราติน (Keratin)', 'ไมโอซิน (Myosin)', 'อัลบูมิน (Albumin)', 0, 'easy', 10, 'คอลลาเจนเป็นโปรตีนเส้นใย (Fibrous protein) ที่ให้ความแข็งแรงและยืดหยุ่นแก่เนื้อเยื่อเกี่ยวพันทั่วร่างกาย', '🦴', 1700000000000),
  ('i3', 'immune', 'อินซูลิน (Insulin) ทำหน้าที่เป็นโปรตีนประเภทใดในร่างกาย?', 'ฮอร์โมน (Hormone) ควบคุมระดับน้ำตาลในเลือด', 'เอนไซม์ย่อยอาหารในลำไส้เล็ก', 'โครงสร้างของเส้นผมและเล็บ', 'ตัวขนส่งแก๊สออกซิเจน', 0, 'medium', 15, 'อินซูลินเป็นเปปไทด์ฮอร์โมนหลั่งจากตับอ่อน ทำหน้าที่กระตุ้นให้เซลล์นำน้ำตาลกลูโคสไปใช้และสะสม', '🩸', 1700000000000),
  ('i4', 'immune', 'โปรตีนชนิดใดทำงานร่วมกันภายในเซลล์กล้ามเนื้อ ทำให้เกิดการหดตัวและการเคลื่อนไหวของร่างกาย?', 'แอคติน และ ไมโอซิน (Actin & Myosin)', 'ฟิบริน และ ทรอมบิน (Fibrin & Thrombin)', 'เคราติน และ อีลาสติน (Keratin & Elastin)', 'กลอบิวลิน และ อัลบูมิน', 0, 'medium', 15, 'Actin (Thin filament) และ Myosin (Thick filament) สไลด์เหลื่อมกันโดยใช้พลังงาน ATP ทำให้กล้ามเนื้อหดตัว', '💪', 1700000000000);
