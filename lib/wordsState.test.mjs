import test from "node:test"
import assert from "node:assert/strict"
import { updateWord, removeWord, insertAfter, pickAlt, needsCheck } from "./wordsState.js"

const w = (id, text, extra = {}) => ({ id, text, units: [...text], items: [...text].map((c) => ({ glyph: c, char: null })), ...extra })
const lines = () => [[w(1, "ab"), w(2, "cd", { reason: "x", done: false })], [w(3, "e")]]

test("update/remove/insert", () => {
  assert.equal(updateWord(lines(), 1, { text: "z" })[0][0].text, "z")
  assert.deepEqual(removeWord(lines(), 3).length, 1)
  assert.equal(insertAfter(lines(), 1, w(9, "n"))[0][1].id, 9)
})

test("pickAlt replaces one unit", () => {
  const r = pickAlt(w(1, "ab"), 1, { glyph: "q", char: null, text: "q" })
  assert.equal(r.text, "aq")
  assert.equal(r.items[1].glyph, "q")
})

test("needsCheck", () => assert.deepEqual(needsCheck(lines()).map((x) => x.id), [2]))
