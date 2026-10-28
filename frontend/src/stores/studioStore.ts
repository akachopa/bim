import { create } from 'zustand'
import { createEmptyDocument } from '../features/studio/core/BIMDocument'
import { dist2, uid } from '../features/studio/core/math'
import type { BIMDocument, BIMElement, SaveStatus, SnapResult, ToolId, ValidationReport, Vec2, ViewMode } from '../features/studio/core/types'
import { createCommandEngine } from '../features/studio/commands/CommandEngine'
import {
  addBeamCommand,
  addColumnCommand,
  addDoorCommand,
  addSlabCommand,
  addWallCommand,
  addWindowCommand,
  createBeam,
  createColumn,
  createDoor,
  createSlab,
  createWall,
  createWindow,
  deleteElementsCommand,
  moveElementsCommand,
  updatePropertyCommand,
} from '../features/studio/commands/elementCommands'
import { snapPoint, snapToWall } from '../features/studio/snapping/SnapEngine'
import { labStepCompleted, validateDocument } from '../features/studio/validation/ValidationEngine'
import { loadDraft, saveDraft } from '../features/studio/persistence/localDraft'
import { ProjectApi, type Issue, type LabStep } from '../services/api'
import type { ValidationRule } from '../features/studio/core/types'

type Camera2D = { x: number; y: number; zoom: number }

type StudioState = {
  projectId: string | null
  projectTitle: string
  document: BIMDocument
  selectedIds: string[]
  isolatedIds: string[]
  tool: ToolId
  viewMode: ViewMode
  saveStatus: SaveStatus
  lastSavedAt: string | null
  camera2d: Camera2D
  pointerWorld: Vec2
  snap: SnapResult | null
  preview: Record<string, unknown> | null
  measure: { a: Vec2; b: Vec2 } | null
  validation: ValidationReport | null
  issues: Issue[]
  labSteps: LabStep[]
  labStepIndex: number
  rules: ValidationRule[]
  dirty: boolean
  error: string | null
  boxSelect: { a: Vec2; b: Vec2 } | null
  load: (projectId: string, fallback?: BIMDocument, meta?: { title?: string; labSteps?: LabStep[]; rules?: ValidationRule[] }) => Promise<void>
  setTool: (tool: ToolId) => void
  setViewMode: (mode: ViewMode) => void
  setActiveLevel: (id: string) => void
  select: (ids: string[], additive?: boolean) => void
  isolate: (ids: string[]) => void
  toggleHidden: (id: string) => void
  pointerDown: (world: Vec2, event: { shift: boolean; button: number }) => void
  pointerMove: (world: Vec2, event: { shift: boolean }) => void
  pointerUp: (world: Vec2) => void
  cancel: () => void
  undo: () => void
  redo: () => void
  deleteSelected: () => void
  updateSelected: (patch: Record<string, unknown>) => void
  addLevel: () => void
  addGridLine: (axis: 'X' | 'Y') => void
  rename: (kind: 'element' | 'level', id: string, name: string) => void
  pan: (dx: number, dy: number) => void
  zoomAt: (factor: number, screen?: Vec2) => void
  validate: () => Promise<void>
  save: (checkpoint?: boolean) => Promise<void>
  submit: () => Promise<void>
  refreshIssues: () => Promise<void>
  createIssue: (payload: { title: string; description: string; severity: string }) => Promise<void>
  exportIfc: () => Promise<string>
}

const engine = createCommandEngine()

let draft: { start?: Vec2; polygon?: Vec2[]; moving?: { ids: string[]; origin: Vec2 }; panning?: { last: Vec2 } } = {}
let saveTimer: number | undefined

function scheduleSave(get: () => StudioState) {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    void get().save(false)
  }, 4000)
}

