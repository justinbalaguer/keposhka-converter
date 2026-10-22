import { score } from "./detect.js"
import { glyphToText } from "./glyphs.js"
import { textToGlyphs } from "./encode.js"

const unit = (glyph) => glyphToText(glyph).toLowerCase() // "aa" -> "a", "Th" -> "th"
const isCapital = (glyph) => glyphToText(glyph) !== glyphToText(glyph).toLowerCase()
const SYMBOL_MIN = 0.5
const MARK_MIN = 0.35 // small marks (colon, period) have little ink to match, so the bar is lower
const MIN_MEAN = 0.5 // a word must fit the shapes at least this well
const MAX_LOSS = 0.12 // ...and lose at most this much per glyph against the raw reading
const CASE_SIZE_WEIGHT = 0.5 // how strongly glyph height decides capital vs lowercase
const RANK_BONUS = 0.02 // common words win near-ties

// Words are frequency-ordered. Index them by glyph count: "this" is 3 glyphs (th, i, s).
export function buildIndex(text) {
  const byLength = new Map()
  const all = text.split(/\s+/)
  byLength.words = new Set(all)
  all.forEach((word, rank) => {
    if (!/^[a-z]+$/.test(word)) return
    const units = textToGlyphs(word).map(unit)
    const list = byLength.get(units.length) ?? byLength.set(units.length, []).get(units.length)
    list.push({ word, units, bonus: RANK_BONUS * (1 - rank / all.length) })
  })
  return byLength
}

// Letters after the first mostly capital -> ALL CAPS; otherwise only the first letter may be a capital.
// Digits, signs and "?" are left alone. Returns one string per glyph, so a word can be edited letter by letter.
function applyCase(units, capitals) {
  const letters = units.flatMap((u, i) => (/^[a-z]+$/.test(u) ? [i] : []))
  const rest = letters.slice(1)
  const allCaps = rest.length > 0 && rest.filter((i) => capitals[i]).length * 2 > rest.length
  return units.map((u, i) => (allCaps ? u.toUpperCase() : i === letters[0] && capitals[i] ? u[0].toUpperCase() + u.slice(1) : u.toLowerCase()))
}

// The dictionary words that best fit a run of letter glyphs ({ glyph, shape, scale }), best first.
// `fits` says whether the best one is close enough to the shapes to replace the raw reading.
function topWords(items, templates, index, k = 4) {
  const cands = index.get(items.length)
  if (items.length < 2 || !cands) return { words: [], fits: false }
  const sims = items.map(({ shape, scale }) => {
    const bestFor = new Map()
    for (const t of templates) {
      if (t.char) continue
      const sc = score(shape, t, null)
      const sized = score(shape, t, scale, CASE_SIZE_WEIGHT) // size tells capital from lowercase
      const u = unit(t.glyph)
      const prev = bestFor.get(u)
      bestFor.set(u, { sc: Math.max(sc, prev?.sc ?? -Infinity), capital: !prev || sized > prev.sized ? isCapital(t.glyph) : prev.capital, sized: Math.max(sized, prev?.sized ?? -Infinity) })
    }
    return bestFor
  })
  const raw = sims.reduce((sum, m) => sum + Math.max(...[...m.values()].map((v) => v.sc)), 0)
  const ranked = cands
    .map((c) => ({ c, total: c.units.reduce((sum, u, i) => sum + (sims[i].get(u)?.sc ?? -1), c.bonus) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, k)
  // Case comes from the corrected letters' own best variant, not from the glyphs they replaced.
  const words = ranked.map(({ c }) => applyCase(c.units, c.units.map((u, i) => sims[i].get(u).capital)))
  const best = ranked[0]
  return { words, fits: best.total / items.length >= MIN_MEAN && (raw - best.total) / items.length <= MAX_LOSS }
}

// lines from recognize() -> words. Words with no good dictionary fit stay as the raw reading;
// words that are mostly unreadable are dropped. Signs and digits are plain text: they pass through
// and edge ones ("inspection.", "#79") are peeled off before the dictionary looks at the letters.
// A word: { units (one string per glyph), text, items, conf, dictionary, suggestions: [units] }.
export function readLine(line, templates, index, minScore) {
  const readable = (r) => (r.char ? r.score >= (r.shape.hr < 0.75 ? MARK_MIN : SYMBOL_MIN) : r.glyph && r.score >= minScore)
  const unitOf = (r) => (!readable(r) ? "?" : r.char ?? unit(r.glyph))
  const raw = (w) => applyCase(w.map(unitOf), w.map((r) => !r.char && isCapital(r.glyph)))
  const word = (w) => {
    if (w.filter(readable).length * 2 < w.length) return null
    let lo = 0, hi = w.length
    while (lo < hi && w[lo].char) lo++
    while (hi > lo && w[hi - 1].char) hi--
    const core = w.slice(lo, hi)
    const { words, fits } = core.every((r) => !r.char) ? topWords(core, templates, index) : { words: [], fits: false }
    const rawUnits = raw(w)
    const wrap = (coreUnits) => [...rawUnits.slice(0, lo), ...coreUnits, ...rawUnits.slice(hi)]
    const units = fits ? wrap(words[0]) : rawUnits
    const text = units.join("")
    const others = [...(fits ? [rawUnits] : []), ...words.slice(fits ? 1 : 0).map(wrap)]
    const seen = new Set([text])
    const suggestions = others.filter((u) => !seen.has(u.join("")) && seen.add(u.join("")))
    return { units, text, items: w, conf: w.reduce((n, r) => n + r.score, 0) / w.length, dictionary: fits, suggestions }
  }
  const words = [[]]
  for (const r of line) r ? words[words.length - 1].push(r) : words.push([])
  return words.filter((w) => w.length).map(word).filter(Boolean)
}

// Same, as plain text: words joined by spaces.
export function lineToText(line, templates, index, minScore) {
  return readLine(line, templates, index, minScore).map((w) => w.text).join(" ")
}

// How much of the reading is real English: letters in dictionary words of 3+ letters. Used to pick between
// competing readings of the same photo, so the match quality only breaks ties.
export function dictionaryHits(lines, templates, index, minScore) {
  const text = lines.map((l) => lineToText(l, templates, index, minScore)).join(" ")
  return text.split(/\s+/).reduce((n, t) => {
    const w = t.toLowerCase().replace(/[^a-z]/g, "")
    return n + (w.length >= 3 && index.words.has(w) ? w.length : 0)
  }, 0)
}
