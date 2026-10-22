"use client"
import Image from "next/image"
import { useCallback, useState } from "react"
import { Letters, Keposhka, Scan, Drawer } from "@/components"
import Icon from "@/components/Drawer/icons"
import { MODES } from "./modes"
import "./header.css"

export default function Header() {
  const [active, setActive] = useState("decode")
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const mode = MODES.find((m) => m.id === active)

  return (
    <>
      <header className="kp-head">
        <div className="kp-head-bar">
          <div className="kp-head-brand">
            <Image src="/mcr.png" alt="" width={28} height={28} />
            <h1>Keposhka</h1>
          </div>
          <button className="kp-head-burger" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Icon name="menu" />
          </button>
        </div>
        <div className="kp-head-mode">
          <h2>{mode.title}</h2>
          <p>{mode.hint}</p>
        </div>
      </header>

      <Drawer
        open={open}
        onClose={close}
        modes={MODES}
        active={active}
        onPick={(id) => {
          setActive(id)
          close()
        }}
      />

      {/* Every tool stays mounted so typed text and scan results survive switching. */}
      <section hidden={active !== "decode"}>
        <Letters />
      </section>
      <section hidden={active !== "scan"}>
        <Scan />
      </section>
      <section hidden={active !== "encode"}>
        <Keposhka />
      </section>
    </>
  )
}