export const useStudioStore = create<StudioState>((set, get) => ({
  projectId: null,
  projectTitle: 'Proyek',
  document: createEmptyDocument(),
  selectedIds: [],
  isolatedIds: [],
  tool: 'select',
  viewMode: 'split',
  saveStatus: 'saved',
  lastSavedAt: null,
  camera2d: { x: 6000, y: 4000, zoom: 0.045 },
  pointerWorld: { x: 0, y: 0 },
  snap: null,
  preview: null,
  measure: null,
  validation: null,
  issues: [],
  labSteps: [],
  labStepIndex: 0,
  rules: [],
  dirty: false,
  error: null,
  boxSelect: null,

  async load(projectId, fallback, meta) {
    engine.reset()
    draft = {}
    let document = fallback ?? createEmptyDocument()
    try {
      const local = await loadDraft(projectId)
      const remote = await ProjectApi.document(projectId)
      document = (local ?? (remote.data as BIMDocument) ?? document) as BIMDocument
    } catch {
      const local = await loadDraft(projectId)
      if (local) document = local
    }
    set({
      projectId,
      projectTitle: meta?.title ?? document.project.title,
      document,
      selectedIds: [],
      tool: (document.settings.activeTool as ToolId) || 'select',
      saveStatus: 'saved',
      dirty: false,
      labSteps: meta?.labSteps ?? [],
      labStepIndex: 0,
      rules: meta?.rules ?? [],
      error: null,
    })
    await get().refreshIssues()
  },

  setTool(tool) {
    draft = {}
    set({ tool, preview: null, measure: null, boxSelect: null })
  },
  setViewMode(viewMode) {
    set({ viewMode })
  },
  setActiveLevel(id) {
    const document = { ...get().document, settings: { ...get().document.settings, activeLevelId: id } }
    set({ document })
  },
  select(ids, additive) {
    set({
      selectedIds: additive ? Array.from(new Set([...get().selectedIds, ...ids])) : ids,
    })
  },
  isolate(ids) {
    set({ isolatedIds: ids })
  },
  toggleHidden(id) {
    const document = {
      ...get().document,
      elements: get().document.elements.map((el) => (el.id === id ? { ...el, hidden: !el.hidden } : el)),
    }
    set({ document, dirty: true, saveStatus: 'unsaved' })
  },

  pointerDown(world, event) {
    const state = get()
    const snap = snapPoint(world, state.document, {
      origin: draft.start,
      orthogonal: true,
      threshold: 180 / state.camera2d.zoom,
    })
    const p = snap.point
    set({ pointerWorld: p, snap })

    if (event.button === 1 || state.tool === 'pan') {
      draft.panning = { last: world }
      return
    }

    if (state.tool === 'select') {
      const hit = hitTest(state.document, p)
      if (hit) {
        const ids = event.shift ? [...state.selectedIds, hit] : [hit]
        set({ selectedIds: Array.from(new Set(ids)) })
        draft.moving = { ids: Array.from(new Set(ids)), origin: p }
      } else {
        if (!event.shift) set({ selectedIds: [], boxSelect: { a: p, b: p } })
        else set({ boxSelect: { a: p, b: p } })
      }
      return
    }

    if (state.tool === 'wall') {
      if (!draft.start) {
        draft.start = p
        set({ preview: { type: 'wall', start: p, end: p } })
      } else {
        commitWall(get, set, draft.start, p)
        draft.start = undefined
      }
      return
    }

    if (state.tool === 'column') {
      commit(get, set, addColumnCommand(createColumn({
        position: p,
        levelId: state.document.settings.activeLevelId,
        elevation: activeElevation(state.document),
      })))
      return
    }

    if (state.tool === 'beam') {
      if (!draft.start) {
        draft.start = p
        set({ preview: { type: 'beam', start: p, end: p } })
      } else {
        const z = activeElevation(state.document) + 2800
        commit(get, set, addBeamCommand(createBeam({
          start: { x: draft.start.x, y: z, z: draft.start.y },
          end: { x: p.x, y: z, z: p.y },
          levelId: state.document.settings.activeLevelId,
        })))
        draft.start = undefined
        set({ preview: null })
      }
      return
    }

    if (state.tool === 'slab') {
      const polygon = [...(draft.polygon ?? []), p]
      if (polygon.length >= 3 && dist2(polygon[0], p) < 200) {
        commit(get, set, addSlabCommand(createSlab({
          polygon: polygon.slice(0, -1),
          levelId: state.document.settings.activeLevelId,
          elevation: activeElevation(state.document),
        })))
        draft.polygon = undefined
        set({ preview: null })
      } else {
        draft.polygon = polygon
        set({ preview: { type: 'slab', polygon } })
      }
      return
    }

    if (state.tool === 'door' || state.tool === 'window') {
      const host = snapToWall(p, state.document)
      if (!host) {
        set({ error: 'Door/window harus ditempatkan pada wall.' })
        return
      }
      const cmd = state.tool === 'door'
        ? addDoorCommand(createDoor({ hostWallId: host.wall.id, offset: host.offset, levelId: host.wall.levelId }))
        : addWindowCommand(createWindow({ hostWallId: host.wall.id, offset: host.offset, levelId: host.wall.levelId }))
      commit(get, set, cmd)
      return
    }

    if (state.tool === 'grid') {
      get().addGridLine(Math.abs(p.x) > Math.abs(p.y) ? 'X' : 'Y')
      return
    }

    if (state.tool === 'measure') {
      if (!draft.start) {
        draft.start = p
        set({ measure: { a: p, b: p } })
      } else {
        set({ measure: { a: draft.start, b: p } })
        draft.start = undefined
      }
      return
    }

    if (state.tool === 'delete') {
      const hit = hitTest(state.document, p)
      if (hit) commit(get, set, deleteElementsCommand([hit]))
    }
  },

  pointerMove(world) {
    const state = get()
    if (draft.panning) {
      const dx = (world.x - draft.panning.last.x)
      const dy = (world.y - draft.panning.last.y)
      set({ camera2d: { ...state.camera2d, x: state.camera2d.x - dx, y: state.camera2d.y - dy } })
      return
    }
    const snap = snapPoint(world, state.document, {
      origin: draft.start,
      orthogonal: state.tool === 'wall' || state.tool === 'beam',
      threshold: 180 / state.camera2d.zoom,
    })
    const p = snap.point
    set({ pointerWorld: p, snap })
    if (state.tool === 'wall' && draft.start) set({ preview: { type: 'wall', start: draft.start, end: p } })
    if (state.tool === 'beam' && draft.start) set({ preview: { type: 'beam', start: draft.start, end: p } })
    if (state.tool === 'slab' && draft.polygon) set({ preview: { type: 'slab', polygon: [...draft.polygon, p] } })
    if (state.tool === 'measure' && draft.start) set({ measure: { a: draft.start, b: p } })
    if (state.boxSelect) set({ boxSelect: { ...state.boxSelect, b: p } })
    if (draft.moving) {
      const delta = { x: p.x - draft.moving.origin.x, y: p.y - draft.moving.origin.y }
      if (Math.hypot(delta.x, delta.y) > 1) {
        draft.moving.origin = p
        set({ document: moveElementsCommand(draft.moving.ids, delta).execute(get().document), dirty: true, saveStatus: 'unsaved' })
      }
    }
  },

  pointerUp() {
    if (get().boxSelect) {
      const box = get().boxSelect
      if (box) {
        const ids = elementsInBox(get().document, box.a, box.b)
        set({ selectedIds: ids, boxSelect: null })
      }
    }
    draft.moving = undefined
    draft.panning = undefined
    if (get().dirty) scheduleSave(get)
  },

  cancel() {
    draft = {}
    set({ preview: null, measure: null, boxSelect: null, tool: 'select', error: null })
  },
  undo() {
    set({ document: engine.undo(get().document), dirty: true, saveStatus: 'unsaved' })
    scheduleSave(get)
  },
  redo() {
    set({ document: engine.redo(get().document), dirty: true, saveStatus: 'unsaved' })
    scheduleSave(get)
  },
  deleteSelected() {
    if (!get().selectedIds.length) return
    commit(get, set, deleteElementsCommand(get().selectedIds))
    set({ selectedIds: [] })
  },
  updateSelected(patch) {
    const id = get().selectedIds[0]
    if (!id) return
    commit(get, set, updatePropertyCommand(id, patch))
  },
  addLevel() {
    const document = get().document
    const order = document.levels.length
    const level = { id: uid(), name: `Level ${order + 1}`, elevation: order * 3000, order }
    set({
      document: {
        ...document,
        levels: [...document.levels, level],
        settings: { ...document.settings, activeLevelId: level.id },
      },
      dirty: true,
      saveStatus: 'unsaved',
    })
    scheduleSave(get)
  },
  addGridLine(axis) {
    const document = get().document
    const same = document.grids.filter((g) => g.axis === axis)
    const position = (same.length ? Math.max(...same.map((g) => g.position)) : -4000) + 4000
    const label = axis === 'Y' ? String.fromCharCode(65 + same.length) : String(same.length + 1)
    set({
      document: {
        ...document,
        grids: [...document.grids, { id: uid(), axis, label, position }],
      },
      dirty: true,
      saveStatus: 'unsaved',
    })
    scheduleSave(get)
  },
  rename(kind, id, name) {
    const document = get().document
    if (kind === 'level') {
      set({ document: { ...document, levels: document.levels.map((l) => (l.id === id ? { ...l, name } : l)) }, dirty: true, saveStatus: 'unsaved' })
    } else {
      get().updateSelected({ name })
    }
  },
  pan(dx, dy) {
    const cam = get().camera2d
    set({ camera2d: { ...cam, x: cam.x + dx / cam.zoom, y: cam.y + dy / cam.zoom } })
  },
  zoomAt(factor) {
    const cam = get().camera2d
    set({ camera2d: { ...cam, zoom: Math.min(0.4, Math.max(0.008, cam.zoom * factor)) } })
  },
  async validate() {
    const local = validateDocument(get().document, get().rules)
    set({ validation: local })
    const id = get().projectId
    if (!id) return
    try {
      const remote = await ProjectApi.validate(id, get().document)
      set({
        validation: {
          valid: remote.valid,
          score: remote.score,
          errors: remote.errors,
          warnings: remote.warnings,
          rules: remote.rules.map((r) => ({ ...r, type: r.id, weight: r.weight })),
        },
      })
    } catch {
      /* local report already set */
    }
  },
  async save(checkpoint = false) {
    const { projectId, document, dirty } = get()
    if (!projectId) return
    if (!dirty && !checkpoint) {
      set({ saveStatus: 'saved' })
      return
    }
    set({ saveStatus: 'saving' })
    try {
      await saveDraft(projectId, document)
      await ProjectApi.saveDocument(projectId, document, checkpoint, checkpoint ? 'Checkpoint' : undefined)
      set({ saveStatus: 'saved', dirty: false, lastSavedAt: new Date().toISOString() })
    } catch {
      set({ saveStatus: navigator.onLine ? 'failed' : 'offline' })
    }
  },
  async submit() {
    const id = get().projectId
    if (!id) return
    await get().save(true)
    await ProjectApi.submit(id)
    set({ saveStatus: 'saved' })
  },
  async refreshIssues() {
    const id = get().projectId
    if (!id) return
    try {
      const res = await ProjectApi.issues(id)
      set({ issues: res.data })
    } catch {
      set({ issues: [] })
    }
  },
  async createIssue(payload) {
    const id = get().projectId
    if (!id) return
    const selected = get().selectedIds[0]
    await ProjectApi.createIssue(id, {
      ...payload,
      element_id: selected,
      camera_state: { position: [0, 8, 12], target: [0, 0, 0], zoom: get().camera2d.zoom },
    })
    await get().refreshIssues()
  },
  async exportIfc() {
    const id = get().projectId
    if (!id) return 'Tidak ada proyek'
    const res = await ProjectApi.exportIfc(id)
    return res.data.status
  },
}))

