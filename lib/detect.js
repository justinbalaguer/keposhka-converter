// Pure image -> glyph detection. Works on masks ({ data: Uint8Array of 0/1, w, h }) so it runs in node tests.
const N = 24 // normalized glyph size
const SIZE_WEIGHT = 0.1
const SPREAD = 0.3 // threshold = local mean + this x local spread: about halfway between background and glyph
const SYMBOL_BIAS = 0.12 // a symbol must beat the best glyph by this much: a ring-shaped glyph is not a zero
export const MIN_SCORE = 0.5 // below this a blob is not a known glyph
const MIN_LINE_MEAN = 0.55 // a line of weak matches is background clutter, not text

// Foreground = pixels clearly brighter (polarity 1) or darker (-1) than their neighbourhood, so uneven lighting
// and gradients do not matter. The contrast bar is a fraction of the picture's own brightness range.
export function binarize(lum, w, h, polarity = 1, radius = Math.round(Math.min(w, h) / 6)) {
  const sorted = Uint8Array.from(lum).sort()
  const range = sorted[Math.floor(sorted.length * 0.98)] - sorted[Math.floor(sorted.length * 0.02)]
  const bar = Math.max(6, 0.12 * range)
  // Integral image -> mean/spread over a window. A small window sees only thin strokes (ignores a lit screen
  // against a dark room); a big one copes with large glyphs.
  const R = Math.max(6, radius)
  const W1 = w + 1
  const ii = new Float64Array(W1 * (h + 1)), sq = new Float64Array(W1 * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0, row2 = 0
    for (let x = 0; x < w; x++) {
      const v = lum[y * w + x]
      row += v
      row2 += v * v
      ii[(y + 1) * W1 + x + 1] = ii[y * W1 + x + 1] + row
      sq[(y + 1) * W1 + x + 1] = sq[y * W1 + x + 1] + row2
    }
  }
  const data = new Uint8Array(lum.length)
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1)
      const n = (x1 - x0) * (y1 - y0)
      const mean = (ii[y1 * W1 + x1] - ii[y0 * W1 + x1] - ii[y1 * W1 + x0] + ii[y0 * W1 + x0]) / n
      const sd = Math.sqrt(Math.max(0, (sq[y1 * W1 + x1] - sq[y0 * W1 + x1] - sq[y1 * W1 + x0] + sq[y0 * W1 + x0]) / n - mean * mean))
      // 3x3 mean of the pixel itself, so sensor noise does not speckle the mask
      const sx0 = Math.max(0, x - 1), sx1 = Math.min(w, x + 2), sy0 = Math.max(0, y - 1), sy1 = Math.min(h, y + 2)
      const near = (ii[sy1 * W1 + sx1] - ii[sy0 * W1 + sx1] - ii[sy1 * W1 + sx0] + ii[sy0 * W1 + sx0]) / ((sx1 - sx0) * (sy1 - sy0))
      data[y * w + x] = polarity * (near - mean) > Math.max(bar, SPREAD * sd) ? 1 : 0
    }
  }
  return { data, w, h }
}

// 4-connected components -> bounding boxes.
function boxes({ data, w, h }) {
  const seen = new Uint8Array(data.length)
  const out = []
  const stack = []
  for (let s = 0; s < data.length; s++) {
    if (!data[s] || seen[s]) continue
    let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0
    seen[s] = 1
    stack.push(s)
    while (stack.length) {
      const p = stack.pop()
      const x = p % w, y = (p / w) | 0
      n++
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
        if (q !== false && data[q] && !seen[q]) (seen[q] = 1), stack.push(q)
      }
    }
    out.push({ x0, y0, x1, y1, n })
  }
  return out
}

// Blobs that cannot be glyphs: spanning most of the picture (screen frame, shadow), or big and mostly empty
// (scaffolding, cables). Their boxes would swallow the glyphs inside them when overlapping boxes are merged.
function glyphSized(mask) {
  const dim = Math.min(mask.w, mask.h)
  return boxes(mask).filter((b) => {
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1
    return w < 0.6 * dim && h < 0.6 * dim && !(Math.max(w, h) > 0.1 * dim && b.n < 0.12 * w * h)
  })
}

// Boxes must overlap in x; in y they may be up to `gapY` apart (the two dots of a colon).
const overlap = (a, b, gapY) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 - gapY <= b.y1 && b.y0 - gapY <= a.y1

