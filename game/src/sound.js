// Ember Court — sound.js
// Synthesised WebAudio blips: no audio files, nothing fetched. A tiny
// oscillator envelope per effect; M or the mute button silences them all.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// A short tone: frequency slides from `from` to `to` over `seconds`.
function blip(from, to, seconds, type, gainValue) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const sfx = {
  select() {
    blip(520, 660, 0.07, 'sine', 0.08);
  },
  play() {
    blip(330, 495, 0.12, 'triangle', 0.12);
  },
  kindle() {
    blip(392, 784, 0.22, 'sine', 0.14);
    setTimeout(() => blip(523, 1046, 0.18, 'sine', 0.08), 70);
  },
  burn() {
    blip(220, 55, 0.3, 'sawtooth', 0.07);
  },
  flare() {
    blip(660, 1320, 0.16, 'sine', 0.1);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, f * 1.01, 0.22, 'triangle', 0.12), i * 110));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, f * 0.94, 0.25, 'triangle', 0.1), i * 130));
  },
};
