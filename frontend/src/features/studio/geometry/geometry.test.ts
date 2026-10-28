import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '../core/BIMDocument'
import { createCommandEngine } from '../commands/CommandEngine'
import { addWallCommand, createWall, deleteElementsCommand } from '../commands/elementCommands'
import { deserializeDocument, serializeDocument, documentsEqual } from '../core/BIMDocument'
import { generateWallGeometry } from './WallGeometry'
import { generateColumnGeometry } from './ColumnGeometry'
import { generateSlabGeometry } from './SlabGeometry'
import { snapPoint } from '../snapping/SnapEngine'
import { validateDocument } from '../validation/ValidationEngine'
import { createColumn, createSlab } from '../commands/elementCommands'

describe('wall geometry', () => {
  it('computes length, bbox, and volume for a 5000x150x3000 wall', () => {
    const wall = createWall({ start: { x: 0, y: 0 }, end: { x: 5000, y: 0 }, thickness: 150, height: 3000 })
    const geom = generateWallGeometry(wall)
    expect(geom.length).toBe(5000)
    expect(geom.height).toBe(3000)
    expect(geom.boundingBox.min.x).toBe(0)
    expect(geom.boundingBox.max.x).toBe(5000)
    expect(geom.volume).toBe(5000 * 150 * 3000)
  })
})

describe('column and slab', () => {
  it('builds column volume', () => {
    const col = createColumn({ position: { x: 1000, y: 1000 }, width: 400, depth: 400, height: 3000 })
    expect(generateColumnGeometry(col).volume).toBe(400 * 400 * 3000)
  })

  it('requires closed polygon for slab', () => {
    const open = createSlab({ polygon: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] })
    expect(generateSlabGeometry(open).closed).toBe(false)
    const closed = createSlab({
      polygon: [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 4000 },
        { x: 0, y: 4000 },
      ],
    })
    expect(generateSlabGeometry(closed).closed).toBe(true)
    expect(generateSlabGeometry(closed).area).toBe(16_000_000)
  })
})

describe('commands undo/redo', () => {
  it('adds and restores walls', () => {
    const engine = createCommandEngine()
    let doc = createEmptyDocument()
    const wall = createWall({ start: { x: 0, y: 0 }, end: { x: 5000, y: 0 }, levelId: doc.levels[0].id })
    doc = engine.execute(doc, addWallCommand(wall))
    expect(doc.elements).toHaveLength(1)
    doc = engine.undo(doc)
    expect(doc.elements).toHaveLength(0)
    doc = engine.redo(doc)
    expect(doc.elements).toHaveLength(1)
    doc = engine.execute(doc, deleteElementsCommand([wall.id]))
    expect(doc.elements).toHaveLength(0)
  })
})

describe('serialization', () => {
  it('round-trips a document', () => {
    let doc = createEmptyDocument()
    const wall = createWall({ start: { x: 0, y: 0 }, end: { x: 5000, y: 0 }, levelId: doc.levels[0].id })
    doc = { ...doc, elements: [wall] }
    const copy = deserializeDocument(serializeDocument(doc))
    expect(documentsEqual(doc, copy)).toBe(true)
  })
})

describe('snap', () => {
  it('snaps to grid', () => {
    const doc = createEmptyDocument()
    const result = snapPoint({ x: 980, y: 40 }, doc)
    expect(result.kind).toBe('grid')
    expect(result.point.x).toBe(1000)
    expect(result.point.y).toBe(0)
  })
})

describe('validation', () => {
  it('flags missing host', () => {
    const doc = createEmptyDocument()
    doc.elements.push({
      ...createWall({ start: { x: 0, y: 0 }, end: { x: 4000, y: 0 }, levelId: doc.levels[0].id }),
    })
    const report = validateDocument(doc, [
      { id: 'host', name: 'Host', type: 'HOST_REQUIRED', config: {}, weight: 10 },
    ])
    expect(report.valid).toBe(true)
  })
})