// Glyphs can be several blobs; merge boxes that touch.
function merge(list, gapY = 0) {
  let rest = list
  for (let changed = true; changed; ) {
    changed = false
    const next = []
    for (const b of rest) {
      const hit = next.find((n) => overlap(n, b, gapY))
      if (hit) {
        hit.x0 = Math.min(hit.x0, b.x0), hit.y0 = Math.min(hit.y0, b.y0)
        hit.x1 = Math.max(hit.x1, b.x1), hit.y1 = Math.max(hit.y1, b.y1)
        changed = true
      } else next.push({ ...b })
    }
    rest = next
  }
  return rest
}

const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1]

// The text block = the biggest cluster of similar-sized, nearby boxes. Drops lights, crowd, speckle.
function textCluster(list) {
  const cand = list.filter((b) => b.y1 - b.y0 >= 5).sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0)).slice(0, 500)
  const parent = cand.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const h = (b) => b.y1 - b.y0 + 1
  const gap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1))
  for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
      const r = h(cand[i]) / h(cand[j])
      if (r > 0.6 && r < 1.67 && gap(cand[i], cand[j]) < 2 * Math.max(h(cand[i]), h(cand[j]))) parent[find(i)] = find(j)
    }
  }
  const groups = new Map()
  cand.forEach((b, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), b]))
  const cluster = [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? []
  return { cluster, rest: list.filter((b) => !cluster.includes(b)) }
}

// Lines of { items, top, bottom } in reading order; items are boxes, null = word gap.
// Small marks (colon, period, comma) are too small for the text cluster, so they are pulled in per line.
export function layout(mask) {
  const { cluster: found, rest } = textCluster(merge(glyphSized(mask)))
  if (!found.length) return []
  const medH = median(found.map((b) => b.y1 - b.y0 + 1))
  const medW = median(found.map((b) => b.x1 - b.x0 + 1))
  // Rows = groups of centres separated by clear vertical gaps (robust to glyphs of different heights).
  found.sort((a, b) => a.y0 + a.y1 - (b.y0 + b.y1))
  const lines = []
  for (const b of found) {
    const line = lines[lines.length - 1]
    const cy = (b.y0 + b.y1) / 2
    if (line && cy - line.cy < medH * 0.4) line.items.push(b)
    else lines.push({ items: [b] })
    lines[lines.length - 1].cy = cy
  }
  return lines.map(({ items }) => {
    const top = median(items.map((b) => b.y0)), bottom = median(items.map((b) => b.y1))
    const H = bottom - top + 1
    const [first, last] = [Math.min(...items.map((b) => b.x0)), Math.max(...items.map((b) => b.x1))]
    const marks = merge(
      rest.filter((b) => (b.y0 + b.y1) / 2 > top - 0.3 * H && (b.y0 + b.y1) / 2 < bottom + 0.3 * H && b.x0 > first - 0.6 * medW && b.x1 < last + 0.6 * medW && b.x1 - b.x0 >= 1 && b.y1 - b.y0 >= 1),
      0.6 * H
    ).filter((b) => b.y1 - b.y0 + 1 <= 0.9 * H && b.x1 - b.x0 + 1 <= H)
    const all = [...items, ...marks].sort((a, b) => a.x0 - b.x0)
    return { items: all.flatMap((b, i) => (i && b.x0 - all[i - 1].x1 > medW * 0.4 ? [null, b] : [b])), top, bottom }
  })
}

// 3x3 smoothing on the N x N grid; makes matching tolerant to stroke thickness and blur.
function blur2(c) {
  let src = c
  for (let pass = 0; pass < 2; pass++) {
    const o = new Float32Array(N * N)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let sum = 0, wt = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const X = x + dx, Y = y + dy
            if (X < 0 || Y < 0 || X >= N || Y >= N) continue
            const k = dx || dy ? 1 : 2
            sum += src[Y * N + X] * k
            wt += k
          }
        }
        o[y * N + x] = sum / wt
      }
    }
    src = o
  }
  return src
}

