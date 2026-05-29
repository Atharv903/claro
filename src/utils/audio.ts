/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple, low-level Web Audio API synthesizer for premium UI auditory feedback
let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;
let ambientNodes: {
  oscillators: OscillatorNode[];
  gain: GainNode;
  filter: BiquadFilterNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
} | null = null;

export type AmbientSound = 'breath' | 'rain' | 'forest' | 'white-noise' | 'brown-noise';

export function toggleAudioEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
}

export function getAudioEnabled(): boolean {
  return isSoundEnabled;
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Crisp, low-frequency subtle haptic "tick"
export function triggerHaptic(strength: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (strength === 'light') {
        window.navigator.vibrate(12);
      } else if (strength === 'medium') {
        window.navigator.vibrate(25);
      } else if (strength === 'heavy') {
        window.navigator.vibrate(50);
      } else if (strength === 'success') {
        window.navigator.vibrate([15, 30, 15]);
      } else if (strength === 'warning') {
        window.navigator.vibrate([35, 45, 35]);
      } else if (strength === 'error') {
        window.navigator.vibrate([50, 25, 50, 25, 75]);
      }
    } catch (e) {
      // Ignore block violations or missing capabilities silently
    }
  }
}

export function playTick() {
  triggerHaptic('light');
  if (!isSoundEnabled) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    // Deep but extremely short, mimicking Apple's Taptic Engine
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (error) {
    console.warn('Web Audio Playback blocked or failed:', error);
  }
}

// Crisp, high-frequency subtle "snap" or checklist "click"
export function playSnap() {
  triggerHaptic('medium');
  if (!isSoundEnabled) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    // ignore
  }
}

// Satisfying high-pitched chime (resembling Apple Fitness Ring Closure)
export function playSuccessChime() {
  triggerHaptic('success');
  if (!isSoundEnabled) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;

    // Play a dual-tone warm chord
    const playTone = (freq: number, startOffset: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      
      gainNode.gain.setValueAtTime(0.001, now + startOffset);
      gainNode.gain.linearRampToValueAtTime(volume, now + startOffset + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.05);
    };

    // Warm, positive major triad chord (E5, G#5, B5) sliding up to E6
    playTone(659.25, 0, 0.4, 0.08);       // E5
    playTone(830.61, 0.05, 0.45, 0.06);     // G#5
    playTone(987.77, 0.10, 0.5, 0.06);      // B5
    playTone(1318.51, 0.18, 0.6, 0.05);     // E6 (High resolved note)
  } catch (error) {
    console.warn('Web Audio Success Chime failed:', error);
  }
}

// Grand celebratory synthesizer sound layer for special streak milestones
export function playCelebrationFanfare() {
  triggerHaptic('heavy');
  if (!isSoundEnabled) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;

    // Successive arpeggio: C5 -> E5 -> G5 -> C6 -> E6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gainNode.gain.setValueAtTime(0.001, now + idx * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.07, now + idx * 0.1 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.7);
    });
  } catch (err) {
    // ignore
  }
}

export function startAmbientSound(sound: AmbientSound = 'breath') {
  if (!isSoundEnabled || ambientNodes) return;

  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = sound === 'white-noise' ? 'highpass' : 'lowpass';
    filter.frequency.setValueAtTime(sound === 'forest' ? 980 : sound === 'rain' ? 760 : sound === 'white-noise' ? 1400 : sound === 'brown-noise' ? 420 : 620, now);
    filter.Q.setValueAtTime(sound === 'breath' ? 0.8 : 1.2, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(sound === 'white-noise' ? 0.018 : 0.035, now + 1.2);

    filter.connect(gain);
    gain.connect(ctx.destination);

    const profiles: Record<AmbientSound, Array<{ freq: number; type: OscillatorType; detune?: number }>> = {
      breath: [
        { freq: 110, type: 'sine', detune: -3 },
        { freq: 146.83, type: 'triangle' },
        { freq: 220, type: 'sine', detune: 4 },
      ],
      rain: [
        { freq: 174, type: 'sine', detune: -6 },
        { freq: 233.08, type: 'triangle', detune: 5 },
        { freq: 329.63, type: 'sine' },
      ],
      forest: [
        { freq: 196, type: 'sine' },
        { freq: 261.63, type: 'triangle', detune: -4 },
        { freq: 392, type: 'sine', detune: 7 },
      ],
      'white-noise': [
        { freq: 330, type: 'sawtooth', detune: -8 },
        { freq: 493.88, type: 'triangle' },
        { freq: 659.25, type: 'sawtooth', detune: 9 },
      ],
      'brown-noise': [
        { freq: 82.41, type: 'sine', detune: -5 },
        { freq: 123.47, type: 'triangle' },
        { freq: 164.81, type: 'sine', detune: 6 },
      ],
    };

    const oscillators = profiles[sound].map(({ freq, type, detune = 0 }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);
      osc.connect(filter);
      osc.start(now);
      return osc;
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(sound === 'breath' ? 0.08 : 0.035, now);
    lfoGain.gain.setValueAtTime(sound === 'breath' ? 90 : 35, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);

    ambientNodes = { oscillators, gain, filter, lfo, lfoGain };
  } catch (error) {
    console.warn('Ambient sound failed:', error);
  }
}

export function startAmbientBreathPad() {
  startAmbientSound('breath');
}

export function stopAmbientBreathPad() {
  if (!ambientNodes || !audioCtx) return;

  try {
    const now = audioCtx.currentTime;
    ambientNodes.gain.gain.cancelScheduledValues(now);
    ambientNodes.gain.gain.setValueAtTime(ambientNodes.gain.gain.value, now);
    ambientNodes.gain.gain.linearRampToValueAtTime(0.001, now + 0.7);
    ambientNodes.oscillators.forEach((osc) => {
      osc.stop(now + 0.8);
    });
    ambientNodes.lfo?.stop(now + 0.8);
  } catch {
    // ignore
  } finally {
    ambientNodes = null;
  }
}
