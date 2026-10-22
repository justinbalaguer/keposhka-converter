const COLS = 12
const CELL = 96
const PAD = 32
const cache = new Map()

function load(glyph) {
  if (!cache.has(glyph)) {
    cache.set(
      glyph,
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = `/assets/${glyph}.svg`
      })
    )
  }
  return cache.get(glyph)
}

// Spaces have no image, so they resolve to null and stay blank.
export function loadGlyphs(glyphs) {
  return Promise.all(glyphs.map((g) => (g === "space" ? null : load(g))))
}

// Fixed internal resolution: the CSS size scales it, and the saved PNG is always sharp.
export function paintGlyphs(canvas, images) {
  const rows = Math.max(1, Math.ceil(images.length / COLS))
  canvas.width = COLS * CELL + PAD * 2
  canvas.height = rows * CELL + PAD * 2
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  images.forEach((img, i) => {
    if (img) ctx.drawImage(img, PAD + (i % COLS) * CELL, PAD + Math.floor(i / COLS) * CELL, CELL, CELL)
  })
}

export const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
