import test from "node:test"
import assert from "node:assert/strict"
import { symbolTemplates, SYMBOLS, VARIANTS } from "./symbols.js"

// Fake font: "0" is a 10x20 block, "." a 4x4 block at the baseline, "-" a 10x3 block mid-height, others like "0".
const rect = (x0, y0, x1, y1) => {
  const data = new Uint8Array(40 * 40)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) data[y * 40 + x] = 1
  return { data, w: 40, h: 40 }
}
const render = (ch) => (ch === "." ? rect(5, 17, 8, 20) : ch === "-" ? rect(5, 10, 14, 12) : rect(5, 1, 14, 20))

test("symbol templates know where they sit in the line", () => {
  const t = symbolTemplates(render)
  assert.equal(t.length, SYMBOLS.length * VARIANTS.length)
  const dot = t.find((x) => x.char === "."), dash = t.find((x) => x.char === "-"), zero = t.find((x) => x.char === "0")
  assert.ok(dot.yc > 0.8 && dot.hr < 0.3) // bottom of the line, small
  assert.ok(Math.abs(dash.yc - 0.5) < 0.1)
  assert.ok(Math.abs(zero.hr - 1) < 1e-9)
})