// Zhang-Suen thinning of the box: strokes shrink to a 1px centre-line, so a heavy font and a light one give the same shape.
function skeleton({ data, w }, box) {
  const bw = box.x1 - box.x0 + 3, bh = box.y1 - box.y0 + 3 // 1px margin
  const g = new Uint8Array(bw * bh)
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) g[(y - box.y0 + 1) * bw + x - box.x0 + 1] = data[y * w + x]
  const nb = (i) => [g[i - bw], g[i - bw + 1], g[i + 1], g[i + bw + 1], g[i + bw], g[i + bw - 1], g[i - 1], g[i - bw - 1]]
  for (let changed = true, guard = 0; changed && guard < 40; guard++) {
    changed = false
    for (let pass = 0; pass < 2; pass++) {
      const kill = []
      for (let y = 1; y < bh - 1; y++) {
        for (let x = 1; x < bw - 1; x++) {
          const i = y * bw + x
          if (!g[i]) continue
          const n = nb(i)
          const count = n.reduce((a, b) => a + b, 0)
          if (count < 2 || count > 6) continue
          let trans = 0
          for (let k = 0; k < 8; k++) if (!n[k] && n[(k + 1) % 8]) trans++
          if (trans !== 1) continue
          if (pass === 0 ? n[0] * n[2] * n[4] || n[2] * n[4] * n[6] : n[0] * n[2] * n[6] || n[0] * n[4] * n[6]) continue
          kill.push(i)
        }
      }
      for (const i of kill) g[i] = 0
      if (kill.length) changed = true
    }
  }
  return { data: g, w: bw, box: { x0: 0, y0: 0, x1: bw - 1, y1: bh - 1 } }
}

// Skeleton grid for symbols (see skeleton): same N x N resampling of the thinned strokes.
function thin(mask, box, zero) {
  const sk = skeleton(mask, box)
  const cells = new Float32Array(N * N)
  const bw = sk.box.x1 + 1, bh = sk.box.y1 + 1
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (sk.data[y * bw + x]) cells[Math.min(N - 1, Math.floor((y * N) / bh)) * N + Math.min(N - 1, Math.floor((x * N) / bw))] = 1
  const z = zero(cells)
  return { sz: z, snorm: Math.hypot(...z) || 1 }
}

// Crop the mask to its tight box and resample to N x N coverage (0-1 per cell, tolerant to blur).
// Also returns the box size so glyph case (same shape, different size) can be told apart.
export function normalize(mask, box, withSkeleton = false) {
  const { data, w } = mask
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1
  const cells = new Float32Array(N * N)
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      const xa = box.x0 + Math.floor((tx * bw) / N), xb = box.x0 + Math.max(Math.floor(((tx + 1) * bw) / N), Math.floor((tx * bw) / N) + 1)
      const ya = box.y0 + Math.floor((ty * bh) / N), yb = box.y0 + Math.max(Math.floor(((ty + 1) * bh) / N), Math.floor((ty * bh) / N) + 1)
      let on = 0, all = 0
      for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) (all++, (on += data[y * w + x]))
      cells[ty * N + tx] = on / all
    }
  }
  const zero = (c) => {
    const b = blur2(c)
    const mean = b.reduce((x, y) => x + y, 0) / b.length
    return b.map((v) => v - mean) // zero-mean, so a dot product is correlation
  }
  const z = zero(cells)
  return { z, norm: Math.hypot(...z) || 1, aspect: bw / bh, h: bh, ...(withSkeleton ? thin(mask, box, zero) : {}) }
}

