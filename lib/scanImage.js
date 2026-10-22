import { MIN_SCORE, normalize, quality, readImage, tightBox } from "./detect.js"
import { buildIndex, dictionaryHits } from "./correct.js"
import { buildWords } from "./words.js"
import { symbolTemplates } from "./symbols.js"

const MAX_SIDE = 1200
const T = 192 // template render size

let templates, index

// Digits and punctuation are plain text in the photo: render them with the browser's own sans-serif font.
function renderChar(canvas, ch, slant, stroke) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, 160, 160)
  ctx.setTransform(1, 0, -slant, 1, slant * 120, 0) // lean right around the baseline
  ctx.font = 'bold 96px "Helvetica Neue", Arial, "Liberation Sans", sans-serif'
  ctx.fillText(ch, 40, 120)
  if (stroke) {
    ctx.lineWidth = stroke * 96
    ctx.strokeText(ch, 40, 120)
  }
  const px = ctx.getImageData(0, 0, 160, 160).data
  return { data: Uint8Array.from({ length: 160 * 160 }, (_, i) => (px[i * 4 + 3] > 128 ? 1 : 0)), w: 160, h: 160 }
}

async function loadTemplates(glyphs) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = T
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const out = []
  const images = await Promise.all(glyphs.map((glyph) => new Promise((res) => Object.assign(new Image(), { onload() { res(this) }, onerror: () => res(null), src: `/assets/${glyph}.svg` }))))
  for (const [k, glyph] of glyphs.entries()) {
    const img = images[k]
    if (!img) continue
    ctx.clearRect(0, 0, T, T)
    ctx.drawImage(img, 0, 0, T, T)
    const px = ctx.getImageData(0, 0, T, T).data
    const mask = { data: Uint8Array.from({ length: T * T }, (_, i) => (px[i * 4 + 3] > 128 ? 1 : 0)), w: T, h: T }
    const box = tightBox(mask)
    if (box) out.push({ glyph, ...normalize(mask, box) })
  }
  const sheet = document.createElement("canvas")
  sheet.width = sheet.height = 160
  return [...out, ...symbolTemplates((ch, slant, stroke) => renderChar(sheet, ch, slant, stroke))]
}

const abortIf = (signal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
}

// Image file -> { lines, width, height }: lines of editable words (see words.js) with their positions on the
// photo, `width` x `height` being the size the photo was analysed at (same aspect ratio as the original).
// onProgress({ fraction, label }) reports 0..1; `signal` cancels.
export async function scanImage(file, glyphs, { onProgress, signal } = {}) {
  const report = (fraction, label) => onProgress?.({ fraction, label })
  if (!templates) {
    report(0.02, "Loading glyph shapes…")
    templates = await loadTemplates(glyphs)
  }
  abortIf(signal)
  if (!index) {
    report(0.12, "Loading dictionary…")
    index = buildIndex(await (await fetch("/words.txt")).text())
  }
  abortIf(signal)
  report(0.16, "Reading the photo…")
  const bmp = await createImageBitmap(file)
  // Small photos are upscaled (smoothly) so thin glyph strokes survive thresholding; big ones are shrunk.
  const scale = Math.min(3, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bmp, 0, 0, w, h)
  const px = ctx.getImageData(0, 0, w, h).data
  const lum = new Uint8Array(w * h)
  for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
  const judge = (lines) => dictionaryHits(lines, templates, index, MIN_SCORE) + 0.01 * quality(lines)
  const { lines, tilt } = await readImage(lum, w, h, templates, {
    judge,
    signal,
    onProgress: (f) => report(0.2 + f * 0.72, "Looking for Keposhka…"),
  })
  report(0.94, "Working out the letters…")
  await new Promise((resolve) => setTimeout(resolve, 0))
  abortIf(signal)
  return { lines: buildWords(lines, templates, index, { minScore: MIN_SCORE, tilt, width: w, height: h }), width: w, height: h }
}
