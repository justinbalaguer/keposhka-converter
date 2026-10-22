const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("")
export const DIGRAPHS = ["th", "sh", "ch", "gh"]

// Glyph file names under /public/assets. "a" is the capital glyph, "aa" the lowercase one.
export const GLYPHS = [
  ...ALPHABET.flatMap((c) => [c, c + c]),
  ...DIGRAPHS.flatMap((d) => [d, d + d]),
].sort()

export const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

// English text a glyph stands for when decoding.
export function glyphToText(glyph) {
  if (glyph.length === 1) return glyph.toUpperCase()
  const half = glyph.length / 2
  const doubled = glyph.slice(0, half) === glyph.slice(half)
  if (doubled) return glyph.slice(0, half)
  return glyph[0].toUpperCase() + glyph.slice(1)
}
