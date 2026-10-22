"use client"
import { useState } from "react"
import { wordsToText } from "@/lib/words"
import "./wordlist.css"

// The reading, one chip per word. Chips that need a look are amber.
export default function WordList({ lines, selectedId, onSelect, queueLength, onReview, onReset }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wordsToText(lines))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="kp-words">
      <div className="kp-words-bar" data-clear={queueLength === 0}>
        {queueLength ? (
          <>
            <span><b>{queueLength}</b> to check</span>
            <button onClick={onReview}>Start review</button>
          </>
        ) : (
          <span>All words checked. Tap any word to change it.</span>
        )}
      </div>
      <div className="kp-words-text">
        {lines.map((line, i) => (
          <p key={i}>
            {line.map((w) => (
              <button
                key={w.id}
                className="kp-words-chip"
                data-state={w.id === selectedId ? "selected" : w.reason && !w.done ? "check" : "ok"}
                onClick={() => onSelect(w.id)}
              >
                {w.text || "?"}
              </button>
            ))}
          </p>
        ))}
      </div>
      <div className="kp-words-actions">
        <button className="kp-words-main" onClick={copy}>{copied ? "Copied" : "Copy text"}</button>
        <button onClick={onReset}>Scan another</button>
      </div>
    </div>
  )
}
