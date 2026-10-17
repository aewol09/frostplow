/**
 * Web Audio API synthesizer for FrostPlow.
 * 100% procedural: cozy ambient chords, crunching snow plow noise,
 * pentatonic combo chimes, turbo boost jet, and coin/shop sounds.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Ambient music state
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private currentChordIndex: number = 0;

  // Snow plowing continuous crunch generator
  private snowNoiseNode: AudioBufferSourceNode | null = null;
  private snowNoiseGain: GainNode | null = null;
  private snowFilterNode: BiquadFilterNode | null = null;

  // Turbo jet continuous generator
  private jetGain: GainNode | null = null;
  private jetFilter: BiquadFilterNode | null = null;

  constructor() {
    // Lazily initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupContinuousPlowSound();
    } catch {
      // Audio not supported or blocked
    }
  }

  private setupContinuousPlowSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Create a 2-second looping white/pink noise buffer for snow crunching
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter towards pink noise for soft snow crunch
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.snowNoiseNode = this.ctx.createBufferSource();
    this.snowNoiseNode.buffer = noiseBuffer;
    this.snowNoiseNode.loop = true;

    this.snowFilterNode = this.ctx.createBiquadFilter();
    this.snowFilterNode.type = 'bandpass';
    this.snowFilterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.snowFilterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.snowNoiseGain = this.ctx.createGain();
    this.snowNoiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.snowNoiseNode.connect(this.snowFilterNode);
    this.snowFilterNode.connect(this.snowNoiseGain);
    this.snowNoiseGain.connect(this.sfxGain);

    this.snowNoiseNode.start();
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isMusicPlaying) {
      this.startAmbientMusic();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Modulate continuous snow plowing crunch sound based on vehicle speed & plowing state.
   */
  public updatePlowingSound(isPlowing: boolean, speedRatio: number) {
    if (!this.ctx || !this.snowNoiseGain || !this.snowFilterNode) return;

    const targetGain = isPlowing ? Math.min(speedRatio * 0.45, 0.45) : 0;
    const targetFreq = 500 + speedRatio * 900;

    this.snowNoiseGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    this.snowFilterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  /**
   * Cozy procedural synth ambient chords (Cmaj7 -> Am7 -> Dm7 -> Gsus4).
   * Generates warm, nostalgic winter warmth.
   */
  public startAmbientMusic() {
    this.initContext();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    const chords = [
      // Cmaj7 (C3, G3, B3, E4)
      [130.81, 196.00, 246.94, 329.63],
      // Am7 (A2, E3, G3, C4)
      [110.00, 164.81, 196.00, 261.63],
      // Fmaj7 (F2, C3, A3, E4)
      [87.31, 130.81, 220.00, 329.63],
      // G7sus4 (G2, D3, F3, C4)
      [98.00, 146.83, 174.61, 261.63],
    ];

    const playNextChord = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;

      const chord = chords[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;

      const duration = 4.2; // chord length
      const now = this.ctx.currentTime;

      // Play soft warm sine/triangle pad voices
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900 + idx * 200, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + duration + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration + 1.0);
      });

      // Play a gentle bell arpeggio note halfway through
      const bellFreqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
      const randomBell = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];
      setTimeout(() => {
        if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
        this.playSoftBell(randomBell);
      }, 1800);

      this.musicTimer = window.setTimeout(playNextChord, duration * 1000 - 400);
    };

    playNextChord();
  }

  private playSoftBell(freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 1.8);
  }

  /**
   * Pentatonic combo chime. The pitch steps up higher as multiplier increases!
   */
  public playComboChime(multiplier: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const baseFrequencies = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.5, // C6
    ];

    // Pick note based on multiplier
    const index = Math.min(Math.floor((multiplier - 1.0) * 2.5), baseFrequencies.length - 1);
    const freq = baseFrequencies[Math.max(0, index)];

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = multiplier >= 3.0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Subtle vibrato on higher tiers
    if (multiplier >= 3.0) {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.15);
    }

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Sound when collecting buried treasure (cocoa, mittens, coins).
   */
  public playItemSparkle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [587.33, 739.99, 880.0, 1174.66];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  /**
   * Turbo boost ignition sound.
   */
  public playBoostWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Purchase upgrade / cash register chime.
   */
  public playUpgradeSuccess() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chords = [392.00, 523.25, 659.25, 1046.5];
    const now = this.ctx.currentTime;

    chords.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.15, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.5);
    });
  }

  /**
   * District Complete Victory fanfare!
   */
  public playVictoryFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    // Cozy uplifting brass/bell fanfare
    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;

    arpeggio.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.2, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.75);
    });
  }

  /**
   * Mechanical ticker sound for Lucky Spin Wheel pegs passing the pointer.
   */
  public playWheelTick(highPitch: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(highPitch ? 1250 : 820, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Sparkling coin collection sound for prize claims.
   */
  public playCoinJingle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const notes = [987.77, 1318.51, 1567.98]; // B5, E6, G6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  }

  public stopAll() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.snowNoiseGain && this.ctx) {
      this.snowNoiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();