// Tight box of a mask (for templates).
export function tightBox({ data, w, h }, region = { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = region.y0; y <= region.y1; y++) {
    for (let x = region.x0; x <= region.x1; x++) {
      if (!data[y * w + x]) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 }
}

// Normalized correlation of the smoothed grids, minus penalties for aspect-ratio and (when scale is known) height mismatch.
// Symbol templates (t.char) also have to sit at the right height in the line; small marks are never glyphs.
export function score(shape, t, scale, sizeWeight = SIZE_WEIGHT) {
  let dot = 0
  for (let i = 0; i < N * N; i++) dot += shape.z[i] * t.z[i]
  let corr = dot / (shape.norm * t.norm)
  let extra = 0
  if (t.char) {
    // Symbols: mostly compare centre-lines, so the weight of the photo's font does not matter.
    if (shape.sz) {
      let sd = 0
      for (let i = 0; i < N * N; i++) sd += shape.sz[i] * t.sz[i]
      corr = 0.35 * corr + 0.65 * (sd / (shape.snorm * t.snorm))
    }
    if (shape.hr != null) extra = 0.5 * Math.abs(shape.yc - t.yc) + 0.25 * Math.abs(Math.log(shape.hr / t.hr)) + (shape.hr >= 0.6 ? SYMBOL_BIAS : 0) - (t.bonus ?? 0)
  } else {
    if (scale) extra += sizeWeight * Math.abs(Math.log(shape.h / (scale * t.h)))
    if (shape.hr < 0.6) extra += 0.5 * (Math.abs(Math.log(shape.hr)) - 0.5)
  }
  return corr - 0.3 * Math.abs(Math.log(shape.aspect / t.aspect)) - extra
}

// Best template overall. When a symbol wins, `alt` keeps the best glyph reading in case context rules the symbol out.
function best(shape, templates, scale) {
  let top = { glyph: null, score: -Infinity }
  let alt = top
  for (const t of templates) {
    const sc = score(shape, t, scale)
    const hit = { glyph: t.glyph, char: t.char, score: sc, h: t.h }
    if (sc > top.score) top = hit
    if (!t.char && sc > alt.score) alt = hit
  }
  return top.char ? { ...top, alt } : top
}

// The n best templates for a shape, for "what else could this be?" pickers.
export function rankGlyphs(shape, templates, n = 8) {
  return templates
    .map((t) => ({ glyph: t.glyph, char: t.char, score: score(shape, t, null) }))
    .sort((a, b) => b.score - a.score)
    .filter((r, i, all) => all.findIndex((o) => (o.char ?? o.glyph) === (r.char ?? r.glyph)) === i)
    .slice(0, n)
}

// templates: [{ glyph, cells, aspect, h }] (h = tight height in a common template size).
// Pass 1 ignores size to estimate the photo's scale; pass 2 uses it to tell capitals from lowercase.
export function matchAll(shapes, templates) {
  const first = shapes.map((s) => best(s, templates))
  const ratios = shapes.flatMap((s, i) => (first[i].score > 0.5 && !first[i].char && !(s.hr < 0.6) ? [s.h / first[i].h] : []))
  if (!ratios.length) return first
  const scale = median(ratios)
  return shapes.map((s) => ({ ...best(s, templates, scale), scale }))
}

// Blurry photos can fuse neighbouring glyphs into one blob. Try every cut column in the middle of a wide
// blob and keep the best cut only when the two halves match clearly better than the whole.
// Halves that are still wide are split again.
function trySplit(mask, box, templates, medW) {
  const w = box.x1 - box.x0 + 1
  if (w <= medW * 1.5) return [box]
  const part = (x0, x1) => tightBox(mask, { x0, x1, y0: box.y0, y1: box.y1 })
  const whole = best(normalize(mask, box), templates).score
  let top = null
  for (let cut = box.x0 + Math.floor(w * 0.25); cut <= box.x1 - Math.floor(w * 0.25); cut++) {
    const halves = [part(box.x0, cut - 1), part(cut + 1, box.x1)]
    if (halves.some((h) => !h)) continue
    const mean = halves.reduce((sum, h) => sum + best(normalize(mask, h), templates).score, 0) / 2
    if (!top || mean > top.mean) top = { mean, halves }
  }
  return top && top.mean > whole + 0.05 ? top.halves.flatMap((h) => trySplit(mask, h, templates, medW)) : [box]
}

const EDGE_MARKS = ".,!?:-'()" // punctuation that may sit at the edge of a word of letters

// "subj0ct" is not a word with a zero in it: a symbol inside a word of letters falls back to its glyph reading.
function settleSymbols(line) {
  const out = [...line]
  let start = 0
  for (let end = 0; end <= line.length; end++) {
    if (end < line.length && line[end]) continue
    const word = line.slice(start, end)
    if (word.some((r) => !r.char)) {
      for (let k = start; k < end; k++) {
        const edge = k === start || k === end - 1
        if (line[k].char && !(edge && EDGE_MARKS.includes(line[k].char))) out[k] = { ...line[k].alt, shape: line[k].shape, box: line[k].box }
      }
    }
    start = end + 1
  }
  return out
}

// mask + templates -> lines of { glyph | char, score, shape } (null = word gap). Noise lines are dropped.
// Templates with a `char` are symbols (digits, punctuation); the rest are Keposhka glyphs.
export function recognize(mask, templates) {
  const lines = layout(mask)
  const glyphTemplates = templates.filter((t) => !t.char)
  const medW = median(lines.flatMap((l) => l.items).filter(Boolean).map((b) => b.x1 - b.x0 + 1))
  // Each box keeps its line frame: a symbol is told apart by where it sits in the line (period vs dash).
  const cut = lines.map((line) => ({ ...line, items: line.items.flatMap((b) => (b ? trySplit(mask, b, glyphTemplates, medW) : [b])) }))
  // Position in the line is measured against the nearest few boxes, so a tilted line does not skew it.
  const shapes = cut.flatMap((line) => {
    const boxes = line.items.filter(Boolean)
    return boxes.map((b, k) => {
      const near = boxes.slice(Math.max(0, k - 4), k + 5)
      const top = median(near.map((n) => n.y0)), H = median(near.map((n) => n.y1)) - top + 1
      return { ...normalize(mask, b, true), yc: ((b.y0 + b.y1) / 2 - top) / H, hr: (b.y1 - b.y0 + 1) / H }
    })
  })
  const flatBoxes = cut.flatMap((line) => line.items.filter(Boolean))
  const found = matchAll(shapes, templates).map((f, i) => ({ ...f, shape: shapes[i], box: flatBoxes[i] }))
  let i = 0
  const read = cut
    .map((line) => settleSymbols(line.items.map((b) => (b ? found[i++] : null))))
    .filter((line) => {
      const items = line.filter(Boolean)
      return items.filter((r) => r.score >= MIN_SCORE).length * 2 >= items.length && items.reduce((n, r) => n + r.score, 0) / items.length >= MIN_LINE_MEAN
    })
  // One or two stray glyphs beside full lines of text are clutter (a light, a speck), not a sentence.
  const sizes = read.map((line) => line.filter(Boolean).length)
  return read.filter((_, k) => sizes[k] > 2 || sizes[k] * 4 >= median(sizes))
}

// Text tilt in degrees (clockwise positive): median angle between each box and its near neighbours on the same line.
export function skewAngle(mask) {
  const { cluster } = textCluster(merge(glyphSized(mask)))
  const c = cluster.map((b) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, h: b.y1 - b.y0 + 1 }))
  const angles = []
  for (const a of c) {
    for (const b of c) {
      const dx = b.x - a.x, dy = b.y - a.y
      if (dx > 0.5 * a.h && dx < 3 * a.h && Math.abs(dy) < 0.27 * dx) angles.push((Math.atan2(dy, dx) * 180) / Math.PI)
    }
  }
  return angles.length >= 5 ? median(angles) : 0
}

