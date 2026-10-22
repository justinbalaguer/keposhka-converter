"use client"
import "./loader.css"

// Shown while a photo is read: dimmed photo, sweeping beam, real progress.
export default function Loader({ src, progress, onCancel }) {
  const pct = Math.round((progress.fraction || 0) * 100)
  return (
    <div className="kp-load" role="status" aria-live="polite">
      <div className="kp-load-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
        <span className="kp-load-beam" />
      </div>
      <div className="kp-load-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="kp-load-label">{progress.label || "Starting…"} <b>{pct}%</b></p>
      <button className="kp-load-cancel" onClick={onCancel}>Cancel</button>
    </div>
  )
}
