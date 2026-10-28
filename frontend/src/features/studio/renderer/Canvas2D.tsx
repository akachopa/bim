import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { formatMm } from '../core/math'
import { wallPolygon } from '../geometry/WallGeometry'
import { generateColumnGeometry } from '../geometry/ColumnGeometry'
import { useStudioStore } from '../../../stores/studioStore'
import type { BIMElement, Vec2 } from '../core/types'

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const document = useStudioStore((s) => s.document)
  const camera = useStudioStore((s) => s.camera2d)
  const selectedIds = useStudioStore((s) => s.selectedIds)
  const isolatedIds = useStudioStore((s) => s.isolatedIds)
  const tool = useStudioStore((s) => s.tool)
  const snap = useStudioStore((s) => s.snap)
  const preview = useStudioStore((s) => s.preview)
  const measure = useStudioStore((s) => s.measure)
  const boxSelect = useStudioStore((s) => s.boxSelect)
  const pointerWorld = useStudioStore((s) => s.pointerWorld)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement
    if (!parent) return
    const resize = () => {
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      draw()
    }
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#f7f5f1'
      ctx.fillRect(0, 0, w, h)
      const toScreen = (p: Vec2) => ({
        x: w / 2 + (p.x - camera.x) * camera.zoom * devicePixelRatio,
        y: h / 2 - (p.y - camera.y) * camera.zoom * devicePixelRatio,
      })

      const gridSize = document.settings.gridSize || 1000
      ctx.strokeStyle = '#e8dfd2'
      ctx.lineWidth = 1
      const worldW = w / (camera.zoom * devicePixelRatio)
      const worldH = h / (camera.zoom * devicePixelRatio)
      const startX = Math.floor((camera.x - worldW / 2) / gridSize) * gridSize
      const startY = Math.floor((camera.y - worldH / 2) / gridSize) * gridSize
      for (let x = startX; x < camera.x + worldW / 2; x += gridSize) {
        const a = toScreen({ x, y: camera.y - worldH })
        const b = toScreen({ x, y: camera.y + worldH })
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      for (let y = startY; y < camera.y + worldH / 2; y += gridSize) {
        const a = toScreen({ x: camera.x - worldW, y })
        const b = toScreen({ x: camera.x + worldW, y })
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      ctx.font = `${11 * devicePixelRatio}px IBM Plex Sans`
      for (const grid of document.grids) {
        ctx.strokeStyle = '#b98542'
        ctx.lineWidth = 1.5 * devicePixelRatio
        ctx.setLineDash([6 * devicePixelRatio, 4 * devicePixelRatio])
        if (grid.axis === 'X') {
          const a = toScreen({ x: grid.position, y: camera.y - 20000 })
          const b = toScreen({ x: grid.position, y: camera.y + 20000 })
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.fillStyle = '#b98542'
          ctx.fillText(grid.label, a.x + 6, 24 * devicePixelRatio)
        } else {
          const a = toScreen({ x: camera.x - 20000, y: grid.position })
          const b = toScreen({ x: camera.x + 20000, y: grid.position })
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.fillStyle = '#b98542'
          ctx.fillText(grid.label, 10 * devicePixelRatio, a.y - 6)
        }
        ctx.setLineDash([])
      }

      const visible = document.elements.filter((el) => {
        if (el.hidden) return false
        if (isolatedIds.length && !isolatedIds.includes(el.id)) return false
        if (el.levelId && document.settings.activeLevelId && el.levelId !== document.settings.activeLevelId) {
          return el.type === 'wall' || el.type === 'column' || el.type === 'slab' || el.type === 'door' || el.type === 'window'
        }
        return true
      })

      for (const el of visible) drawElement(ctx, el, toScreen, selectedIds.includes(el.id), document)

      if (preview?.type === 'wall' && preview.start && preview.end) {
        const s = toScreen(preview.start as Vec2)
        const e = toScreen(preview.end as Vec2)
        ctx.strokeStyle = '#b98542'
        ctx.lineWidth = 3 * devicePixelRatio
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(e.x, e.y)
        ctx.stroke()
        const mx = (s.x + e.x) / 2
        const my = (s.y + e.y) / 2
        ctx.fillStyle = '#22272b'
        ctx.fillText(formatMm(Math.hypot((preview.end as Vec2).x - (preview.start as Vec2).x, (preview.end as Vec2).y - (preview.start as Vec2).y)), mx, my - 8)
      }
      if (preview?.type === 'slab' && Array.isArray(preview.polygon)) {
        const poly = preview.polygon as Vec2[]
        if (poly.length) {
          ctx.beginPath()
          const f = toScreen(poly[0])
          ctx.moveTo(f.x, f.y)
          poly.slice(1).forEach((pt) => {
            const s = toScreen(pt)
            ctx.lineTo(s.x, s.y)
          })
          ctx.strokeStyle = '#66745b'
          ctx.stroke()
        }
      }
      if (snap && snap.kind !== 'free') {
        const s = toScreen(snap.point)
        ctx.strokeStyle = '#c89c54'
        ctx.lineWidth = 2 * devicePixelRatio
        ctx.strokeRect(s.x - 5 * devicePixelRatio, s.y - 5 * devicePixelRatio, 10 * devicePixelRatio, 10 * devicePixelRatio)
        ctx.fillStyle = '#c89c54'
        ctx.fillText(snap.kind, s.x + 8, s.y - 8)
        if (snap.helper) {
          const a = toScreen(snap.helper.from)
          const b = toScreen(snap.helper.to)
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
      if (measure) {
        const a = toScreen(measure.a)
        const b = toScreen(measure.b)
        ctx.strokeStyle = '#66745b'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.fillStyle = '#22272b'
        ctx.fillText(formatMm(Math.hypot(measure.b.x - measure.a.x, measure.b.y - measure.a.y)), (a.x + b.x) / 2, (a.y + b.y) / 2)
      }
      if (boxSelect) {
        const a = toScreen(boxSelect.a)
        const b = toScreen(boxSelect.b)
        ctx.strokeStyle = '#b98542'
        ctx.setLineDash([4, 3])
        ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
        ctx.setLineDash([])
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [document, camera, selectedIds, isolatedIds, snap, preview, measure, boxSelect, pointerWorld, tool])

  const toWorld = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const sx = event.clientX - rect.left
    const sy = event.clientY - rect.top
    return {
      x: camera.x + (sx - rect.width / 2) / camera.zoom,
      y: camera.y - (sy - rect.height / 2) / camera.zoom,
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-warm">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          useStudioStore.getState().pointerDown(toWorld(e), { shift: e.shiftKey, button: e.button })
        }}
        onPointerMove={(e) => useStudioStore.getState().pointerMove(toWorld(e), { shift: e.shiftKey })}
        onPointerUp={() => useStudioStore.getState().pointerUp({ x: 0, y: 0 })}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault()
          useStudioStore.getState().zoomAt(e.deltaY > 0 ? 0.9 : 1.1)
        }}
      />
      <div ref={overlayRef} className="pointer-events-none absolute left-3 top-3 rounded bg-charcoal/80 px-2 py-1 text-[11px] uppercase tracking-wide text-sand">
        Denah 2D
      </div>
    </div>
  )
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: BIMElement,
  toScreen: (p: { x: number; y: number }) => { x: number; y: number },
  selected: boolean,
  doc: { materials: Array<{ id: string; color: string }> },
) {
  const material = doc.materials.find((m) => m.id === el.materialId)
  const color = material?.color ?? '#9aa0a6'
  ctx.fillStyle = selected ? '#c89c54' : color
  ctx.strokeStyle = selected ? '#22272b' : '#3a4045'
  ctx.lineWidth = selected ? 2.5 * devicePixelRatio : 1 * devicePixelRatio

  if (el.type === 'wall') {
    const poly = wallPolygon(el).map(toScreen)
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    poly.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.globalAlpha = 0.85
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
  } else if (el.type === 'column') {
    const poly = generateColumnGeometry(el).polygon.map(toScreen)
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    poly.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (el.type === 'beam') {
    const a = toScreen({ x: el.geometry.start.x, y: el.geometry.start.z })
    const b = toScreen({ x: el.geometry.end.x, y: el.geometry.end.z })
    ctx.strokeStyle = selected ? '#c89c54' : '#5c6770'
    ctx.lineWidth = 4 * devicePixelRatio
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  } else if (el.type === 'slab') {
    const poly = el.geometry.polygon.map(toScreen)
    if (!poly.length) return
    ctx.beginPath()
    ctx.moveTo(poly[0].x, poly[0].y)
    poly.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.globalAlpha = 0.25
    ctx.fillStyle = selected ? '#c89c54' : '#9aa0a6'
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
  } else if (el.type === 'door' || el.type === 'window') {
    const host = el.hostWallId
    void host
    ctx.fillStyle = el.type === 'door' ? '#a67c52' : '#8ec6e6'
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, 1)
  }
}
