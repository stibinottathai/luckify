// Client-side Web Audio API Sound Synthesizer
// Lazily loaded to support SSR and auto-play policies.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // Standard AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended (common browser security constraint)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Fast pitch sweep for short wooden tick sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn("Audio sweep blocked or unsupported:", e);
  }
}

export function playDiceRoll() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low clatter frequency for dice impact
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {
    console.warn(e);
  }
}

export function playScratch() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Generate white noise dynamically
    const bufferSize = ctx.sampleRate * 0.05; // 0.05 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make scratch sound more friction-like (high pass + band pass)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 1.5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
    noiseSource.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn(e);
  }
}

export function playWinChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6 arpeggio

    notes.forEach((freq, index) => {
      const time = now + index * 0.08;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.12, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.start(time);
      osc.stop(time + 0.35);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playDudSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sad downward pitch sweep
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.warn(e);
  }
}

export function playGoldenDiceTrigger() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Sparkly upward arpeggio sweep
    const freqs = [349.23, 440.00, 523.25, 659.25, 880.00, 1046.50, 1318.51, 1760.00]; // F4, A4, C5, E5, A5, C6, E6, A6
    
    freqs.forEach((freq, idx) => {
      const time = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, time + 0.03);
      osc.frequency.linearRampToValueAtTime(freq, time + 0.06);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.08, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.start(time);
      osc.stop(time + 0.45);
    });

    // Deep heavy cinematic sub-bass sweep
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    subOsc.start(now);
    subOsc.stop(now + 1.5);
  } catch (e) {
    console.warn(e);
  }
}

export function playGoldenDiceRoll() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Deep resonant clatter for heavy golden dice rolling
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
    filter.Q.setValueAtTime(6, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.20, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn(e);
  }
}

export function playLegendaryReward() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Rich orchestral arpeggio chord progression
    const chord = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51]; // C4, E4, G4, B4, C5, E5, G5, B5, C6, E6
    
    chord.forEach((freq, idx) => {
      const time = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, time);

      filter.type = "peaking";
      filter.frequency.setValueAtTime(freq * 1.5, time);
      filter.Q.setValueAtTime(1.5, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.14, time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

      osc.start(time);
      osc.stop(time + 1.0);
    });

    // High golden sparkle bells
    const bellFreqs = [1567.98, 1975.53, 2093.00, 2637.02]; // G6, B6, C7, E7
    bellFreqs.forEach((freq, idx) => {
      const time = now + 0.6 + idx * 0.06;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.06, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.start(time);
      osc.stop(time + 0.6);
    });
  } catch (e) {
    console.warn(e);
  }
}

