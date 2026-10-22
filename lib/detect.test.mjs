import test from "node:test"
import assert from "node:assert/strict"
import { binarize, layout, matchAll, normalize, tightBox } from "./detect.js"

const W = 120, H = 80
// Draws filled rects (x0,y0,x1,y1) as bright-on-dark luminance.
function draw(rects) {
  const lum = new Uint8Array(W * H).fill(10)
  for (const [x0, y0, x1, y1] of rects) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) lum[y * W + x] = 240
  return binarize(lum, W, H, 1, 30) // window bigger than the solid test blocks
}

test("layout: reading order, word gap, small mark kept", () => {
  const mask = draw([[4, 4, 19, 27], [24, 4, 39, 27], [80, 4, 95, 27], [58, 14, 63, 19]])
  const row = layout(mask)
  assert.equal(row.length, 1)
  // smoothing moves box edges by a pixel or two, so check the structure: glyph, glyph, gap, mark, gap, glyph
  assert.equal(row[0].items.map((b) => (b ? "g" : "_")).join(""), "gg_g_g")
})

test("layout: two lines", () => {
  const lum = new Uint8Array(W * H).fill(10)
  for (const [y0, y1] of [[2, 12], [24, 34]]) for (let y = y0; y <= y1; y++) for (let x = 10; x < 24; x++) lum[y * W + x] = 240
  assert.equal(layout(binarize(lum, W, H, 1, 30)).length, 2)
})

test("matchAll picks the same shape, rejects different one", () => {
  const tall = draw([[4, 4, 19, 34]]), wide = draw([[4, 16, 59, 22]])
  const shape = (m) => normalize(m, tightBox(m))
  const templates = [{ glyph: "tall", ...shape(tall) }, { glyph: "wide", ...shape(wide) }]
  assert.deepEqual(matchAll([shape(tall), shape(wide)], templates).map((r) => r.glyph), ["tall", "wide"])
})
