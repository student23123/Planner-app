import { app, FOCUS, BREAK, ensureDay } from './state.svelte.js';
import { ymd } from './util.js';

let audio = null;

function unlockAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
  } catch {}
}

function beep() {
  try {
    if (!audio) return;
    const t0 = audio.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = 880;
      const s = t0 + i * 0.35;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.3);
      o.connect(g).connect(audio.destination);
      o.start(s);
      o.stop(s + 0.32);
    }
  } catch {}
}

function reset() {
  const t = app.timer;
  t.status = 'idle';
  t.phase = 'focus';
  t.remaining = FOCUS;
  t.endAt = 0;
}

export function start() {
  unlockAudio();
  const t = app.timer;
  t.phase = 'focus';
  t.status = 'running';
  t.endAt = Date.now() + FOCUS;
}

/** ■: ends the session; an unfinished focus is not counted */
export function stop() {
  reset();
}

export function togglePause() {
  const t = app.timer;
  const now = Date.now();
  if (t.status === 'running') {
    t.remaining = Math.max(0, t.endAt - now);
    t.status = 'paused';
  } else if (t.status === 'paused') {
    unlockAudio();
    t.endAt = now + t.remaining;
    t.status = 'running';
  }
}

export function toggleFocusMode() {
  app.timer.focusMode = !app.timer.focusMode;
}

export function remainingMs(now) {
  const t = app.timer;
  if (t.status === 'running') return Math.max(0, t.endAt - now);
  return t.remaining;
}

/** advances phases; also catches up after the app was in the background */
export function tick(now) {
  const t = app.timer;
  if (t.status !== 'running') return;
  let guard = 0;
  while (now >= t.endAt && guard++ < 500) {
    const fresh = now - t.endAt < 5000;
    if (t.phase === 'focus') {
      ensureDay(ymd(new Date(t.endAt))).focus += 1;
      if (fresh) beep();
      if (t.focusMode) {
        t.phase = 'break';
        t.endAt += BREAK;
      } else {
        reset();
        return;
      }
    } else {
      if (fresh) beep();
      if (t.focusMode) {
        t.phase = 'focus';
        t.endAt += FOCUS;
      } else {
        reset();
        return;
      }
    }
  }
}
