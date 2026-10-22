"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { GLYPHS } from "@/lib/glyphs"
import { scanImage } from "@/lib/scanImage"
import { updateWord, removeWord, insertAfter, needsCheck } from "@/lib/wordsState"
import Dropzone from "./Dropzone"
import Loader from "./Loader"
import PhotoView from "./PhotoView"
import WordList from "./WordList"
import WordEditor from "./WordEditor"
import "./scan.css"

const NO_TEXT = "No Keposhka found. Move closer, hold the camera straight and try again."

export default function Scan() {
  const [phase, setPhase] = useState("idle") // idle | busy | done
  const [src, setSrc] = useState(null)
  const [progress, setProgress] = useState({})
  const [error, setError] = useState("")
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [lines, setLines] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const abort = useRef(null)
  const nextId = useRef(-1) // hand-added words get negative ids so they never clash with scanned ones

  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => () => src && URL.revokeObjectURL(src), [src])

  const reset = useCallback(() => {
    abort.current?.abort()
    setPhase("idle")
    setSrc(null)
    setLines([])
    setSelectedId(null)
    setReviewing(false)
  }, [])

  const start = async (file) => {
    abort.current?.abort()
    const ctl = (abort.current = new AbortController())
    setSrc(URL.createObjectURL(file))
    setError("")
    setProgress({ fraction: 0, label: "Loading photo" })
    setPhase("busy")
    try {
      const r = await scanImage(file, GLYPHS, { onProgress: setProgress, signal: ctl.signal })
      if (ctl.signal.aborted) return
      if (!r.lines.flat().length) throw new Error(NO_TEXT)
      setSize({ width: r.width, height: r.height })
      setLines(r.lines)
      setSelectedId(null)
      setReviewing(false)
      setPhase("done")
    } catch (e) {
      if (ctl.signal.aborted) return
      reset()
      setError(e.message === NO_TEXT ? NO_TEXT : "Could not read that image. Try another photo.")
    }
  }

  const queue = needsCheck(lines)
  const selected = lines.flat().find((w) => w.id === selectedId)
  const qi = reviewing ? queue.findIndex((w) => w.id === selectedId) : -1

  const patch = (p) => setLines((l) => updateWord(l, selectedId, p))
  const goto = (w) => (w ? setSelectedId(w.id) : (setSelectedId(null), setReviewing(false)))
  const done = () => {
    const rest = queue.filter((w) => w.id !== selectedId)
    patch({ done: true })
    if (reviewing) goto(rest[Math.min(Math.max(qi, 0), rest.length - 1)])
    else setSelectedId(null)
  }
  const step = (d) => goto(queue[(qi + d + queue.length) % queue.length])
  const remove = () => {
    const rest = queue.filter((w) => w.id !== selectedId)
    setLines((l) => removeWord(l, selectedId))
    if (reviewing) goto(rest[Math.min(Math.max(qi, 0), rest.length - 1)])
    else setSelectedId(null)
  }
  const insert = () => {
    const id = nextId.current--
    const box = selected.box
    setLines((l) => insertAfter(l, selectedId, { id, text: "", units: [], items: [], box, suggestions: [], reason: null, done: true, edited: true }))
    setSelectedId(id)
    setReviewing(false)
  }

  if (phase === "idle") return <Dropzone onFile={start} error={error} />
  if (phase === "busy") return <Loader src={src} progress={progress} onCancel={reset} />

  return (
    <div className="kp-scan">
      <PhotoView src={src} size={size} lines={lines} selectedId={selectedId} onSelect={(id) => (setSelectedId(id), setReviewing(false))} />
      {selected ? (
        <WordEditor
          key={selected.id}
          word={selected}
          src={src}
          size={size}
          position={qi >= 0 ? { i: qi + 1, n: queue.length } : null}
          onChange={patch}
          onDone={done}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onRemove={remove}
          onInsert={insert}
          onClose={() => (setSelectedId(null), setReviewing(false))}
        />
      ) : (
        <WordList
          lines={lines}
          selectedId={selectedId}
          onSelect={(id) => (setSelectedId(id), setReviewing(false))}
          queueLength={queue.length}
          onReview={() => (setReviewing(true), setSelectedId(queue[0].id))}
          onReset={reset}
        />
      )}
    </div>
  )
}
