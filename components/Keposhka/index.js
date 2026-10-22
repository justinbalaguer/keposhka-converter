"use client"
import { useEffect, useRef, useState } from "react"
import { textToGlyphs } from "@/lib/encode"
import { canvasToBlob, loadGlyphs, paintGlyphs } from "@/lib/drawGlyphs"
import "./keposhka.css"

export default function Keposhka() {
  const [text, setText] = useState("")
  const [canShare, setCanShare] = useState(false)
  const canvasRef = useRef(null)
  const glyphs = textToGlyphs(text)
  const hasGlyphs = glyphs.some((g) => g !== "space")

  useEffect(() => setCanShare(typeof navigator.share === "function"), [])

  // Live preview: redraw on every change; `stale` drops results from an older keystroke.
  useEffect(() => {
    let stale = false
    loadGlyphs(textToGlyphs(text)).then((images) => {
      if (!stale && canvasRef.current) paintGlyphs(canvasRef.current, images)
    })
    return () => {
      stale = true
    }
  }, [text])

  const save = async () => {
    const blob = await canvasToBlob(canvasRef.current)
    const link = document.createElement("a")
    link.download = "keposhka.png"
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const share = async () => {
    const blob = await canvasToBlob(canvasRef.current)
    const file = new File([blob], "keposhka.png", { type: "image/png" })
    try {
      await navigator.share(navigator.canShare?.({ files: [file] }) ? { files: [file] } : { title: "Keposhka", url: location.href })
    } catch {}
  }

  return (
    <div className="kp-enc">
      <textarea
        className="kp-enc-input"
        placeholder="Type in English…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoCapitalize="sentences"
      />
      <div className="kp-enc-preview">
        {!hasGlyphs && <p className="kp-enc-empty">Your Keposhka appears here</p>}
        <canvas ref={canvasRef} hidden={!hasGlyphs} />
      </div>
      <div className="kp-enc-bar">
        <button className="kp-enc-btn" onClick={save} disabled={!hasGlyphs}>
          Save image
        </button>
        {canShare && (
          <button className="kp-enc-btn kp-enc-primary" onClick={share} disabled={!hasGlyphs}>
            Share
          </button>
        )}
      </div>
    </div>
  )
}
