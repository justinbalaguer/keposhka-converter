import test from "node:test"
import assert from "node:assert/strict"
import { GLYPHS, glyphToText } from "./glyphs.js"
import { textToGlyphs } from "./encode.js"

test("glyph list has 60 unique glyphs", () => {
  assert.equal(GLYPHS.length, 60)
  assert.equal(new Set(GLYPHS).size, 60)
})

test("glyphToText", () => {
  assert.equal(glyphToText("a"), "A")
  assert.equal(glyphToText("aa"), "a")
  assert.equal(glyphToText("th"), "Th")
  assert.equal(glyphToText("thth"), "th")
})

test("textToGlyphs", () => {
  assert.deepEqual(textToGlyphs("Hi th"), ["h", "ii", "space", "thth"])
  assert.deepEqual(textToGlyphs("Th"), ["th"])
  assert.deepEqual(textToGlyphs("a  b!1"), ["aa", "space", "bb"])
})

test("encode then decode round-trips", () => {
  const text = "My Chemical Romance"
  const back = textToGlyphs(text).map((g) => (g === "space" ? " " : glyphToText(g))).join("")
  assert.equal(back, text)
})

test("every glyph has an svg asset", async () => {
  const { existsSync } = await import("node:fs")
  for (const g of GLYPHS) assert.ok(existsSync(new URL(`../public/assets/${g}.svg`, import.meta.url)), g)
})
