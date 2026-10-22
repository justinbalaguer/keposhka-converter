import test from "node:test"
import assert from "node:assert/strict"
import { checkReason, unrotateBox, wordsToText } from "./words.js"

const index = { words: new Set(["those", "born"]) }

test("unrotateBox: no tilt is a plain fraction of the picture", () => {
  const b = unrotateBox({ x0: 10, y0: 20, x1: 29, y1: 39 }, 0, 100, 200)
  assert.deepEqual([b.x, b.y, b.w, b.h].map((v) => +v.toFixed(3)), [0.1, 0.1, 0.2, 0.1])
})

test("unrotateBox: a box at the centre stays centred under any tilt", () => {
  const b = unrotateBox({ x0: 49, y0: 49, x1: 50, y1: 50 }, 30, 100, 100)
  assert.ok(Math.abs(b.x + b.w / 2 - 0.5) < 0.01 && Math.abs(b.y + b.h / 2 - 0.5) < 0.01)
})

test("checkReason flags unreadable, weak and unknown words only", () => {
  const w = (text, conf = 0.8, dictionary = false) => ({ text, conf, dictionary })
  assert.match(checkReason(w("Th?se"), index), /could not be read/)
  assert.match(checkReason(w("born", 0.4), index), /Low confidence/)
  assert.match(checkReason(w("zorp"), index), /Not a common English word/)
  assert.equal(checkReason(w("born"), index), null)
  assert.equal(checkReason(w("#17:"), index), null) // digits and signs are not "words"
  assert.equal(checkReason(w("Moat", 0.8, true), index), null)
})

test("wordsToText joins words and lines, skipping emptied words", () => {
  assert.equal(wordsToText([[{ text: "Those" }, { text: "" }, { text: "born" }], [], [{ text: "in" }]]), "Those born\nin")
})
