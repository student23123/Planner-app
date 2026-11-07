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

export const OLD_SUBJECT_COLORS = ['#4A5D8A', '#3F6B4F', '#8A560C', '#7A5B9A', '#9A4B5F', '#2F6F78', '#5E6B2E', '#8A4A2E'];
export const SUBJECT_COLORS = ['#7088B5', '#6E9C7C', '#BF9152', '#9C88BF', '#C27F93', '#62A0A8', '#93A063', '#BC8768'];

export const fmtMinutes = (min) => `${Math.floor(min / 60)}시간 ${String(Math.round(min % 60)).padStart(2, '0')}분`;

export const PALETTE = [
  ['#D9E0EE', '#97A6C6'],
  ['#F3D9C6', '#D7A38F'],
  ['#D6E4D9', '#94B59E'],
  ['#F3E6C9', '#D1AE78'],
  ['#E5DCEE', '#AE9BC4'],
  ['#F0DDE3', '#C49CA8'],
];