function activeElevation(doc: BIMDocument) {
  return doc.levels.find((l) => l.id === doc.settings.activeLevelId)?.elevation ?? 0
}

function commit(
  get: () => StudioState,
  set: (partial: Partial<StudioState>) => void,
  command: Parameters<typeof engine.execute>[1],
  markDirty = true,
) {
  const document = engine.execute(get().document, command)
  const labSteps = get().labSteps
  let labStepIndex = get().labStepIndex
  if (labSteps[labStepIndex] && labStepCompleted(labSteps[labStepIndex].required_action, document)) {
    labStepIndex = Math.min(labSteps.length - 1, labStepIndex + 1)
  }
  set({ document, dirty: markDirty || get().dirty, saveStatus: 'unsaved', preview: null, error: null, labStepIndex })
  if (markDirty) scheduleSave(get)
}

function commitWall(
  get: () => StudioState,
  set: (partial: Partial<StudioState>) => void,
  start: Vec2,
  end: Vec2,
) {
  if (dist2(start, end) < 100) return
  const doc = get().document
  commit(get, set, addWallCommand(createWall({
    start,
    end,
    levelId: doc.settings.activeLevelId,
  })))
}

function hitTest(doc: BIMDocument, p: Vec2): string | null {
  for (let i = doc.elements.length - 1; i >= 0; i--) {
    const el = doc.elements[i]
    if (el.hidden) continue
    if (el.type === 'wall') {
      const d = pointToWall(p, el.geometry.start, el.geometry.end)
      if (d < el.geometry.thickness / 2 + 80) return el.id
    }
    if (el.type === 'column') {
      if (Math.abs(el.transform.position.x - p.x) < el.geometry.width / 2 + 40 && Math.abs(el.transform.position.z - p.y) < el.geometry.depth / 2 + 40) {
        return el.id
      }
    }
  }
  return null
}

