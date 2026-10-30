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

export const PALETTE = [
  ['#C9D3E6', '#5B6F9A'],
  ['#E9B88A', '#C8553D'],
  ['#BFD4C2', '#3F6B4F'],
  ['#F0D9A8', '#A86A12'],
  ['#D9C6E6', '#7A5B9A'],
  ['#E6C6CF', '#9A5B6F'],
];
