// Simple procedural audio engine for arcade car racing game
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;

  // Sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private nitroOsc: OscillatorNode | null = null;
  private nitroGain: GainNode | null = null;

  private musicSequenceInterval: any = null;
  private musicPlaying = false;
  private tempo = 125; // BPM

  private sfxVolSetting = 0.5;
  private mainVolSetting = 0.6;

  constructor() {
    // Lazy loaded on first user interaction
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(this.sfxVolSetting, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn("Web Audio API is not supported", e);
    }
  }

  setSfxVolume(vol: number) {
    this.sfxVolSetting = vol;
    if (this.sfxVolume && this.ctx) {
      this.sfxVolume.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(vol: number) {
    if (this.musicVolume && this.ctx) {
      this.musicVolume.gain.setTargetAtTime(vol * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  startEngine() {
    this.initCtx();
    if (!this.ctx || this.engineOsc) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxVolume!);

      this.engineOsc.start(0);
    } catch (e) {
      console.error(e);
    }
  }

  updateEngine(speedRatio: number, isDrifting: boolean = false) {
    this.initCtx();
    if (!this.ctx) return;
    if (!this.engineOsc || !this.engineFilter || !this.engineGain) {
      this.startEngine();
      return;
    }

    try {
      // Base frequency is 50Hz, increments with speed ratio up to 220Hz
      const targetFreq = 48 + speedRatio * 180 + (isDrifting ? Math.sin(Date.now() * 0.05) * 8 : 0);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

      // Lowpass filter tracks engine frequency to keep it smooth/rumbly
      const filterFreq = 160 + speedRatio * 320;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.1);

      // Engine volume slightly increases with speed
      const targetGain = 0.04 + speedRatio * 0.08;
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    } catch (e) {
      // Ignore
    }
  }

  stopEngine() {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      this.engineGain = null;
      this.engineFilter = null;
    } catch (e) {}
  }

  setNitro(active: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    if (active) {
      if (this.nitroOsc) return;
      try {
        this.nitroOsc = this.ctx.createOscillator();
        this.nitroGain = this.ctx.createGain();

        this.nitroOsc.type = 'triangle';
        this.nitroOsc.frequency.setValueAtTime(130, this.ctx.currentTime);
        this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

        this.nitroOsc.connect(this.nitroGain);
        this.nitroGain.connect(this.sfxVolume);
        this.nitroOsc.start();

        // High frequency modulation for "jet rushing" effect
        this.nitroOsc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 1.0);
        this.nitroGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.3);
      } catch (e) {}
    } else {
      if (!this.nitroOsc) return;
      try {
        this.nitroGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
        const osc = this.nitroOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        }, 200);
        this.nitroOsc = null;
        this.nitroGain = null;
      } catch (e) {}
    }
  }

  playCoin() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxVolume);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playCheckpoint() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major arpeggio
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    } catch (e) {}
  }

  playDrift() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

      // Pitch vibrato for screeching texture
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(45, now);
      lfoGain.gain.setValueAtTime(80, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(this.sfxVolume);

      lfo.start(now);
      osc.start(now);

      lfo.stop(now + 0.18);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playCrash() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Low noise rumbly thud
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      // Add high pass filtering layer or secondary crash tone
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      snareOsc.type = 'triangle';
      snareOsc.frequency.setValueAtTime(220, now);
      snareOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      snareGain.gain.setValueAtTime(0.15, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      snareOsc.connect(snareGain);

      gain.connect(this.sfxVolume);
      snareGain.connect(this.sfxVolume);

      osc.start(now);
      snareOsc.start(now);

      osc.stop(now + 0.5);
      snareOsc.stop(now + 0.4);
    } catch (e) {}
  }

  playWin() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      // High-energy positive arpeggio
      const notes = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77, 1318.51]; // E major
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }

  playLose() {
    this.initCtx();
    if (!this.ctx || !this.sfxVolume) return;

    try {
      const now = this.ctx.currentTime;
      // Melancholic sliding descending nodes
      const notes = [311.13, 293.66, 277.18, 220.00]; // descending minor vibe
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);
        osc.frequency.linearRampToValueAtTime(freq - 30, now + idx * 0.2 + 0.25);

        gain.gain.setValueAtTime(0.08, now + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxVolume!);
        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 0.3);
      });
    } catch (e) {}
  }

  // Interactive background synth loop
  startMusic() {
    this.initCtx();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    let step = 0;
    const bassline = [110, 110, 110, 110, 130, 130, 146.83, 146.83, 110, 110, 164.81, 164.81, 130, 110, 110, 110]; // A2, C3, D3, E3 bassline
    const melody = [
      440, 0, 440, 523.25, 0, 587.33, 0, 659.25,
      0, 659.25, 587.33, 523.25, 440, 0, 392, 440
    ]; // A4 mel

    const stepDuration = 60 / this.tempo / 2; // Eighth notes

    const playSequenceStep = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicVolume) return;
      const now = this.ctx.currentTime;

      // 1. Bass hit (always plays a steady pulse)
      const bassFreq = bassline[step % bassline.length];
      if (bassFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bassFreq / 2, now); // Sub-bass
        
        bGain.gain.setValueAtTime(0.3, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);
        
        bOsc.connect(bGain);
        bGain.connect(this.musicVolume);
        
        bOsc.start(now);
        bOsc.stop(now + stepDuration);
      }

      // 2. Melody synth layered over top
      const melFreq = melody[step % melody.length];
      if (melFreq > 0 && Math.random() > 0.15) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(melFreq, now);

        mGain.gain.setValueAtTime(0.06, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);

        mOsc.connect(mGain);
        mGain.connect(this.musicVolume);

        mOsc.start(now);
        mOsc.stop(now + stepDuration * 2);
      }

      // 3. Simple hi-hat (noise-like synth click)
      if (step % 2 === 1) {
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        const clickFilter = this.ctx.createBiquadFilter();

        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(8000, now);

        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(10000, now);

        clickGain.gain.setValueAtTime(0.004, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.musicVolume);

        clickOsc.start(now);
        clickOsc.stop(now + 0.05);
      }

      step++;
      const timeToNext = (stepDuration * 1000);
      this.musicSequenceInterval = setTimeout(playSequenceStep, timeToNext);
    };

    playSequenceStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicSequenceInterval) {
      clearTimeout(this.musicSequenceInterval);
      this.musicSequenceInterval = null;
    }
  }

  resumeContext() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const gameAudio = new AudioEngine();
