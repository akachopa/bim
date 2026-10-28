import { defaultMetadata, defaultTransform, hostedOpenings } from '../core/BIMDocument'
import { nowIso, uid } from '../core/math'
import type {
  BIMBeam,
  BIMColumn,
  BIMDocument,
  BIMDoor,
  BIMElement,
  BIMSlab,
  BIMWall,
  BIMWindow,
  Vec2,
  Vec3,
} from '../core/types'
import type { BIMCommand } from './CommandEngine'

function replaceElements(doc: BIMDocument, elements: BIMElement[]): BIMDocument {
  return { ...doc, elements }
}

export function addWallCommand(wall: BIMWall): BIMCommand {
  return {
    name: 'AddWall',
    execute: (doc) => replaceElements(doc, [...doc.elements, wall]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== wall.id)),
  }
}

export function addColumnCommand(column: BIMColumn): BIMCommand {
  return {
    name: 'AddColumn',
    execute: (doc) => replaceElements(doc, [...doc.elements, column]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== column.id)),
  }
}

export function addBeamCommand(beam: BIMBeam): BIMCommand {
  return {
    name: 'AddBeam',
    execute: (doc) => replaceElements(doc, [...doc.elements, beam]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== beam.id)),
  }
}

export function addSlabCommand(slab: BIMSlab): BIMCommand {
  return {
    name: 'AddSlab',
    execute: (doc) => replaceElements(doc, [...doc.elements, slab]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== slab.id)),
  }
}

export function addDoorCommand(door: BIMDoor): BIMCommand {
  return {
    name: 'AddDoor',
    execute: (doc) => replaceElements(doc, [...doc.elements, door]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== door.id)),
  }
}

export function addWindowCommand(windowEl: BIMWindow): BIMCommand {
  return {
    name: 'AddWindow',
    execute: (doc) => replaceElements(doc, [...doc.elements, windowEl]),
    undo: (doc) => replaceElements(doc, doc.elements.filter((el) => el.id !== windowEl.id)),
  }
}

export function deleteElementsCommand(ids: string[]): BIMCommand {
  let removed: BIMElement[] = []
  return {
    name: 'Delete',
    execute: (doc) => {
      const extra = ids.flatMap((id) => hostedOpenings(doc, id).map((el) => el.id))
      const all = new Set([...ids, ...extra])
      removed = doc.elements.filter((el) => all.has(el.id))
      return replaceElements(doc, doc.elements.filter((el) => !all.has(el.id)))
    },
    undo: (doc) => replaceElements(doc, [...doc.elements, ...removed]),
  }
}

export function updatePropertyCommand(id: string, patch: Partial<BIMElement> & Record<string, unknown>): BIMCommand {
  let previous: BIMElement | undefined
  return {
    name: 'UpdateProperty',
    execute: (doc) =>
      replaceElements(
        doc,
        doc.elements.map((el) => {
          if (el.id !== id) return el
          previous = el
          return {
            ...el,
            ...patch,
            geometry: { ...(el as BIMWall).geometry, ...((patch.geometry as object) ?? {}) },
            properties: { ...el.properties, ...((patch.properties as object) ?? {}) },
            metadata: { ...el.metadata, updatedAt: nowIso() },
          } as BIMElement
        }),
      ),
    undo: (doc) =>
      replaceElements(
        doc,
        doc.elements.map((el) => (el.id === id && previous ? previous : el)),
      ),
  }
}

export function moveElementsCommand(ids: string[], delta: Vec2): BIMCommand {
  return {
    name: 'Move',
    execute: (doc) => applyMove(doc, ids, delta),
    undo: (doc) => applyMove(doc, ids, { x: -delta.x, y: -delta.y }),
  }
}

function applyMove(doc: BIMDocument, ids: string[], delta: Vec2): BIMDocument {
  const set = new Set(ids)
  return replaceElements(
    doc,
    doc.elements.map((el) => {
      if (!set.has(el.id) && !(('hostWallId' in el && set.has(el.hostWallId)))) return el
      if (el.type === 'wall') {
        return {
          ...el,
          geometry: {
            ...el.geometry,
            start: { x: el.geometry.start.x + delta.x, y: el.geometry.start.y + delta.y },
            end: { x: el.geometry.end.x + delta.x, y: el.geometry.end.y + delta.y },
          },
        }
      }
      if (el.type === 'column' || el.type === 'slab') {
        const next = {
          ...el,
          transform: {
            ...el.transform,
            position: {
              ...el.transform.position,
              x: el.transform.position.x + delta.x,
              z: el.transform.position.z + delta.y,
            },
          },
        }
        if (el.type === 'slab') {
          next.geometry = {
            ...el.geometry,
            polygon: el.geometry.polygon.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
          }
        }
        return next
      }
      if (el.type === 'beam') {
        return {
          ...el,
          geometry: {
            ...el.geometry,
            start: { ...el.geometry.start, x: el.geometry.start.x + delta.x, z: el.geometry.start.z + delta.y },
            end: { ...el.geometry.end, x: el.geometry.end.x + delta.x, z: el.geometry.end.z + delta.y },
          },
        }
      }
      return el
    }),
  )
}

