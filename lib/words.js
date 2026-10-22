import { rankGlyphs } from "./detect.js"
import { readLine } from "./correct.js"
import { glyphToText } from "./glyphs.js"

const LOW_CONFIDENCE = 0.6
let nextId = 1

// A box found in the straightened picture, mapped back onto the original photo: fractions { x, y, w, h } of its size.
export function unrotateBox({ x0, y0, x1, y1 }, tilt, width, height) {
  const a = (tilt * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a)
  const pts = [[x0, y0], [x1 + 1, y0], [x0, y1 + 1], [x1 + 1, y1 + 1]].map(([x, y]) => {
    const dx = x - width / 2, dy = y - height / 2
    return [width / 2 + cos * dx - sin * dy, height / 2 + sin * dx + cos * dy]
  })
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const left = Math.max(0, Math.min(...xs)), top = Math.max(0, Math.min(...ys))
  return { x: left / width, y: top / height, w: (Math.min(width, Math.max(...xs)) - left) / width, h: (Math.min(height, Math.max(...ys)) - top) / height }
}

// Why a word deserves a second look, or null when it looks fine.
export function checkReason(word, index) {
  if (word.text.includes("?")) return "Some glyphs could not be read"
  if (word.conf < LOW_CONFIDENCE) return "Low confidence"
  if (!word.dictionary && /^[A-Za-z]{3,}$/.test(word.text) && !index.words.has(word.text.toLowerCase())) return "Not a common English word"
  return null
}

// recognize() lines -> lines of editable words: text, where it sits on the photo, per-letter alternatives.
export function buildWords(lines, templates, index, { minScore, tilt, width, height }) {
  return lines.map((line) =>
    readLine(line, templates, index, minScore).map((w) => {
      const boxes = w.items.map((i) => i.box)
      const box = unrotateBox(
        { x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) },
        tilt, width, height
      )
      const reason = checkReason(w, index)
      return {
        id: nextId++,
        text: w.text,
        units: w.units,
        // One entry per glyph: what was detected and the closest alternatives (each with the text it stands for).
        items: w.items.map((i) => ({
          glyph: i.glyph, char: i.char,
          alts: rankGlyphs(i.shape, templates, 8).map((a) => ({ glyph: a.glyph, char: a.char, text: a.char ?? glyphToText(a.glyph) })),
        })),
        box,
        suggestions: w.suggestions.map((units) => ({ units, text: units.join("") })),
        reason,
        done: reason === null, // words that look fine need no review
        edited: false,
      }
    })
  )
}

export const wordsToText = (lines) =>
  lines.map((line) => line.map((w) => w.text).filter(Boolean).join(" ")).filter(Boolean).join("\n")
