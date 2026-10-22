import { normalize, tightBox } from "./detect.js"

// Plain text characters that can appear next to Keposhka: digits and common punctuation.
export const SYMBOLS = "0123456789#:.,!?-/%&$()+'"

// Font variants: [slant, extra stroke]. The photo's font may be italic and heavier than a normal bold.
export const VARIANTS = [[0, 0], [0.2, 0], [0, 0.06], [0.2, 0.06], [0, 0.13], [0.2, 0.13]]

// render(char, slant, stroke) -> mask of that character in a sans-serif font (see scanImage.js).
// Each template remembers where it sits relative to a "0" (cap height), so "." and "-" are not confused.
export function symbolTemplates(render) {
  const out = []
  for (const [slant, stroke] of VARIANTS) {
    const ref = tightBox(render("0", slant, stroke))
    const H = ref.y1 - ref.y0 + 1
    for (const char of SYMBOLS) {
      const mask = render(char, slant, stroke)
      const box = tightBox(mask)
      if (!box) continue
      out.push({ char, bonus: /\d/.test(char) ? 0.03 : 0, ...normalize(mask, box, true), yc: ((box.y0 + box.y1) / 2 - ref.y0) / H, hr: (box.y1 - box.y0 + 1) / H })
    }
  }
  return out
}
