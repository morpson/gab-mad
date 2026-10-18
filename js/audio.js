// GabMad Audio Engine: Web Audio synthesis (SFX + Lo-Fi Beats) & Speech Synthesis (TTS)

class GabAudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicFilter = null;
    this.vinylSrc = null;

    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.35;

    // Music playback state
    this.musicStarted = false;
    this.musicSchedTimer = null;
    this.nextBarTime = 0;
    this.barIndex = 0;
    this.mode = 'chill'; // 'chill' or 'fast'
    this.pendingMode = null;
    this.isPaused = false;

    // Progression: Rich party lo-fi chords
    // Am9 -> Fmaj9 -> Cmaj7 -> Gsus4/G9
    this.chordProgression = [
      { bass: 55.00, pad: [220.00, 261.63, 329.63, 392.00, 493.88] }, // Am9
      { bass: 43.65, pad: [174.61, 220.00, 261.63, 329.63, 392.00] }, // Fmaj9
      { bass: 65.41, pad: [196.00, 246.94, 293.66, 392.00, 493.88] }, // Cmaj7
      { bass: 49.00, pad: [196.00, 246.94, 293.66, 349.23, 440.00] }  // Gadd9
    ];
    this.leadScale = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

    // Auto-init on first user gesture
    this.bindUserGesture();
  }

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master busses
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxEnabled ? this.sfxVolume : 0.0;
      this.sfxBus.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = (this.musicEnabled && !this.isPaused) ? this.musicVolume : 0.0;

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1600;
      this.musicFilter.Q.value = 0.5;

      this.musicFilter.connect(this.musicBus);
      this.musicBus.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  bindUserGesture() {
    const unlock = () => {
      this.getContext();
      if (this.musicEnabled && !this.musicStarted) {
        this.startMusic();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  /* ================= SFX GENERATOR ================= */
  playTone(freq, duration, type = 'sine', vol = 0.2, delay = 0, slideFreq = null) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, slideFreq), t0 + duration);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(this.sfxBus);

    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  playNoise(duration, fromFreq, toFreq, vol = 0.15) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;

    const t0 = ctx.currentTime;
    filter.frequency.setValueAtTime(fromFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(toFreq, t0 + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);

    noise.start(t0);
    noise.stop(t0 + duration + 0.05);
  }

  // Pre-configured Sound Effects
  click() {
    this.playTone(650, 0.05, 'triangle', 0.12);
  }

  flip() {
    this.playNoise(0.22, 1800, 450, 0.14);
  }

  deal() {
    this.playNoise(0.18, 500, 2200, 0.16);
  }

  tick() {
    this.playTone(980, 0.04, 'square', 0.08);
  }

  urgentTick() {
    this.playTone(1320, 0.045, 'sawtooth', 0.12);
    this.playTone(880, 0.045, 'triangle', 0.1, 0.025);
  }

  buzzer() {
    this.playTone(145, 0.45, 'sawtooth', 0.22, 0);
    this.playTone(110, 0.45, 'sawtooth', 0.2, 0);
    this.playTone(145, 0.35, 'sawtooth', 0.2, 0.5);
    this.playTone(110, 0.35, 'sawtooth', 0.18, 0.5);
  }

  correct() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((f, i) => {
      this.playTone(f, 0.25, 'triangle', 0.18, i * 0.06);
    });
  }

  wrong() {
    this.playTone(415.30, 0.22, 'triangle', 0.15, 0);
    this.playTone(349.23, 0.22, 'triangle', 0.15, 0.15);
    this.playTone(277.18, 0.45, 'triangle', 0.18, 0.3, 240);
  }

  pointScored() {
    this.playTone(520, 0.12, 'sine', 0.22, 0, 920);
    this.playTone(780, 0.15, 'triangle', 0.16, 0.04, 1040);
  }

  pointDeducted() {
    this.playTone(320, 0.16, 'sine', 0.15, 0, 180);
  }

  fanfare() {
    const melody = [
      { f: 523.25, d: 0.12, delay: 0 },
      { f: 523.25, d: 0.12, delay: 0.12 },
      { f: 523.25, d: 0.12, delay: 0.24 },
      { f: 659.25, d: 0.22, delay: 0.36 },
      { f: 783.99, d: 0.14, delay: 0.60 },
      { f: 659.25, d: 0.20, delay: 0.74 },
      { f: 783.99, d: 0.22, delay: 0.96 },
      { f: 1046.50, d: 0.65, delay: 1.20 }
    ];
    melody.forEach(m => {
      this.playTone(m.f, m.d, 'triangle', 0.22, m.delay);
    });
    this.playTone(1318.51, 0.7, 'sine', 0.16, 1.22);
  }

  /* ================= LO-FI BEAT ENGINE ================= */
  setMusicMode(mode) {
    if (this.mode === mode && !this.pendingMode) return;
    this.pendingMode = mode;
    const filterFreq = mode === 'fast' ? 2400 : 1500;
    if (this.musicFilter && this.ctx) {
      this.musicFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.3);
    }
  }

  getTempo() {
    return this.mode === 'fast' ? 124 : 74;
  }

  getBarDuration() {
    return (60 / this.getTempo()) * 4;
  }

  startVinylNoise(ctx) {
    const sampleRate = ctx.sampleRate;
    const duration = 4.0;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = lastOut * 0.95 + white * 0.05;
      data[i] = lastOut * 0.45;

      // Random pops and crackles
      if (Math.random() < 0.0005) {
        const popAmp = (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? 1 : -1);
        const popDecay = 20 + Math.floor(Math.random() * 60);
        for (let p = 0; p < popDecay && (i + p) < bufferSize; p++) {
          data[i + p] += popAmp * (1 - p / popDecay);
        }
        i += popDecay;
      }
    }

    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = buffer;
    vinylSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.value = 0.045;

    vinylSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    vinylSource.start();
    this.vinylSrc = vinylSource;
  }

  playPadChord(ctx, freqs, t0, dur) {
    freqs.forEach(freq => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.5);
      g.gain.setValueAtTime(0.045, Math.max(t0 + 0.5, t0 + dur - 0.6));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      g.connect(this.musicFilter);

      [1, 1.002].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * mult, t0);
        osc.connect(g);
        osc.start(t0);
        osc.stop(t0 + dur + 0.1);
      });
    });
  }

  playBassNote(ctx, freq, t0, dur) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(this.musicFilter);

    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  playPluckNote(ctx, freq, t0) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);

    osc.connect(g);
    g.connect(this.musicFilter);

    osc.start(t0);
    osc.stop(t0 + 0.9);
  }

  playKick(ctx, t0) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.1);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.24, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);

    osc.connect(g);
    g.connect(this.musicBus);

    osc.start(t0);
    osc.stop(t0 + 0.28);
  }

  playSnare(ctx, t0) {
    const len = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.9;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);

    noise.start(t0);
    noise.stop(t0 + 0.16);
  }

  playHat(ctx, t0, vol = 0.05) {
    const len = Math.floor(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const g = ctx.createGain();
    g.gain.value = vol;

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);

    noise.start(t0);
    noise.stop(t0 + 0.05);
  }

  scheduleBar(ctx, barIdx, t0) {
    const bs = this.getBarDuration();
    const beat = bs / 4;
    const chord = this.chordProgression[barIdx % this.chordProgression.length];

    if (this.mode === 'fast') {
      // Energetic countdown rhythm
      this.playPadChord(ctx, chord.pad, t0, bs * 0.95);
      for (let i = 0; i < 4; i++) {
        this.playKick(ctx, t0 + beat * i);
        this.playBassNote(ctx, chord.bass * (i % 2 === 1 ? 1.5 : 1.0), t0 + beat * i, beat * 0.85);
      }
      this.playSnare(ctx, t0 + beat * 1);
      this.playSnare(ctx, t0 + beat * 3);
      for (let h = 0; h < 8; h++) {
        this.playHat(ctx, t0 + (bs / 8) * h, h % 2 === 1 ? 0.035 : 0.06);
      }
      const plucks = 2 + Math.floor(Math.random() * 2);
      for (let p = 0; p < plucks; p++) {
        const note = this.leadScale[Math.floor(Math.random() * this.leadScale.length)];
        this.playPluckNote(ctx, note, t0 + beat * (0.5 + Math.random() * 3));
      }
    } else {
      // Chill lounge lo-fi
      this.playPadChord(ctx, chord.pad, t0, bs + 0.3);
      this.playBassNote(ctx, chord.bass, t0, bs * 0.55);
      this.playBassNote(ctx, chord.bass, t0 + bs * 0.5, bs * 0.4);
      this.playKick(ctx, t0);
      this.playKick(ctx, t0 + beat * 2);
      for (let h = 0; h < 4; h++) {
        this.playHat(ctx, t0 + beat * (h + 0.5), 0.045);
      }
      if (barIdx % 2 === 1) {
        const note = this.leadScale[Math.floor(Math.random() * this.leadScale.length)];
        this.playPluckNote(ctx, note, t0 + beat * (1.2 + Math.random() * 2));
      }
    }
  }

  startMusic() {
    if (this.musicStarted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.startVinylNoise(ctx);
    this.musicStarted = true;
    this.nextBarTime = ctx.currentTime + 0.15;
    this.barIndex = 0;

    this.musicSchedTimer = setInterval(() => {
      if (!this.ctx || !this.musicStarted) return;
      while (this.nextBarTime < this.ctx.currentTime + 1.2) {
        if (this.pendingMode) {
          this.mode = this.pendingMode;
          this.pendingMode = null;
        }
        this.scheduleBar(this.ctx, this.barIndex, this.nextBarTime);
        this.nextBarTime += this.getBarDuration();
        this.barIndex++;
      }
    }, 250);
  }

  pauseMusic(paused) {
    this.isPaused = paused;
    this.updateGains();
  }

  duckMusic(ducked) {
    if (!this.musicBus || !this.ctx) return;
    const target = (this.musicEnabled && !this.isPaused) ? (ducked ? this.musicVolume * 0.2 : this.musicVolume) : 0.0;
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.updateGains();
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (enabled && !this.musicStarted) {
      this.startMusic();
    }
    this.updateGains();
  }

  updateGains() {
    if (!this.ctx) return;
    if (this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVolume : 0.0, this.ctx.currentTime, 0.1);
    }
    if (this.musicBus) {
      const vol = (this.musicEnabled && !this.isPaused) ? this.musicVolume : 0.0;
      this.musicBus.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.2);
    }
  }

  /* ================= SPEECH SYNTHESIS (TTS) ================= */
  speakPhonetic(text, onStart = null, onEnd = null) {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  cancelSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// Global audio engine singleton
const audio = new GabAudioEngine();
window.gabAudio = audio;
