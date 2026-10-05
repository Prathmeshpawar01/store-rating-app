const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : '—');

export const formatRating = (value) =>
  value === null || value === undefined ? '—' : Number(value).toFixed(1);

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  USER: 'Normal user',
  OWNER: 'Store owner',
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const plural = (n, word, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
