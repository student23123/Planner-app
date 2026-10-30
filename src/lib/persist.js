import { LazyStore } from '@tauri-apps/plugin-store';

const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
const store = isTauri ? new LazyStore('planner.json', { defaults: {}, autoSave: false }) : null;
const KEY = 'planner-state';

/** @returns {Promise<{ok: boolean, data: any}>} */
export async function load() {
  try {
    if (store) return { ok: true, data: (await store.get('state')) ?? null };
    const raw = localStorage.getItem(KEY);
    return { ok: true, data: raw ? JSON.parse(raw) : null };
  } catch (e) {
    console.error('load failed', e);
    return { ok: false, data: null };
  }
}

let pending = null;
let timer = null;

async function write() {
  const snap = pending;
  pending = null;
  if (!snap) return;
  try {
    if (store) {
      await store.set('state', snap);
      await store.save();
    } else {
      localStorage.setItem(KEY, JSON.stringify(snap));
    }
  } catch (e) {
    console.error('save failed', e);
  }
}

export function save(snap) {
  pending = snap;
  clearTimeout(timer);
  timer = setTimeout(write, 400);
}

export function flush() {
  clearTimeout(timer);
  return write();
}
