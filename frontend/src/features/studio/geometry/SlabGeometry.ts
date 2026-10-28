import type { BIMSlab, Vec2 } from '../core/types'

export type SlabSolid = {
  polygon: Vec2[]
  thickness: number
  area: number
  volume: number
  closed: boolean
}

export function polygonArea(polygon: Vec2[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export function generateSlabGeometry(slab: BIMSlab): SlabSolid {
  const polygon = slab.geometry.polygon
  const closed = polygon.length >= 3
  const area = closed ? polygonArea(polygon) : 0
  return {
    polygon,
    thickness: slab.geometry.thickness,
    area,
    volume: area * slab.geometry.thickness,
    closed,
  }
}
