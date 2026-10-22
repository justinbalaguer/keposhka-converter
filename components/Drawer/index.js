"use client"
import { useEffect, useRef } from "react"
import Icon from "./icons"
import "./drawer.css"

// Side menu for switching tools. `modes`: [{ id, icon, label, hint }].
export default function Drawer({ open, onClose, modes, active, onPick }) {
  const panel = useRef(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    panel.current?.querySelector("[aria-current=true]")?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      opener?.focus?.()
    }
  }, [open, onClose])

  return (
    <div className="kp-drawer" data-open={open}>
      <div className="kp-drawer-scrim" onClick={onClose} />
      <nav className="kp-drawer-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Choose a tool" inert={!open}>
        <div className="kp-drawer-top">
          <span>What do you want to do?</span>
          <button className="kp-drawer-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <ul>
          {modes.map((m) => (
            <li key={m.id}>
              <button className="kp-drawer-item" aria-current={m.id === active} onClick={() => onPick(m.id)}>
                <span className="kp-drawer-icon">
                  <Icon name={m.icon} />
                </span>
                <span className="kp-drawer-text">
                  <strong>{m.label}</strong>
                  <small>{m.hint}</small>
                </span>
                {m.id === active && <Icon name="check" size={18} />}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
