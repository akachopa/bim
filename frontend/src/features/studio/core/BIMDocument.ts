import { DEFAULT_MATERIALS, IDENTITY_TRANSFORM, type BIMDocument, type BIMElement, type BIMLevel } from './types'
import { nowIso, uid } from './math'

export function createEmptyDocument(title = 'Proyek Baru', code = 'PRJ'): BIMDocument {
  const level: BIMLevel = {
    id: uid(),
    name: 'Level 1',
    elevation: 0,
    order: 0,
  }
  return {
    schemaVersion: '1.0.0',
    project: { id: uid(), title, code, unit: 'millimeter' },
    levels: [level],
    grids: [],
    elements: [],
    materials: DEFAULT_MATERIALS.map((m) => ({ ...m })),
    settings: {
      gridSize: 1000,
      snapEnabled: true,
      units: 'mm',
      activeLevelId: level.id,
    },
  }
}

export function defaultMetadata(userId = 'local'): BIMElement['metadata'] {
  const t = nowIso()
  return { createdBy: userId, createdAt: t, updatedAt: t }
}

export function defaultTransform() {
  return structuredClone(IDENTITY_TRANSFORM)
}

export function elementsOnLevel(doc: BIMDocument, levelId?: string): BIMElement[] {
  if (!levelId) return doc.elements
  return doc.elements.filter((el) => el.levelId === levelId)
}

export function hostedOpenings(doc: BIMDocument, wallId: string): BIMElement[] {
  return doc.elements.filter(
    (el) => (el.type === 'door' || el.type === 'window') && el.hostWallId === wallId,
  )
}

export function serializeDocument(doc: BIMDocument): string {
  return JSON.stringify(doc)
}

export function deserializeDocument(raw: string): BIMDocument {
  return JSON.parse(raw) as BIMDocument
}

export function documentsEqual(a: BIMDocument, b: BIMDocument): boolean {
  return serializeDocument(canonical(a)) === serializeDocument(canonical(b))
}

function canonical(doc: BIMDocument): BIMDocument {
  return {
    ...doc,
    levels: [...doc.levels].sort((x, y) => x.id.localeCompare(y.id)),
    grids: [...doc.grids].sort((x, y) => x.id.localeCompare(y.id)),
    elements: [...doc.elements].sort((x, y) => x.id.localeCompare(y.id)),
    materials: [...doc.materials].sort((x, y) => x.id.localeCompare(y.id)),
  }
}
