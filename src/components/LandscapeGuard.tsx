import { useEffect, useState } from "react";

export function LandscapeGuard() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    function checkOrientation() {
      if (typeof window === "undefined") return;
      // If screen is vertical (portrait) and width is smaller than 1024px
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      setIsPortrait(portrait);

      // Try automatic orientation lock if API supported
      if (window.screen?.orientation && "lock" in window.screen.orientation) {
        (window.screen.orientation as any).lock("landscape").catch(() => {
          // Ignore automatic lock refusal until user gesture
        });
      }
    }

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  async function requestLandscape() {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.screen?.orientation && "lock" in window.screen.orientation) {
        await (window.screen.orientation as any).lock("landscape");
      }
    } catch (e) {
      console.log("Orientation lock requested:", e);
    }
  }

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="card-soft max-w-sm w-full p-8 border-4 border-pink-400 shadow-2xl bg-white/95 text-berry flex flex-col items-center">
        {/* Animated Rotating Phone Icon */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="text-6xl animate-bounce">📲</div>
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-pink-400 animate-spin [animation-duration:8s]" />
        </div>

        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700 uppercase tracking-widest mb-2 border border-pink-300">
          📱 ตรวจพบหน้าจอแนวตั้ง
        </span>

        <h2 className="text-2xl font-black leading-tight text-berry">
          กรุณาหมุนมือถือให้อยู่ในแนวนอน
        </h2>

        <p className="mt-3 text-xs md:text-sm font-semibold text-muted-foreground leading-relaxed">
          เพื่อการแสดงผลและควบคุมตัวละครใน <b>Protein World</b> ที่สมบูรณ์ที่สุด โปรดถือโทรศัพท์ให้อยู่ในแนวนอน (Landscape Mode) ครับ
        </p>

        <button
          onClick={requestLandscape}
          className="btn-primary mt-6 w-full justify-center text-sm font-extrabold shadow-xl py-3.5"
        >
          🔄 สลับหน้าจอแนวนอน (Rotate Screen)
        </button>

        <div className="mt-4 text-[11px] text-muted-foreground">
          หรือเปิดระบบ Auto-Rotate (หมุนหน้าจออัตโนมัติ) บนโทรศัพท์ของคุณ
        </div>
      </div>
    </div>
  );
}
