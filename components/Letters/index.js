"use client"
import Image from "next/image"
import { useState } from "react"
import { GLYPHS, NUMBERS, glyphToText } from "@/lib/glyphs"
import "./letters.css"

export default function Letters() {
  const [parts, setParts] = useState([])
  const [copied, setCopied] = useState(false)
  const text = parts.join("")

  const add = (value) => {
    navigator.vibrate?.(8)
    setParts((p) => [...p, value])
  }

  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="kp-dec">
      <div className="kp-dec-top">
        <div className="kp-dec-out" aria-live="polite">
          {text ? <p>{text}</p> : <p className="kp-dec-hint">Tap the glyphs you see on screen</p>}
          {text && (
            <button className="kp-dec-clear" onClick={() => setParts([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="kp-dec-nums">
        {NUMBERS.map((n) => (
          <button key={n} className="kp-dec-key kp-dec-num" onClick={() => add(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="kp-dec-grid">
        {GLYPHS.map((g) => (
          <button key={g} className="kp-dec-key" aria-label={glyphToText(g)} onClick={() => add(glyphToText(g))}>
            <Image src={`/assets/${g}.svg`} alt="" width={50} height={50} unoptimized />
          </button>
        ))}
      </div>

      <div className="kp-dec-bar">
        <button className="kp-dec-act kp-dec-space" onClick={() => add(" ")}>
          Space
        </button>
        <button className="kp-dec-act" onClick={() => setParts((p) => p.slice(0, -1))} aria-label="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
            <path d="m17 9-5 5m0-5 5 5" />
          </svg>
        </button>
        <button className="kp-dec-act kp-dec-copy" onClick={copy} disabled={!text}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
