import { ymd, uid, addDays, PALETTE } from './util.js';

export const FOCUS = 25 * 60 * 1000;
export const BREAK = 5 * 60 * 1000;

export const app = $state({
  days: {},
  events: [],
  ddays: [],
  stamps: [],
  timer: { phase: 'focus', status: 'idle', endAt: 0, remaining: FOCUS, focusMode: false },
});

export const meta = $state({ ready: false, loadError: false });

export const clock = $state({ now: Date.now(), today: ymd(new Date()) });

const EMPTY = Object.freeze({ todos: [], focus: 0, stamp: null });

export function hydrate(result) {
  if (!result.ok) {
    meta.loadError = true;
  } else if (result.data) {
    for (const k of Object.keys(app)) {
      if (result.data[k] !== undefined) app[k] = result.data[k];
    }
  }
  meta.ready = true;
}

export function dayOf(date) {
  return app.days[date] ?? EMPTY;
}

export function ensureDay(date) {
  if (!app.days[date]) {
    const todos = [];
    if (date === clock.today) {
      const prev = Object.keys(app.days).filter((k) => k < date).sort().pop();
      if (prev) {
        for (const t of app.days[prev].todos) {
          if (t.carry && (t.mark === 'x' || t.mark === 't')) {
            todos.push({ id: uid(), text: t.text, mark: null, carry: false, from: t.id });
          }
        }
      }
    }
    app.days[date] = { todos, focus: 0, stamp: null };
  }
  return app.days[date];
}

/* ---------- todos ---------- */

export function addTodo(text) {
  ensureDay(clock.today).todos.push({ id: uid(), text, mark: null, carry: false });
}

function unlinkCarry(date, todo) {
  const next = app.days[addDays(date, 1)];
  if (!next) return;
  const i = next.todos.findIndex((x) => x.from === todo.id && x.mark === null);
  if (i >= 0) next.todos.splice(i, 1);
}

export function removeTodo(date, id) {
  const d = app.days[date];
  if (!d) return;
  const i = d.todos.findIndex((t) => t.id === id);
  if (i < 0) return;
  if (d.todos[i].carry) unlinkCarry(date, d.todos[i]);
  d.todos.splice(i, 1);
}

export function setMark(date, todo, mark) {
  todo.mark = todo.mark === mark ? null : mark;
  if (todo.carry && todo.mark !== 'x' && todo.mark !== 't') {
    todo.carry = false;
    unlinkCarry(date, todo);
  }
}

export function setCarry(date, todo, value) {
  todo.carry = value;
  const next = app.days[addDays(date, 1)];
  if (!next) return;
  if (value) {
    if (!next.todos.some((x) => x.from === todo.id)) {
      next.todos.push({ id: uid(), text: todo.text, mark: null, carry: false, from: todo.id });
    }
  } else {
    unlinkCarry(date, todo);
  }
}

/* ---------- stamps ---------- */

export function addStamp(img) {
  const s = { id: uid(), src: img.src, w: img.w, h: img.h };
  app.stamps.push(s);
  return s;
}

export function setStamp(date, id) {
  ensureDay(date).stamp = id;
}

export function removeStamp(id) {
  app.stamps = app.stamps.filter((s) => s.id !== id);
  for (const d of Object.values(app.days)) if (d.stamp === id) d.stamp = null;
}

/* ---------- events ---------- */

export function addEvent({ title, date, time }) {
  app.events.push({ id: uid(), title, date, time: time || '' });
}

export function removeEvent(id) {
  app.events = app.events.filter((e) => e.id !== id);
}

/* ---------- d-day ---------- */

export function addDday({ title, date, photo }) {
  app.ddays.push({
    id: uid(),
    title,
    date,
    photo: photo || null,
    color: Math.floor(Math.random() * PALETTE.length),
  });
}

export function removeDday(id) {
  app.ddays = app.ddays.filter((d) => d.id !== id);
}
