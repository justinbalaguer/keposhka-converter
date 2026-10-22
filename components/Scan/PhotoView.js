"use client"
import "./photoview.css"

// The photo with a tappable box over every word. Uncertain = dashed amber, selected = solid accent.
export default function PhotoView({ src, size, lines, selectedId, onSelect }) {
  const ar = size.width / size.height
  return (
    <div className="kp-photo" style={{ "--ar": ar }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Your photo" />
      {lines.flat().map((w) => (
        <button
          key={w.id}
          className="kp-photo-box"
          data-state={w.id === selectedId ? "selected" : w.reason && !w.done ? "check" : "ok"}
          style={{ left: `${w.box.x * 100}%`, top: `${w.box.y * 100}%`, width: `${w.box.w * 100}%`, height: `${w.box.h * 100}%` }}
          onClick={() => onSelect(w.id)}
          aria-label={`Word ${w.text || "(empty)"}`}
        />
      ))}
    </div>
  )
}
