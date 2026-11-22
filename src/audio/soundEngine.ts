class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private chordIndex = 0;
  private lastMoveSoundAt = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private createSoftNoise(ctx: AudioContext, durationSec: number): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      // Pink/brown-ish smoothing so noise is warm, not hissy
      data[i] = (lastOut + 0.08 * white) / 1.08;
      lastOut = data[i] ?? 0;
      data[i] = (data[i] ?? 0) * 2.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  /** צליל מנוע/גלישה עדין בזמן תנועה או גרירה */
  public playEngineMove(intensity = 1): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const nowMs = performance.now();
    // מניעת הצפה בזמן גרירה רציפה בעכבר/אצבע
    if (nowMs - this.lastMoveSoundAt < 85) return;
    this.lastMoveSoundAt = nowMs;

    const now = ctx.currentTime;
    const clamped = Math.max(0.5, Math.min(1.4, intensity));

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "triangle";

    const baseFreq = 72 * clamped;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.24, now + 0.09);

    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.09);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + 0.08);
    filter.Q.setValueAtTime(1.8, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }

  /** צליל התנגשות עמום (מתאים גם למכוניות בלתי נראות / חסימה) */
  public playCollision(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // חלק 1: חבטה נמוכה ועמומה
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = "sine";
    thudOsc.frequency.setValueAtTime(125, now);
    thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);

    thudGain.gain.setValueAtTime(0.0001, now);
    thudGain.gain.linearRampToValueAtTime(0.24, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.16);

    // חלק 2: חיכוך/מגע רך של פגוש
    const noise = this.createSoftNoise(ctx, 0.11);
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(340, now);
    filter.Q.setValueAtTime(1.2, now);

    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.16, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.11);
  }

  /** צליל נעים לשחרור מכונית */
  public playCarReleased(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Cmaj7 רך ונעים
    const chord = [261.63, 329.63, 392.0, 493.88];

    chord.forEach((freq, idx) => {
      const start = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.065, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /** מנגינת סיום שלב רכה */
  public playWin(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.085, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.38);
    });
  }

  /** מוזיקת רקע רגועה ונעימה (אקורדים רכים ומסוננים) */
  public startMusic(): void {
    if (this.muted || this.musicTimer !== null) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const chords: readonly (readonly number[])[] = [
      [196.0, 246.94, 293.66], // Gmaj
      [164.81, 246.94, 293.66], // Em7
      [130.81, 196.0, 246.94], // Cmaj7
      [146.83, 220.0, 293.66], // D6 / D
    ];

    const playChord = () => {
      if (this.muted || !this.ctx) return;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const chord = chords[this.chordIndex % chords.length] ?? [196.0, 246.94, 293.66];
      this.chordIndex += 1;

      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(520, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.028, now + 0.35);
        gain.gain.linearRampToValueAtTime(0.022, now + 1.45);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.2);
      });
    };

    playChord();
    this.musicTimer = window.setInterval(playChord, 2100);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();