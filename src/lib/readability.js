// Flesch–Kincaid grade: 0.39 (words/sentences) + 11.8 (syllables/words) − 15.59

export function countSyllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function textStats(text) {
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => /[a-z]/i.test(s)).length || 1;
  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  return { sentences, words: words.length, syllables };
}

export function fkGrade(text) {
  const { sentences, words, syllables } = textStats(text);
  if (words === 0) return null;
  const g = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.round(Math.max(0, g) * 10) / 10;
}

export function gradeLabel(g) {
  if (g === null || g === undefined) return '—';
  if (g <= 6) return 'easy';
  if (g <= 9) return 'plain';
  if (g <= 12) return 'fairly hard';
  if (g <= 15) return 'hard';
  return 'very hard';
}
