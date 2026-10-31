export const pad = (n) => String(n).padStart(2, '0');

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

/** a - b in whole days */
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);

export const WD = ['일', '월', '화', '수', '목', '금', '토'];

export const label = (s) => {
  const d = parse(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** focus count -> hours, 1 count = 0.5h */
export const hoursOf = (count) => {
  const h = count * 0.5;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

/** a "day" ends at 4 AM: 01:30 on the 1st still counts as the previous day */
export const DAY_OFFSET = 4 * 60 * 60 * 1000;
export const logicalDate = (ms) => ymd(new Date(ms - DAY_OFFSET));

export const SUBJECT_COLORS = ['#4A5D8A', '#3F6B4F', '#8A560C', '#7A5B9A', '#9A4B5F', '#2F6F78', '#5E6B2E', '#8A4A2E'];

export const fmtMinutes = (min) => `${Math.floor(min / 60)}시간 ${String(Math.round(min % 60)).padStart(2, '0')}분`;

export const PALETTE = [
  ['#C9D3E6', '#5B6F9A'],
  ['#E9B88A', '#C8553D'],
  ['#BFD4C2', '#3F6B4F'],
  ['#F0D9A8', '#A86A12'],
  ['#D9C6E6', '#7A5B9A'],
  ['#E6C6CF', '#9A5B6F'],
];
