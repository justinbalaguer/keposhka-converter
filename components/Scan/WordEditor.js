"use client"
import { useEffect, useRef, useState } from "react"
import { pickAlt } from "@/lib/wordsState"
import { GLYPHS, glyphToText } from "@/lib/glyphs"
import { SYMBOLS } from "@/lib/symbols"
import "./wordeditor.css"

// Every glyph and symbol, so the right one is always reachable when the top guesses miss.
const EVERYTHING = [
  ...GLYPHS.map((glyph) => ({ glyph, text: glyphToText(glyph) })),
  ...[...SYMBOLS].map((char) => ({ char, text: char })),
]

const PAD = 0.25 // context around the word, as a fraction of its size

// Zoomed crop of the word from the photo, so the person can compare it with the reading.
function Crop({ src, size, box }) {
  const px = size.width * box.w, py = size.height * box.h
  const w = box.w * (1 + PAD * 2), h = box.h * (1 + PAD * 2)
  const x = Math.max(0, box.x - box.w * PAD), y = Math.max(0, box.y - box.h * PAD)
  const cw = Math.min(1 - x, w), ch = Math.min(1 - y, h)
  return (
    <div
      className="kp-edit-crop"
      style={{
        aspectRatio: (size.width * cw) / (size.height * ch),
        backgroundImage: `url(${src})`,
        backgroundSize: `${100 / cw}% ${100 / ch}%`,
        backgroundPosition: `${cw >= 1 ? 0 : (x / (1 - cw)) * 100}% ${ch >= 1 ? 0 : (y / (1 - ch)) * 100}%`,
      }}
      role="img"
      aria-label={`Zoomed word, ${Math.round(px)} by ${Math.round(py)} pixels`}
    />
  )
}

export default function WordEditor({ word, src, size, position, onChange, onDone, onPrev, onNext, onRemove, onInsert, onClose }) {
  const [open, setOpen] = useState(null) // glyph index whose alternatives are showing
  const [all, setAll] = useState(false) // show every glyph, not just the top guesses
  const input = useRef(null)
  useEffect(() => (setOpen(null), setAll(false)), [word.id])

  const typed = (text) => onChange({ text, units: [...text], items: [], edited: true, done: true })

  return (
    <section className="kp-edit" aria-label="Edit word">
      <header>
        <span>{position ? `Check ${position.i} of ${position.n}` : "Edit word"}</span>
        <button onClick={onClose} aria-label="Close editor">Close</button>
      </header>
      {word.reason && !word.done && <p className="kp-edit-reason">{word.reason}</p>}
      <Crop src={src} size={size} box={word.box} />

      <label className="kp-edit-field">
        <span>What it says</span>
        <input ref={input} value={word.text} onChange={(e) => typed(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck="false" />
      </label>

      {word.suggestions.length > 0 && !word.edited && (
        <div className="kp-edit-sugg">
          <span>Did you mean</span>
          {word.suggestions.map((s) => (
            <button key={s.text} onClick={() => onChange({ units: s.units, text: s.text, done: true, items: [] })}>{s.text}</button>
          ))}
        </div>
      )}

      {word.items.length > 0 && (
        <div className="kp-edit-glyphs">
          <span>Tap a glyph that was read wrong</span>
          <div>
            {word.items.map((it, i) => (
              <button key={i} data-open={open === i} onClick={() => (setOpen(open === i ? null : i), setAll(false))}>
                {it.char ? <b>{it.char}</b> : <img src={`/assets/${it.glyph}.svg`} alt="" />}
                <small>{word.units[i]}</small>
              </button>
            ))}
          </div>
          {open !== null && word.items[open] && (
            <div className="kp-edit-alts" role="group" aria-label="Other readings">
              {(all ? EVERYTHING : word.items[open].alts).map((a, k) => (
                <button key={k} onClick={() => (onChange(pickAlt(word, open, a)), setOpen(null))}>
                  {a.char ? <b>{a.char}</b> : <img src={`/assets/${a.glyph}.svg`} alt="" />}
                  <small>{a.text}</small>
                </button>
              ))}
              <button onClick={() => setAll(!all)}><small>{all ? "Top guesses" : "Show all"}</small></button>
            </div>
          )}
        </div>
      )}

      <div className="kp-edit-nav">
        {position && <button onClick={onPrev} disabled={position.n < 2}>Back</button>}
        <button className="kp-edit-ok" onClick={onDone}>{position ? "Looks right" : "Done"}</button>
        {position && <button onClick={onNext} disabled={position.n < 2}>Skip</button>}
      </div>
      <div className="kp-edit-more">
        <button onClick={onInsert}>Add word after</button>
        <button onClick={onRemove} className="kp-edit-danger">Remove word</button>
      </div>
    </section>
  )
}
