import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protein World — มหานครโปรตีน" },
      { name: "description", content: "เกมการเรียนรู้ชีววิทยา ม.4 เรื่องโปรตีน 4 มินิเกมสุดน่ารัก" },
      { property: "og:title", content: "Protein World — มหานครโปรตีน" },
      { property: "og:description", content: "ผจญภัยในมหานครโปรตีน เรียนรู้ผ่าน 4 ด่าน" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-pink/40 blur-3xl" />
        <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-lavender/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-peach/40 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2 text-lg font-bold text-berry">
          <span className="text-2xl">🌸</span> Protein World
        </div>
        <Link to="/admin/login" className="btn-soft text-sm">
          🔐 เข้าสู่ระบบผู้ดูแล
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <p className="mb-4 inline-block rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-berry">
          Biology · Grade 10 · Protein
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight text-berry md:text-6xl">
          ยินดีต้อนรับสู่<br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">มหานครโปรตีน</span> 🌷
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          ผจญภัยผ่าน 4 ด่านสุดน่ารัก เรียนรู้ตั้งแต่โครงสร้างกรดอะมิโน การพับโปรตีน
          เอนไซม์ ไปจนถึงหน้าที่ของโปรตีนในร่างกาย
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/map" className="btn-primary text-base">
            ✨ เริ่มเกม
          </Link>
          <a href="#zones" className="btn-soft">🗺️ ดูแผนที่ด่าน</a>
        </div>

        <section id="zones" className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { emoji: "🧬", title: "Structural Lab", desc: "ประกอบกรดอะมิโนและพันธะเปปไทด์" },
            { emoji: "🎀", title: "Folding Factory", desc: "พับโครงสร้าง α-helix / β-sheet" },
            { emoji: "🧪", title: "Enzyme Station", desc: "จับคู่เอนไซม์กับสารตั้งต้น" },
            { emoji: "💗", title: "Immune Clinic", desc: "วินิจฉัย & รักษาด้วยโปรตีน" },
          ].map((z) => (
            <div key={z.title} className="card-soft p-6 text-left transition hover:-translate-y-1">
              <div className="text-4xl">{z.emoji}</div>
              <h3 className="mt-3 font-bold text-berry">{z.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{z.desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-24 text-sm text-muted-foreground">
          🌷 สร้างด้วยความรัก · เพื่อการเรียนรู้ชีววิทยา ม.4
        </footer>
      </main>
    </div>
  );
}
