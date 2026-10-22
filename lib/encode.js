import { DIGRAPHS, GLYPHS } from "./glyphs.js"

const KNOWN = new Set(GLYPHS)

// English text -> list of glyph names (or "space"). Characters with no glyph are skipped.
export function textToGlyphs(text) {
  const out = []
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      if (out[out.length - 1] !== "space") out.push("space")
      i++
      continue
    }
    const pair = text.slice(i, i + 2).toLowerCase()
    const isCap = ch !== ch.toLowerCase()
    if (DIGRAPHS.includes(pair)) {
      out.push(isCap ? pair : pair + pair)
      i += 2
      continue
    }
    const base = ch.toLowerCase()
    const glyph = isCap ? base : base + base
    if (KNOWN.has(glyph)) out.push(glyph)
    i++
  }
  return out
}
