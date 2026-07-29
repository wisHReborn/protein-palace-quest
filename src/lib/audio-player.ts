// Web Audio API Synthesizer Engine for Protein World RPG & Kahoot Sound Effects

class RpgAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private masterGain: GainNode | null = null;

  private initCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public play() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.scheduleNotes();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null && typeof window !== "undefined") {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  // Play general sound effects
  public playSfx(type: "click" | "correct" | "wrong") {
    if (type === "correct") {
      this.playCorrectSfx();
    } else if (type === "wrong") {
      this.playWrongSfx();
    } else {
      // Click SFX
      if (typeof window === "undefined") return;
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (err) {
        console.error("playSfx click error:", err);
      }
    }
  }

  // Play Kahoot Correct Answer Sound Effect (Happy Major Chime)
  public playCorrectSfx() {
    if (typeof window === "undefined") return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch (err) {
      console.error("playCorrectSfx error:", err);
    }
  }

  // Play Kahoot Wrong Answer Sound Effect (Low Buzz)
  public playWrongSfx() {
    if (typeof window === "undefined") return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (err) {
      console.error("playWrongSfx error:", err);
    }
  }

  private scheduleNotes() {
    if (typeof window === "undefined") return;

    const chords = [
      [261.63, 329.63, 392.0, 523.25], // C Major
      [220.0, 261.63, 329.63, 440.0],  // A Minor
      [174.61, 220.0, 261.63, 349.23], // F Major
      [196.0, 246.94, 293.66, 392.0],  // G Major
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      try {
        const currentChord = chords[chordIndex];
        const now = this.ctx.currentTime;

        currentChord.forEach((freq, i) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = i === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(0.001, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(i === 0 ? 0.15 : 0.08, now + i * 0.15 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.8);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 2.0);
        });

        chordIndex = (chordIndex + 1) % chords.length;
      } catch {}
    };

    playChord();
    this.timerId = window.setInterval(playChord, 2200);
  }
}

export const rpgAudio = new RpgAudioEngine();
