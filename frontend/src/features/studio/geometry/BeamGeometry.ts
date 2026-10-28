import { dist2 } from '../core/math'
import type { BIMBeam, Vec2 } from '../core/types'

export type BeamSolid = {
  length: number
  width: number
  height: number
  start: Vec2
  end: Vec2
  volume: number
}

export function generateBeamGeometry(beam: BIMBeam): BeamSolid {
  const start = { x: beam.geometry.start.x, y: beam.geometry.start.z }
  const end = { x: beam.geometry.end.x, y: beam.geometry.end.z }
  const length = dist2(start, end)
  return {
    length,
    width: beam.geometry.width,
    height: beam.geometry.height,
    start,
    end,
    volume: length * beam.geometry.width * beam.geometry.height,
  }
}
