import { dist2, lerp2, projectOnSegment, roundTo, segmentIntersection } from '../core/math'
import type { BIMDocument, BIMWall, SnapKind, SnapResult, Vec2 } from '../core/types'

const PRIORITY: SnapKind[] = [
  'intersection',
  'endpoint',
  'midpoint',
  'grid',
  'orthogonal',
  'perpendicular',
  'wall-centerline',
  'free',
]

export function snapPoint(
  world: Vec2,
  doc: BIMDocument,
  opts?: { origin?: Vec2; orthogonal?: boolean; threshold?: number },
): SnapResult {
  const threshold = opts?.threshold ?? Math.max(120, (doc.settings.gridSize ?? 1000) * 0.12)
  const candidates: SnapResult[] = []

  const walls = doc.elements.filter((el): el is BIMWall => el.type === 'wall' && !el.hidden)

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const hit = segmentIntersection(
        walls[i].geometry.start,
        walls[i].geometry.end,
        walls[j].geometry.start,
        walls[j].geometry.end,
      )
      if (hit) candidates.push({ point: hit, kind: 'intersection' })
    }
  }

  for (const wall of walls) {
    candidates.push({ point: wall.geometry.start, kind: 'endpoint' })
    candidates.push({ point: wall.geometry.end, kind: 'endpoint' })
    candidates.push({
      point: lerp2(wall.geometry.start, wall.geometry.end, 0.5),
      kind: 'midpoint',
    })
    const proj = projectOnSegment(world, wall.geometry.start, wall.geometry.end)
    if (proj.dist < threshold * 1.4) {
      candidates.push({
        point: proj.point,
        kind: 'wall-centerline',
        helper: { from: world, to: proj.point },
      })
    }
  }

  if (doc.settings.snapEnabled) {
    const g = doc.settings.gridSize || 1000
    candidates.push({
      point: { x: roundTo(world.x, g), y: roundTo(world.y, g) },
      kind: 'grid',
    })
  }

  if (opts?.origin && opts.orthogonal) {
    const dx = Math.abs(world.x - opts.origin.x)
    const dy = Math.abs(world.y - opts.origin.y)
    const ortho = dx > dy ? { x: world.x, y: opts.origin.y } : { x: opts.origin.x, y: world.y }
    candidates.push({
      point: ortho,
      kind: 'orthogonal',
      helper: { from: opts.origin, to: ortho, label: 'ortho' },
    })
  }

  if (opts?.origin) {
    for (const wall of walls) {
      const dir = { x: wall.geometry.end.x - wall.geometry.start.x, y: wall.geometry.end.y - wall.geometry.start.y }
      const len = Math.hypot(dir.x, dir.y) || 1
      const nx = -dir.y / len
      const ny = dir.x / len
      const t = (world.x - opts.origin.x) * nx + (world.y - opts.origin.y) * ny
      candidates.push({
        point: { x: opts.origin.x + nx * t, y: opts.origin.y + ny * t },
        kind: 'perpendicular',
      })
    }
  }

  candidates.push({ point: world, kind: 'free' })

  let best: SnapResult = candidates[candidates.length - 1]
  let bestScore = Infinity
  for (const candidate of candidates) {
    const d = dist2(world, candidate.point)
    if (candidate.kind !== 'free' && candidate.kind !== 'grid' && d > threshold) continue
    const rank = PRIORITY.indexOf(candidate.kind)
    const score = rank * 10000 + d
    if (score < bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

export function snapToWall(world: Vec2, doc: BIMDocument): { wall: BIMWall; offset: number; point: Vec2 } | null {
  const walls = doc.elements.filter((el): el is BIMWall => el.type === 'wall' && !el.hidden)
  let best: { wall: BIMWall; offset: number; point: Vec2; dist: number } | null = null
  for (const wall of walls) {
    const proj = projectOnSegment(world, wall.geometry.start, wall.geometry.end)
    if (!best || proj.dist < best.dist) {
      const length = dist2(wall.geometry.start, wall.geometry.end)
      best = { wall, offset: proj.t * length, point: proj.point, dist: proj.dist }
    }
  }
  if (!best || best.dist > 400) return null
  return best
}
