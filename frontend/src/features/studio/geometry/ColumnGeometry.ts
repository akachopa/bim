import type { BIMColumn, Vec2 } from '../core/types'

export type ColumnSolid = {
  polygon: Vec2[]
  width: number
  depth: number
  height: number
  boundingBox: { min: Vec2; max: Vec2 }
  volume: number
}

export function generateColumnGeometry(column: BIMColumn): ColumnSolid {
  const { width, depth, height } = column.geometry
  const cx = column.transform.position.x
  const cy = column.transform.position.z
  const hw = width / 2
  const hd = depth / 2
  const polygon = [
    { x: cx - hw, y: cy - hd },
    { x: cx + hw, y: cy - hd },
    { x: cx + hw, y: cy + hd },
    { x: cx - hw, y: cy + hd },
  ]
  return {
    polygon,
    width,
    depth,
    height,
    boundingBox: { min: { x: cx - hw, y: cy - hd }, max: { x: cx + hw, y: cy + hd } },
    volume: width * depth * height,
  }
}
