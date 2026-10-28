export type Vec2 = { x: number; y: number }
export type Vec3 = { x: number; y: number; z: number }

export type ElementType = 'grid' | 'wall' | 'column' | 'beam' | 'slab' | 'door' | 'window'

export type Transform = {
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export type BIMMaterial = {
  id: string
  name: string
  code: string
  color: string
  opacity: number
}

export type BIMLevel = {
  id: string
  projectId?: string
  name: string
  elevation: number
  order: number
}

export type BIMGrid = {
  id: string
  projectId?: string
  axis: 'X' | 'Y'
  label: string
  position: number
}

export type BIMElementBase = {
  id: string
  projectId?: string
  levelId?: string
  type: ElementType
  name: string
  code?: string
  ifcClass?: string
  transform: Transform
  materialId?: string
  properties: Record<string, unknown>
  metadata: {
    createdBy: string
    createdAt: string
    updatedAt: string
  }
  hidden?: boolean
}

export type BIMWall = BIMElementBase & {
  type: 'wall'
  ifcClass: 'IfcWall'
  geometry: {
    start: Vec2
    end: Vec2
    height: number
    thickness: number
    baseOffset: number
  }
}

export type BIMColumn = BIMElementBase & {
  type: 'column'
  ifcClass: 'IfcColumn'
  geometry: {
    width: number
    depth: number
    height: number
    baseOffset: number
  }
}

export type BIMBeam = BIMElementBase & {
  type: 'beam'
  ifcClass: 'IfcBeam'
  geometry: {
    start: Vec3
    end: Vec3
    width: number
    height: number
  }
}

export type BIMSlab = BIMElementBase & {
  type: 'slab'
  ifcClass: 'IfcSlab'
  geometry: {
    polygon: Vec2[]
    thickness: number
    baseOffset: number
  }
}

export type BIMDoor = BIMElementBase & {
  type: 'door'
  ifcClass: 'IfcDoor'
  hostWallId: string
  geometry: {
    offset: number
    width: number
    height: number
    sillHeight: number
  }
}

export type BIMWindow = BIMElementBase & {
  type: 'window'
  ifcClass: 'IfcWindow'
  hostWallId: string
  geometry: {
    offset: number
    width: number
    height: number
    sillHeight: number
  }
}

export type BIMElement = BIMWall | BIMColumn | BIMBeam | BIMSlab | BIMDoor | BIMWindow

export type BIMDocument = {
  schemaVersion: string
  project: {
    id: string
    title: string
    code: string
    unit: 'millimeter'
  }
  levels: BIMLevel[]
  grids: BIMGrid[]
  elements: BIMElement[]
  materials: BIMMaterial[]
  settings: {
    gridSize: number
    snapEnabled: boolean
    units: 'mm'
    activeLevelId?: string
    activeTool?: string
  }
}

export type ToolId =
  | 'select'
  | 'pan'
  | 'grid'
  | 'wall'
  | 'column'
  | 'beam'
  | 'slab'
  | 'door'
  | 'window'
  | 'measure'
  | 'delete'

export type ViewMode = '2d' | '3d' | 'split'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'failed'

export type SnapKind =
  | 'intersection'
  | 'endpoint'
  | 'midpoint'
  | 'grid'
  | 'orthogonal'
  | 'perpendicular'
  | 'wall-centerline'
  | 'free'

export type SnapResult = {
  point: Vec2
  kind: SnapKind
  helper?: { from: Vec2; to: Vec2; label?: string }
}

export type ValidationIssue = {
  code: string
  elementId?: string
  message: string
}

export type ValidationReport = {
  valid: boolean
  score: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  rules: Array<{
    id: string
    name: string
    type: string
    weight: number
    passed: boolean
    message: string
  }>
}

export type ValidationRule = {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  weight: number
}

export const IDENTITY_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
}

export const DEFAULT_MATERIALS: BIMMaterial[] = [
  { id: 'mat-concrete', name: 'Concrete', code: 'CONC', color: '#9AA0A6', opacity: 1 },
  { id: 'mat-brick', name: 'Brick', code: 'BRK', color: '#B85C38', opacity: 1 },
  { id: 'mat-glass', name: 'Glass', code: 'GLS', color: '#8EC6E6', opacity: 0.35 },
  { id: 'mat-steel', name: 'Steel', code: 'STL', color: '#5C6770', opacity: 1 },
  { id: 'mat-wood', name: 'Wood', code: 'WOD', color: '#A67C52', opacity: 1 },
  { id: 'mat-gypsum', name: 'Gypsum', code: 'GYP', color: '#E8DFD2', opacity: 1 },
]

export const MM_TO_BABYLON = 0.001
