// Futuristic Sci-Fi Web Audio API Synthesizer
// Provides dynamic, zero-dependency sound synthesis for the robotics laboratory.

class LabAudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.isMuted = false;
  }

  // Initialize Audio Context on user interaction
  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(mute ? 0 : 0.08, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  // Synthesize a low-frequency sci-fi ambient drone
  playAmbientHum() {
    this.init();
    if (!this.ctx || this.isMuted || this.ambientNode) return;

    try {
      // Oscillator 1: Deep base carrier
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      // Oscillator 2: Detuned chorus effect
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(55.3, this.ctx.currentTime); // Slightly detuned

      // Filter: Cutoff high frequencies for a warm, deep drone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      // Low Frequency Oscillator (LFO) to create a pulsing/breathing effect
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 0.2Hz (5 seconds cycle)
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(30, this.ctx.currentTime); // Modulate filter by 30Hz

      // Master Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      // Connections
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      // Start oscillators
      osc1.start(0);
      osc2.start(0);
      lfo.start(0);

      // Keep references to stop them later
      this.ambientNode = { osc1, osc2, lfo, filter };
    } catch (e) {
      console.warn('Failed to start ambient hum:', e);
    }
  }

  stopAmbientHum() {
    if (this.ambientNode) {
      try {
        this.ambientNode.osc1.stop();
        this.ambientNode.osc2.stop();
        this.ambientNode.lfo.stop();
      } catch (e) {}
      this.ambientNode = null;
      this.ambientGain = null;
    }
  }

  // Synthesize a pneumatic door release (hissing air + mechanical click)
  playDoorOpen() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Air Hiss (White Noise)
      const bufferSize = this.ctx.sampleRate * 2.5; // 2.5 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1000, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 2.2);
      noiseFilter.Q.setValueAtTime(2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseNode.start(now);

      // 2. Heavy mechanical rumble
      const rumble = this.ctx.createOscillator();
      rumble.type = 'triangle';
      rumble.frequency.setValueAtTime(60, now);
      rumble.frequency.linearRampToValueAtTime(30, now + 1.8);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.2, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      rumble.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);
      rumble.start(now);
      rumble.stop(now + 2.0);

      // 3. Initial metallic latch click
      this.playComputerBeep(120, 0.05, 0.15);
      setTimeout(() => this.playComputerBeep(90, 0.08, 0.1), 100);
    } catch (e) {
      console.warn('Failed to play door sound:', e);
    }
  }

  // Synthesize a high-tech interface beep/click
  playComputerBeep(freq = 880, duration = 0.1, volume = 0.05, type = 'sine') {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      // Pitch envelope for tech clicks (slight downward sweep)
      if (type === 'sine' && freq > 400) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, this.ctx.currentTime + duration);
      }

      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration + 0.05);
    } catch (e) {}
  }

  // Synthesize a sonar-like radar sweeping ping
  playRadarPing() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const delayGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);

      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      // Create a subtle high-tech echo/delay
      delay.delayTime.setValueAtTime(0.15, now);
      delayGain.gain.setValueAtTime(0.015, now);
      delayGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Echo routing
      gainNode.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  // Interface click feedback
  playUiClick() {
    this.playComputerBeep(1800, 0.03, 0.03, 'sine');
  }

  // Hover tick sound
  playHoverTick() {
    this.playComputerBeep(2400, 0.008, 0.012, 'sine');
  }

  // Data transmission chirp
  playDataTransmit() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const timeOffset = i * 0.06;
        const freq = 1000 + i * 250;
        setTimeout(() => {
          this.playComputerBeep(freq, 0.04, 0.02, 'sine');
        }, timeOffset * 1000);
      }
    } catch (e) {}
  }
}

export const audio = new LabAudioEngine();