export function createWall(params: {
  start: Vec2
  end: Vec2
  height?: number
  thickness?: number
  levelId?: string
  materialId?: string
  userId?: string
}): BIMWall {
  return {
    id: uid(),
    type: 'wall',
    ifcClass: 'IfcWall',
    name: 'Wall',
    levelId: params.levelId,
    materialId: params.materialId ?? 'mat-concrete',
    transform: defaultTransform(),
    geometry: {
      start: params.start,
      end: params.end,
      height: params.height ?? 3000,
      thickness: params.thickness ?? 150,
      baseOffset: 0,
    },
    properties: { wallTypeId: 'generic', materialId: params.materialId ?? 'mat-concrete' },
    metadata: defaultMetadata(params.userId),
  }
}

export function createColumn(params: {
  position: Vec2
  width?: number
  depth?: number
  height?: number
  levelId?: string
  elevation?: number
  materialId?: string
}): BIMColumn {
  return {
    id: uid(),
    type: 'column',
    ifcClass: 'IfcColumn',
    name: 'Column',
    levelId: params.levelId,
    materialId: params.materialId ?? 'mat-concrete',
    transform: {
      ...defaultTransform(),
      position: { x: params.position.x, y: params.elevation ?? 0, z: params.position.y },
    },
    geometry: {
      width: params.width ?? 400,
      depth: params.depth ?? 400,
      height: params.height ?? 3000,
      baseOffset: 0,
    },
    properties: {},
    metadata: defaultMetadata(),
  }
}

export function createBeam(params: {
  start: Vec3
  end: Vec3
  width?: number
  height?: number
  levelId?: string
}): BIMBeam {
  return {
    id: uid(),
    type: 'beam',
    ifcClass: 'IfcBeam',
    name: 'Beam',
    levelId: params.levelId,
    materialId: 'mat-concrete',
    transform: defaultTransform(),
    geometry: {
      start: params.start,
      end: params.end,
      width: params.width ?? 250,
      height: params.height ?? 400,
    },
    properties: {},
    metadata: defaultMetadata(),
  }
}

export function createSlab(params: { polygon: Vec2[]; thickness?: number; levelId?: string; elevation?: number }): BIMSlab {
  return {
    id: uid(),
    type: 'slab',
    ifcClass: 'IfcSlab',
    name: 'Slab',
    levelId: params.levelId,
    materialId: 'mat-concrete',
    transform: {
      ...defaultTransform(),
      position: { x: 0, y: params.elevation ?? 0, z: 0 },
    },
    geometry: {
      polygon: params.polygon,
      thickness: params.thickness ?? 200,
      baseOffset: 0,
    },
    properties: {},
    metadata: defaultMetadata(),
  }
}

export function createDoor(params: { hostWallId: string; offset: number; levelId?: string }): BIMDoor {
  return {
    id: uid(),
    type: 'door',
    ifcClass: 'IfcDoor',
    name: 'Door',
    hostWallId: params.hostWallId,
    levelId: params.levelId,
    materialId: 'mat-wood',
    transform: defaultTransform(),
    geometry: { offset: params.offset, width: 900, height: 2100, sillHeight: 0 },
    properties: {},
    metadata: defaultMetadata(),
  }
}

export function createWindow(params: { hostWallId: string; offset: number; levelId?: string }): BIMWindow {
  return {
    id: uid(),
    type: 'window',
    ifcClass: 'IfcWindow',
    name: 'Window',
    hostWallId: params.hostWallId,
    levelId: params.levelId,
    materialId: 'mat-glass',
    transform: defaultTransform(),
    geometry: { offset: params.offset, width: 1200, height: 1400, sillHeight: 900 },
    properties: {},
    metadata: defaultMetadata(),
  }
}
