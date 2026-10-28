import { add2, dist2, mul2, norm2, perp2, sub2 } from '../core/math'
import type { BIMDocument, BIMDoor, BIMWall, BIMWindow, Vec2 } from '../core/types'

export type WallSolid = {
  length: number
  height: number
  thickness: number
  polygon: Vec2[]
  center: Vec2
  direction: Vec2
  boundingBox: { min: Vec2; max: Vec2 }
  volume: number
  segments: Array<{ start: Vec2; end: Vec2; height: number; base: number }>
}

export function wallLength(wall: BIMWall): number {
  return dist2(wall.geometry.start, wall.geometry.end)
}

export function wallDirection(wall: BIMWall): Vec2 {
  return norm2(sub2(wall.geometry.end, wall.geometry.start))
}

export function wallPolygon(wall: BIMWall): Vec2[] {
  const dir = wallDirection(wall)
  const n = perp2(dir)
  const half = wall.geometry.thickness / 2
  const offset = mul2(n, half)
  const s = wall.geometry.start
  const e = wall.geometry.end
  return [add2(s, offset), add2(e, offset), add2(e, mul2(offset, -1)), add2(s, mul2(offset, -1))]
}

export function generateWallGeometry(wall: BIMWall, doc?: BIMDocument): WallSolid {
  const length = wallLength(wall)
  const height = wall.geometry.height
  const thickness = wall.geometry.thickness
  const polygon = wallPolygon(wall)
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  const openings = (doc ? doc.elements : []).filter(
    (el): el is BIMDoor | BIMWindow =>
      (el.type === 'door' || el.type === 'window') && el.hostWallId === wall.id,
  )
  const dir = wallDirection(wall)
  const segments = splitWallByOpenings(wall, openings)

  return {
    length,
    height,
    thickness,
    polygon,
    center: { x: (wall.geometry.start.x + wall.geometry.end.x) / 2, y: (wall.geometry.start.y + wall.geometry.end.y) / 2 },
    direction: dir,
    boundingBox: {
      min: { x: Math.min(...xs), y: Math.min(...ys) },
      max: { x: Math.max(...xs), y: Math.max(...ys) },
    },
    volume: Math.max(0, length * thickness * height - openingsVolume(openings, thickness)),
    segments,
  }
}

function openingsVolume(openings: Array<BIMDoor | BIMWindow>, thickness: number): number {
  return openings.reduce((sum, o) => sum + o.geometry.width * o.geometry.height * thickness, 0)
}

export function splitWallByOpenings(wall: BIMWall, openings: Array<BIMDoor | BIMWindow>) {
  const length = wallLength(wall)
  const dir = wallDirection(wall)
  const cuts = openings
    .map((o) => ({
      start: Math.max(0, o.geometry.offset),
      end: Math.min(length, o.geometry.offset + o.geometry.width),
      sill: o.geometry.sillHeight,
      head: o.geometry.sillHeight + o.geometry.height,
    }))
    .filter((c) => c.end > c.start)
    .sort((a, b) => a.start - b.start)

  const segments: Array<{ start: Vec2; end: Vec2; height: number; base: number }> = []
  let cursor = 0
  const origin = wall.geometry.start
  const pointAt = (d: number): Vec2 => ({ x: origin.x + dir.x * d, y: origin.y + dir.y * d })

  for (const cut of cuts) {
    if (cut.start > cursor + 1) {
      segments.push({
        start: pointAt(cursor),
        end: pointAt(cut.start),
        height: wall.geometry.height,
        base: wall.geometry.baseOffset,
      })
    }
    if (cut.sill > 0) {
      segments.push({
        start: pointAt(cut.start),
        end: pointAt(cut.end),
        height: cut.sill,
        base: wall.geometry.baseOffset,
      })
    }
    const head = wall.geometry.height - cut.head
    if (head > 1) {
      segments.push({
        start: pointAt(cut.start),
        end: pointAt(cut.end),
        height: head,
        base: wall.geometry.baseOffset + cut.head,
      })
    }
    cursor = Math.max(cursor, cut.end)
  }
  if (cursor < length - 1) {
    segments.push({
      start: pointAt(cursor),
      end: pointAt(length),
      height: wall.geometry.height,
      base: wall.geometry.baseOffset,
    })
  }
  if (segments.length === 0) {
    segments.push({
      start: wall.geometry.start,
      end: wall.geometry.end,
      height: wall.geometry.height,
      base: wall.geometry.baseOffset,
    })
  }
  return segments
}

export function wallPointAt(wall: BIMWall, offset: number): Vec2 {
  const dir = wallDirection(wall)
  return { x: wall.geometry.start.x + dir.x * offset, y: wall.geometry.start.y + dir.y * offset }
}
