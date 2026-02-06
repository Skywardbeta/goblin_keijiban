export * from './hash';
export * from './time';
export * from './2ch';
export * from './encoding';
export * from './escaping';

export const parseRange = (v) => {
  if (!v || typeof v !== 'string') return { id: null, start: null, end: null, res: null };

  const [id, range] = v.split('/');
  if (!range) return { id, start: null, end: null, res: null };

  if (range.includes(',')) {
    return { id, start: null, end: null, res: range.split(',').map(n => n.trim()).filter(n => n) };
  }

  const lastMatch = range.match(/^l(\d+)$/i);
  if (lastMatch) return { id, start: null, end: null, last: parseInt(lastMatch[1], 10) };

  const [startStr, endStr] = range.split('-');
  return { id, start: startStr ? parseInt(startStr, 10) : 1, end: endStr ? parseInt(endStr, 10) : null, res: null };
};