// Rotate the picture's content clockwise by `deg`, edges repeated.
function rotate(lum, w, h, deg) {
  const c = Math.cos((-deg * Math.PI) / 180), s = Math.sin((-deg * Math.PI) / 180)
  const out = new Uint8Array(lum.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - w / 2, dy = y - h / 2
      const px = Math.min(w - 1.001, Math.max(0, c * dx - s * dy + w / 2)), py = Math.min(h - 1.001, Math.max(0, s * dx + c * dy + h / 2))
      const x0 = px | 0, y0 = py | 0, fx = px - x0, fy = py - y0
      out[y * w + x] = (lum[y0 * w + x0] * (1 - fx) + lum[y0 * w + x0 + 1] * fx) * (1 - fy) + (lum[(y0 + 1) * w + x0] * (1 - fx) + lum[(y0 + 1) * w + x0 + 1] * fx) * fy
    }
  }
  return out
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

// Luminance image -> { lines, tilt } (see recognize). Tries bright-on-dark and dark-on-bright at a few window
// sizes, straightens tilted text when that helps, and keeps the reading that `judge` rates highest
// (default: sum of match quality). Yields between attempts so a page can animate and report progress;
// `tilt` is the rotation (degrees) that was applied to the winning reading, 0 if none.
export async function readImage(lum, w, h, templates, { judge = quality, onProgress, signal } = {}) {
  const radii = [Math.round(Math.min(w, h) / 6), 48, 24, 12]
  let top = { lines: [], tilt: 0 }, topScore = -1
  for (const [i, radius] of radii.entries()) {
    for (const p of [1, -1]) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      onProgress?.(i / radii.length + (p === 1 ? 0 : 0.5 / radii.length))
      await tick()
      const mask = binarize(lum, w, h, p, radius)
      const tries = [{ mask, tilt: 0 }]
      // The tilt estimate can be wrong (perspective, uneven glyph heights), so the straight reading always competes.
      const tilt = skewAngle(mask)
      if (Math.abs(tilt) > 1) tries.push({ mask: binarize(rotate(lum, w, h, -tilt), w, h, p, radius), tilt })
      for (const t of tries) {
        const lines = recognize(t.mask, templates)
        const n = judge(lines)
        if (n > topScore) (top = { lines, tilt: t.tilt }), (topScore = n)
      }
    }
  }
  onProgress?.(1)
  return top
}

// Sum of how far each recognized glyph is above the acceptance bar.
export function quality(lines) {
  return lines.reduce((n, l) => n + l.reduce((m, r) => m + (r && r.score > MIN_SCORE ? r.score - MIN_SCORE : 0), 0), 0)
}
