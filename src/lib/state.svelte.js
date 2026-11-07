import { uid, addDays, logicalDate, PALETTE, SUBJECT_COLORS } from './util.js';

export const FOCUS = 25 * 60 * 1000;
export const BREAK = 5 * 60 * 1000;

const DEFAULT_SUBJECTS = ['기업법', '세법', '재무회계', '원가회계'].map((name, i) => ({
  id: `s${i}`,
  name,
  color: SUBJECT_COLORS[i],
}));

export const app = $state({
  days: {},
  events: [],
  ddays: [],
  stamps: [],
  subjects: DEFAULT_SUBJECTS,
  habits: [],
  habitLog: {},
  prefs: { lastSubject: null },
  timer: { phase: 'focus', status: 'idle', endAt: 0, remaining: FOCUS, focusMode: false },
});

export const meta = $state({ ready: false, loadError: false });

export const clock = $state({ now: Date.now(), today: logicalDate(Date.now()) });

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
            todos.push({ id: uid(), text: t.text, subject: t.subject ?? null, mark: null, carry: false, from: t.id });
          }
        }
      }
    }
    app.days[date] = { todos, focus: 0, stamp: null };
  }
  return app.days[date];
}

/* ---------- subjects ---------- */

export function subjectOf(id) {
  return id ? app.subjects.find((s) => s.id === id) ?? null : null;
}

export function addSubject(name) {
  const used = new Set(app.subjects.map((s) => s.color));
  const color = SUBJECT_COLORS.find((c) => !used.has(c)) ?? SUBJECT_COLORS[app.subjects.length % SUBJECT_COLORS.length];
  const s = { id: uid(), name, color };
  app.subjects.push(s);
  return s;
}

export function removeSubject(id) {
  app.subjects = app.subjects.filter((s) => s.id !== id);
  if (app.prefs.lastSubject === id) app.prefs.lastSubject = null;
}

/* ---------- todos ---------- */

export function addTodo(text, subject) {
  ensureDay(clock.today).todos.push({ id: uid(), text, subject: subject ?? null, mark: null, carry: false });
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

function applyMark(date, todo, mark) {
  todo.mark = mark;
  if (todo.carry && mark !== 'x' && mark !== 't') {
    todo.carry = false;
    unlinkCarry(date, todo);
  }
}

export function setMark(date, todo, mark) {
  applyMark(date, todo, todo.mark === mark ? null : mark);
}

const CYCLE = { null: 'o', o: 't', t: 'x', x: null };

/** ⏭ on the wheel: none → O → △ → X → none */
export function cycleMark(date, todo) {
  applyMark(date, todo, CYCLE[todo.mark ?? 'null'] ?? null);
}

export function updateTodo(date, id, { text, subject, mark }) {
  const todo = app.days[date]?.todos.find((t) => t.id === id);
  if (!todo) return;
  todo.text = text;
  todo.subject = subject ?? null;
  applyMark(date, todo, mark ?? null);
}

/** moves a todo so it ends up just before the row that was at index `target` (target = length → end) */
export function moveTodo(date, id, target) {
  const todos = app.days[date]?.todos;
  if (!todos) return;
  const from = todos.findIndex((t) => t.id === id);
  if (from < 0) return;
  const to = target > from ? target - 1 : target;
  if (to === from) return;
  const [t] = todos.splice(from, 1);
  todos.splice(to, 0, t);
}

export function setCarry(date, todo, value) {
  todo.carry = value;
  const next = app.days[addDays(date, 1)];
  if (!next) return;
  if (value) {
    if (!next.todos.some((x) => x.from === todo.id)) {
      next.todos.push({ id: uid(), text: todo.text, subject: todo.subject ?? null, mark: null, carry: false, from: todo.id });
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

/* ---------- habits ---------- */

export function addHabit(name) {
  app.habits.push({ id: uid(), name });
}

export function removeHabit(id) {
  app.habits = app.habits.filter((h) => h.id !== id);
}

export function habitDone(date, id) {
  return !!app.habitLog[date]?.[id];
}

export function toggleHabit(date, id) {
  if (!app.habitLog[date]) app.habitLog[date] = {};
  if (app.habitLog[date][id]) delete app.habitLog[date][id];
  else app.habitLog[date][id] = true;
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

export function updateDday(id, { title, date, photo }) {
  const d = app.ddays.find((x) => x.id === id);
  if (!d) return;
  d.title = title;
  d.date = date;
  d.photo = photo || null;
}

export function removeDday(id) {
  app.ddays = app.ddays.filter((d) => d.id !== id);
}
