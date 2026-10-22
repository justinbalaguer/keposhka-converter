import test from "node:test"
import assert from "node:assert/strict"
import { buildIndex } from "./correct.js"

test("buildIndex groups words by glyph count, digraph = one glyph", () => {
  const index = buildIndex("the this cat x1")
  assert.deepEqual(index.get(2).map((c) => c.word), ["the"]) // th + e
  assert.deepEqual(index.get(3).map((c) => c.word), ["this", "cat"]) // th,i,s and c,a,t
})

import { lineToText } from "./correct.js"

test("raw words: case smoothing and junk dropped", () => {
  const g = (glyph, score = 0.9) => ({ glyph, score })
  const line = [g("mm"), g("o"), g("a"), g("t"), null, g("b", 0.2), g("c", 0.2), g("d", 0.9), null, g("th"), g("oo"), g("ss"), g("ee")]
  assert.equal(lineToText(line, [], new Map(), 0.5), "MOAT Those")
})
