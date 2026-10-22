// Pure helpers for the scan result: lines of editable words (see words.js).
const mapWords = (lines, id, fn) => lines.map((l) => l.flatMap((w) => (w.id === id ? fn(w) : [w])))

export const updateWord = (lines, id, patch) => mapWords(lines, id, (w) => [{ ...w, ...patch }])
export const removeWord = (lines, id) => mapWords(lines, id, () => []).filter((l) => l.length)
export const insertAfter = (lines, id, word) => mapWords(lines, id, (w) => [w, word])

// Swap one glyph of a word for another reading.
export function pickAlt(word, index, alt) {
  const units = word.units.map((u, i) => (i === index ? alt.text : u))
  const items = word.items.map((it, i) => (i === index ? { ...it, glyph: alt.glyph, char: alt.char } : it))
  return { units, items, text: units.join(""), done: true }
}

export const needsCheck = (lines) => lines.flat().filter((w) => w.reason && !w.done)