function pointToWall(p: Vec2, a: Vec2, b: Vec2) {
  const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 || 1
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2))
  const x = a.x + t * (b.x - a.x)
  const y = a.y + t * (b.y - a.y)
  return Math.hypot(p.x - x, p.y - y)
}

function elementsInBox(doc: BIMDocument, a: Vec2, b: Vec2): string[] {
  const minx = Math.min(a.x, b.x)
  const maxx = Math.max(a.x, b.x)
  const miny = Math.min(a.y, b.y)
  const maxy = Math.max(a.y, b.y)
  return doc.elements.filter((el) => {
    const c = elementCenter(el)
    return c.x >= minx && c.x <= maxx && c.y >= miny && c.y <= maxy
  }).map((el) => el.id)
}

function elementCenter(el: BIMElement): Vec2 {
  if (el.type === 'wall') return { x: (el.geometry.start.x + el.geometry.end.x) / 2, y: (el.geometry.start.y + el.geometry.end.y) / 2 }
  if (el.type === 'column') return { x: el.transform.position.x, y: el.transform.position.z }
  if (el.type === 'beam') return { x: (el.geometry.start.x + el.geometry.end.x) / 2, y: (el.geometry.start.z + el.geometry.end.z) / 2 }
  if (el.type === 'slab' && el.geometry.polygon[0]) return el.geometry.polygon[0]
  return { x: 0, y: 0 }
}

