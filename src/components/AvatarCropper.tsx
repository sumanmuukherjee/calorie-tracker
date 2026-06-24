import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Self-contained circular avatar cropper. The user drags to pan and uses the
// slider / wheel / pinch to zoom inside a circular mask; the visible circle is
// what gets saved. The on-screen preview and the exported image are drawn with
// the SAME transform (a <canvas>), so what you see is exactly what you get — no
// coordinate-mapping drift between preview and output.
//
// The on-screen viewport size is measured at runtime (so it fits small phones
// and landscape), while the export is always a fixed-size square.

const MAX_VIEW = 280 // largest on-screen crop viewport, px (shrinks on small screens)
const OUT = 448 // exported image size, px (square)
const MAX_ZOOM = 4

export function AvatarCropper({ file, onCancel, onCropped }: { file: File; onCancel: () => void; onCropped: (blob: Blob) => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const bmpRef = useRef<ImageBitmap | null>(null)
  const baseScale = useRef(1) // scale at zoom=1 so the image just covers the circle
  const offset = useRef({ x: 0, y: 0 }) // pan in viewport px, relative to centre
  const zoomRef = useRef(1)
  const viewRef = useRef(MAX_VIEW)
  const [view, setView] = useState(MAX_VIEW)
  const [zoom, setZoom] = useState(1)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null)

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1

  // ---- geometry (all read refs so imperative handlers never go stale) ----
  const clamp = () => {
    const bmp = bmpRef.current
    if (!bmp) return
    const v = viewRef.current
    const scale = baseScale.current * zoomRef.current
    const maxX = Math.max(0, (bmp.width * scale - v) / 2)
    const maxY = Math.max(0, (bmp.height * scale - v) / 2)
    offset.current.x = Math.min(maxX, Math.max(-maxX, offset.current.x))
    offset.current.y = Math.min(maxY, Math.max(-maxY, offset.current.y))
  }

  const draw = () => {
    const canvas = canvasRef.current
    const bmp = bmpRef.current
    if (!canvas || !bmp) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    clamp()
    const v = viewRef.current
    const scale = baseScale.current * zoomRef.current
    const dw = bmp.width * scale
    const dh = bmp.height * scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, v, v)
    ctx.drawImage(bmp, v / 2 - dw / 2 + offset.current.x, v / 2 - dh / 2 + offset.current.y, dw, dh)
  }

  // Zoom toward a focal point (viewport coords relative to centre). Keeps the
  // point under the cursor / pinch midpoint fixed; defaults to the centre.
  const applyZoom = (zRaw: number, fx = 0, fy = 0) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, zRaw))
    const oldScale = baseScale.current * zoomRef.current
    const newScale = baseScale.current * z
    if (oldScale > 0) {
      const k = newScale / oldScale
      offset.current.x = fx - (fx - offset.current.x) * k
      offset.current.y = fy - (fy - offset.current.y) * k
    }
    zoomRef.current = z
    setZoom(z)
    clamp()
    draw()
  }

  const fitBaseScale = () => {
    const bmp = bmpRef.current
    if (!bmp) return
    baseScale.current = Math.max(viewRef.current / bmp.width, viewRef.current / bmp.height)
  }

  // ---- load the picked file as a bitmap (EXIF-corrected) ----
  useEffect(() => {
    let cancelled = false
    const urlRef = { current: '' }
    const setup = (bmp: ImageBitmap) => {
      if (cancelled) {
        bmp.close?.()
        return
      }
      bmpRef.current = bmp
      offset.current = { x: 0, y: 0 }
      zoomRef.current = 1
      setZoom(1)
      fitBaseScale()
      setReady(true)
      draw() // paint immediately; the canvas is already mounted and sized
    }
    const opts = { imageOrientation: 'from-image' } as ImageBitmapOptions
    createImageBitmap(file, opts)
      .then(setup)
      .catch(() => {
        const img = new Image()
        urlRef.current = URL.createObjectURL(file)
        const done = () => {
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
            urlRef.current = ''
          }
        }
        img.onload = () => createImageBitmap(img).then(setup).catch(() => setError('Could not read that image.')).finally(done)
        img.onerror = () => {
          done()
          setError('Could not read that image.')
        }
        img.src = urlRef.current
      })
    return () => {
      cancelled = true
      bmpRef.current?.close?.()
      bmpRef.current = null
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [file])

  // ---- measure the stage so the viewport fits the actual screen ----
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const apply = () => {
      const w = Math.round(el.clientWidth)
      if (!w || w === viewRef.current) return
      const old = viewRef.current
      if (old > 0) {
        offset.current.x *= w / old
        offset.current.y *= w / old
      }
      viewRef.current = w
      fitBaseScale()
      setView(w)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (ready) draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoom, view])

  // ---- lock body scroll + Escape to close while the modal is open ----
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [busy, onCancel])

  // ---- wheel zoom (native listener so we can preventDefault) ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const fx = e.clientX - rect.left - viewRef.current / 2
      const fy = e.clientY - rect.top - viewRef.current / 2
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.08 : 0.926), fx, fy)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dist = () => {
    const pts = [...pointers.current.values()]
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) pinchStart.current = { dist: dist(), zoom: zoomRef.current }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2 && pinchStart.current) {
      const pts = [...pointers.current.values()]
      const rect = canvasRef.current?.getBoundingClientRect()
      const cx = (pts[0].x + pts[1].x) / 2 - (rect?.left ?? 0) - viewRef.current / 2
      const cy = (pts[0].y + pts[1].y) / 2 - (rect?.top ?? 0) - viewRef.current / 2
      applyZoom((pinchStart.current.zoom * dist()) / pinchStart.current.dist, cx, cy)
      return
    }
    offset.current.x += e.clientX - prev.x
    offset.current.y += e.clientY - prev.y
    draw()
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
  }

  const save = () => {
    const bmp = bmpRef.current
    if (!bmp) return
    setBusy(true)
    clamp()
    const out = document.createElement('canvas')
    out.width = OUT
    out.height = OUT
    const ctx = out.getContext('2d')
    if (!ctx) {
      setBusy(false)
      setError('Could not process the image.')
      return
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, OUT, OUT)
    const f = OUT / viewRef.current // viewport px -> output px
    const scale = baseScale.current * zoomRef.current * f
    const dw = bmp.width * scale
    const dh = bmp.height * scale
    ctx.drawImage(bmp, OUT / 2 - dw / 2 + offset.current.x * f, OUT / 2 - dh / 2 + offset.current.y * f, dw, dh)
    out.toBlob(
      (blob) => {
        setBusy(false)
        if (blob) onCropped(blob)
        else setError('Could not process the image.')
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="crop-backdrop" onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="crop-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Crop profile photo" tabIndex={-1}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Position your photo</div>
        <div className="tiny muted" style={{ marginBottom: 14 }}>Drag to move · pinch or use the slider to zoom</div>

        <div className="crop-stage" ref={stageRef}>
          <canvas
            ref={canvasRef}
            width={Math.round(view * dpr)}
            height={Math.round(view * dpr)}
            style={{ width: view, height: view, display: 'block', touchAction: 'none', cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <div className="crop-ring" />
          {!ready && !error && <div className="crop-loading tiny muted">Loading…</div>}
        </div>

        <div className="crop-controls">
          <i className="ti ti-photo" style={{ fontSize: 16, color: 'var(--text-3)' }} aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => applyZoom(parseFloat(e.target.value))}
            aria-label="Zoom"
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <i className="ti ti-photo" style={{ fontSize: 22, color: 'var(--text-3)' }} aria-hidden="true" />
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{error}</div>}

        <div className="crop-actions">
          <button type="button" className="lp-btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="primary" style={{ flex: 1 }} onClick={save} disabled={busy || !ready}>
            {busy ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
