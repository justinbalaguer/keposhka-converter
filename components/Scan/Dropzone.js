"use client"
import { useEffect, useState } from "react"
import Icon from "../Drawer/icons"
import "./dropzone.css"

// Start screen: pick from gallery, take a photo, drop a file or paste one.
export default function Dropzone({ onFile, error }) {
  const [over, setOver] = useState(false)
  const take = (files) => {
    const f = [...(files || [])].find((x) => x.type.startsWith("image/"))
    if (f) onFile(f)
  }

  useEffect(() => {
    const onPaste = (e) => take(e.clipboardData?.files)
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  })

  return (
    <div
      className="kp-drop"
      data-over={over}
      onDragOver={(e) => (e.preventDefault(), setOver(true))}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => (e.preventDefault(), setOver(false), take(e.dataTransfer.files))}
    >
      <span className="kp-drop-icon"><Icon name="scan" size={32} /></span>
      <h3>Add a photo of Keposhka</h3>
      <p>Drop it here, paste it, or pick one below.</p>
      {error && <p className="kp-drop-error" role="alert">{error}</p>}
      <div className="kp-drop-actions">
        <label className="kp-drop-btn kp-drop-btn-main">
          Choose photo
          <input type="file" accept="image/*" hidden onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
        </label>
        <label className="kp-drop-btn">
          Take photo
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
        </label>
      </div>
      <ul className="kp-drop-tips">
        <li>Hold the camera straight at the text.</li>
        <li>Fill the frame with the text; zoom in if small.</li>
        <li>Good light, no glare.</li>
      </ul>
    </div>
  )
}
