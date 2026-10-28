import type { Vec2, Vec3 } from './types'

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z }
}

export function add2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function mul2(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s }
}

export function len2(a: Vec2): number {
  return Math.hypot(a.x, a.y)
}

export function dist2(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function norm2(a: Vec2): Vec2 {
  const l = len2(a) || 1
  return { x: a.x / l, y: a.y / l }
}

export function perp2(a: Vec2): Vec2 {
  return { x: -a.y, y: a.x }
}

export function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

export function cloneJson<T>(value: T): T {
  return structuredClone(value)
}

export function uid(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function almostEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) < eps
}

export function segmentIntersection(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): Vec2 | null {
  const dax = a2.x - a1.x
  const day = a2.y - a1.y
  const dbx = b2.x - b1.x
  const dby = b2.y - b1.y
  const denom = dax * dby - day * dbx
  if (Math.abs(denom) < 1e-8) return null
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom
  const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / denom
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null
  return { x: a1.x + t * dax, y: a1.y + t * day }
}

export function projectOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; t: number; dist: number } {
  const ab = sub2(b, a)
  const length = len2(ab) || 1
  const t = clamp(dot2(sub2(p, a), ab) / (length * length), 0, 1)
  const point = add2(a, mul2(ab, t))
  return { point, t, dist: dist2(p, point) }
}

export function pointInPolygon(p: Vec2, polygon: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function formatMm(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)} m`
  return `${Math.round(value)} mm`
}
