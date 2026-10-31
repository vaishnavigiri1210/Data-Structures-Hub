class SoundEngine {
  private audioCtx: AudioContext | null = null;
  public masterVolume = 0.65;

  private init() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public playTone(
    freq: number,
    type: OscillatorType = "triangle",
    duration = 0.14,
    startVol = 0.28,
  ) {
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const effectiveVol = startVol * this.masterVolume;
      gain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioCtx.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {}
  }

  public playInsert() {
    this.playTone(523.25, "triangle", 0.12, 0.35);
    setTimeout(() => this.playTone(783.99, "triangle", 0.16, 0.32), 65);
  }

  public playDelete() {
    this.playTone(329.63, "triangle", 0.1, 0.32);
    setTimeout(() => this.playTone(220.0, "triangle", 0.14, 0.3), 60);
  }

  public playStep() {
    this.playTone(880.0, "sine", 0.06, 0.22);
  }

  public playSuccess() {
    this.playTone(698.46, "triangle", 0.1, 0.3);
    setTimeout(() => this.playTone(880.0, "triangle", 0.12, 0.3), 50);
    setTimeout(() => this.playTone(1046.5, "triangle", 0.22, 0.35), 110);
  }

  public playError() {
    this.playTone(174.61, "sawtooth", 0.18, 0.25);
  }
}

export const soundEngine = new SoundEngine();
