import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BoxSelect,
  Columns2,
  Cuboid,
  DoorOpen,
  Grid3x3,
  Hand,
  LayoutGrid,
  Minus,
  MousePointer2,
  Redo2,
  Ruler,
  Save,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Canvas2D } from './renderer/Canvas2D'
import { BabylonViewport } from './renderer/BabylonViewport'
import { useStudioStore } from '../../stores/studioStore'
import { formatMm, dist2 } from './core/math'
import { wallLength } from './geometry/WallGeometry'
import type { BIMElement, ToolId } from './core/types'
import { ProjectApi, TrainingApi, type Lab, type Challenge } from '../../services/api'
import { labStepCompleted } from './validation/ValidationEngine'

const TOOLS: Array<{ id: ToolId; label: string; icon: typeof MousePointer2; shortcut: string }> = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
  { id: 'pan', label: 'Pan', icon: Hand, shortcut: 'H' },
  { id: 'grid', label: 'Grid', icon: Grid3x3, shortcut: 'G' },
  { id: 'wall', label: 'Wall', icon: Square, shortcut: 'W' },
  { id: 'column', label: 'Column', icon: Cuboid, shortcut: 'C' },
  { id: 'beam', label: 'Beam', icon: Minus, shortcut: 'B' },
  { id: 'slab', label: 'Slab', icon: LayoutGrid, shortcut: 'S' },
  { id: 'door', label: 'Door', icon: DoorOpen, shortcut: 'D' },
  { id: 'window', label: 'Window', icon: Columns2, shortcut: 'N' },
  { id: 'measure', label: 'Measure', icon: Ruler, shortcut: 'M' },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Del' },
]

export function StudioApp() {
  const { projectId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const load = useStudioStore((s) => s.load)
  const document = useStudioStore((s) => s.document)
  const [leftTab, setLeftTab] = useState<'tree' | 'levels' | 'layers' | 'library'>('tree')
  const [rightTab, setRightTab] = useState<'properties' | 'geometry' | 'material' | 'bim' | 'issues'>('properties')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    void (async () => {
      const project = (await ProjectApi.get(projectId)).data
      let lab: Lab | undefined = project.lab
      const labId = params.get('lab')
      const challengeId = params.get('challenge')
      if (labId) lab = (await TrainingApi.lab(labId)).data
      let challenge: Challenge | undefined = project.challenge
      if (challengeId) challenge = (await TrainingApi.challenge(challengeId)).data
      await load(projectId, project.document as never, {
        title: project.title,
        labSteps: lab?.steps,
        rules: challenge?.rules.map((r) => ({
          id: r.rule_id,
          name: r.name,
          type: r.type,
          config: r.config,
          weight: r.weight,
        })),
      })
    })()
  }, [projectId, load, params])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const store = useStudioStore.getState()
      if (event.key === 'Escape') store.cancel()
      if (event.key === 'Delete' || event.key === 'Backspace') store.deleteSelected()
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        store.undo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        store.redo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void store.save(true)
      }
      const map: Record<string, ToolId> = { v: 'select', w: 'wall', c: 'column', b: 'beam', s: 'slab', d: 'door', n: 'window', m: 'measure' }
      if (!event.ctrlKey && !event.metaKey && map[event.key.toLowerCase()] && !(event.target instanceof HTMLInputElement)) {
        store.setTool(map[event.key.toLowerCase()])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectedIds = useStudioStore((s) => s.selectedIds)
  const selected = document.elements.find((el) => el.id === selectedIds[0])

  return (
    <div className="flex h-screen flex-col bg-charcoal text-warm">
      <TopBar
        onBack={() => navigate('/projects')}
        busy={busy}
        setBusy={setBusy}
        setMessage={setMessage}
      />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#1c2124]">
          <div className="flex text-[11px] uppercase tracking-wide">
            {(['tree', 'levels', 'layers', 'library'] as const).map((tab) => (
              <button key={tab} onClick={() => setLeftTab(tab)} className={`flex-1 px-2 py-2 ${leftTab === tab ? 'bg-bronze/20 text-gold' : 'text-sand/70'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 text-sm">
            {leftTab === 'tree' && <ModelTree />}
            {leftTab === 'levels' && <LevelsPanel />}
            {leftTab === 'layers' && <LayersPanel />}
            {leftTab === 'library' && <LibraryPanel />}
          </div>
        </aside>
        <main className="relative min-w-0 flex-1 bg-ink">
          <Viewport />
          <InstructionDock />
        </main>
        <aside className="flex w-72 shrink-0 flex-col border-l border-white/10 bg-[#1c2124]">
          <div className="flex flex-wrap text-[11px] uppercase tracking-wide">
            {(['properties', 'geometry', 'material', 'bim', 'issues'] as const).map((tab) => (
              <button key={tab} onClick={() => setRightTab(tab)} className={`px-2 py-2 ${rightTab === tab ? 'bg-bronze/20 text-gold' : 'text-sand/70'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 text-sm">
            {rightTab === 'issues' ? <IssuesPanel /> : <PropertiesPanel tab={rightTab} selected={selected} />}
          </div>
        </aside>
      </div>
      <StatusBar />
      {message && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded bg-olive px-3 py-2 text-sm text-warm">{message}</div>
      )}
    </div>
  )
}

function TopBar({
  onBack,
  setBusy,
  setMessage,
}: {
  onBack: () => void
  busy: boolean
  setBusy: (v: boolean) => void
  setMessage: (v: string | null) => void
}) {
  const title = useStudioStore((s) => s.projectTitle)
  const document = useStudioStore((s) => s.document)
  const saveStatus = useStudioStore((s) => s.saveStatus)
  const viewMode = useStudioStore((s) => s.viewMode)
  const statusLabel: Record<string, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
    offline: 'Offline',
    failed: 'Save failed',
  }
  return (
    <header className="flex h-12 items-center gap-2 border-b border-white/10 px-3 text-sm">
      <button onClick={onBack} className="text-sand/70 hover:text-warm">
        ←
      </button>
      <div className="font-serif text-base">{title}</div>
      <select
        className="ml-4 rounded bg-white/10 px-2 py-1"
        value={document.settings.activeLevelId}
        onChange={(e) => useStudioStore.getState().setActiveLevel(e.target.value)}
      >
        {document.levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} ({l.elevation} mm)
          </option>
        ))}
      </select>
      <button className="ml-2 rounded p-1 hover:bg-white/10" onClick={() => useStudioStore.getState().undo()} title="Undo">
        <Undo2 size={16} />
      </button>
      <button className="rounded p-1 hover:bg-white/10" onClick={() => useStudioStore.getState().redo()} title="Redo">
        <Redo2 size={16} />
      </button>
      <button className="rounded p-1 hover:bg-white/10" onClick={() => void useStudioStore.getState().save(true)} title="Save">
        <Save size={16} />
      </button>
      <span className="text-xs text-sand/70">{statusLabel[saveStatus]}</span>
      <div className="ml-auto flex items-center gap-1">
        {(['2d', '3d', 'split'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => useStudioStore.getState().setViewMode(mode)}
            className={`rounded px-2 py-1 uppercase ${viewMode === mode ? 'bg-bronze text-ink' : 'bg-white/10'}`}
          >
            {mode === 'split' ? 'Split' : mode.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          className="rounded bg-olive px-3 py-1"
          onClick={async () => {
            setBusy(true)
            try {
              await useStudioStore.getState().validate()
              setMessage('Validasi selesai')
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Validasi gagal')
            }
            setBusy(false)
            setTimeout(() => setMessage(null), 1600)
          }}
        >
          Validate
        </button>
        <button
          type="button"
          className="rounded bg-bronze px-3 py-1 text-ink"
          onClick={async () => {
            setBusy(true)
            try {
              await useStudioStore.getState().submit()
              setMessage('Model terkirim')
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Gagal submit')
            }
            setBusy(false)
            setTimeout(() => setMessage(null), 2000)
          }}
        >
          Submit
        </button>
        <button
          type="button"
          className="rounded bg-white/10 px-3 py-1"
          onClick={async () => {
            const status = await useStudioStore.getState().exportIfc()
            setMessage('IFC job: ' + status)
            setTimeout(() => setMessage(null), 2000)
          }}
        >
          Export
        </button>
      </div>
    </header>
  )
}

function Toolbar() {
  const tool = useStudioStore((s) => s.tool)
  return (
    <div className="flex w-14 flex-col items-center gap-1 border-r border-white/10 bg-[#161a1c] py-2">
      {TOOLS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            title={`${item.label} (${item.shortcut})`}
            onClick={() => useStudioStore.getState().setTool(item.id)}
            className={`rounded p-2 ${tool === item.id ? 'bg-bronze text-ink' : 'text-sand hover:bg-white/10'}`}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </div>
  )
}

function Viewport() {
  const viewMode = useStudioStore((s) => s.viewMode)
  if (viewMode === '2d') return <Canvas2D />
  if (viewMode === '3d') return <BabylonViewport />
  return (
    <div className="grid h-full grid-cols-2">
      <div className="border-r border-white/10">
        <Canvas2D />
      </div>
      <BabylonViewport />
    </div>
  )
}

function ModelTree() {
  const document = useStudioStore((s) => s.document)
  const selectedIds = useStudioStore((s) => s.selectedIds)
  const groups = useMemo(() => {
    return document.levels.map((level) => {
      const els = document.elements.filter((el) => el.levelId === level.id)
      const types = ['wall', 'column', 'beam', 'slab', 'door', 'window'] as const
      return { level, groups: types.map((t) => ({ type: t, items: els.filter((el) => el.type === t) })) }
    })
  }, [document])
  return (
    <div>
      <div className="mb-2 font-serif">{document.project.title}</div>
      {groups.map((g) => (
        <div key={g.level.id} className="mb-3">
          <div className="text-gold">{g.level.name}</div>
          {g.groups.map((grp) => (
            <div key={grp.type} className="ml-2 mt-1">
              <div className="text-xs uppercase text-sand/50">
                {grp.type}s ({grp.items.length})
              </div>
              {grp.items.map((el) => (
                <button
                  key={el.id}
                  onClick={() => useStudioStore.getState().select([el.id])}
                  className={`block w-full truncate px-1 text-left ${selectedIds.includes(el.id) ? 'text-gold' : 'text-sand/80'}`}
                >
                  {el.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function LevelsPanel() {
  const document = useStudioStore((s) => s.document)
  return (
    <div className="space-y-2">
      {document.levels.map((level) => (
        <button
          key={level.id}
          onClick={() => useStudioStore.getState().setActiveLevel(level.id)}
          className={`block w-full rounded px-2 py-2 text-left ${document.settings.activeLevelId === level.id ? 'bg-bronze/20' : 'bg-white/5'}`}
        >
          <div>{level.name}</div>
          <div className="text-xs text-sand/60">{level.elevation} mm</div>
        </button>
      ))}
      <button className="w-full rounded border border-dashed border-white/20 py-2" onClick={() => useStudioStore.getState().addLevel()}>
        + Level
      </button>
    </div>
  )
}

function LayersPanel() {
  const document = useStudioStore((s) => s.document)
  const types = ['wall', 'column', 'beam', 'slab', 'door', 'window'] as const
  return (
    <div className="space-y-2">
      {types.map((t) => {
        const items = document.elements.filter((el) => el.type === t)
        const hidden = items.length > 0 && items.every((el) => el.hidden)
        return (
          <div key={t} className="flex items-center justify-between">
            <span className="capitalize">{t}</span>
            <button
              className="text-xs text-gold"
              onClick={() => items.forEach((el) => useStudioStore.getState().toggleHidden(el.id))}
            >
              {hidden ? 'Show' : 'Hide'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function LibraryPanel() {
  const document = useStudioStore((s) => s.document)
  return (
    <div className="space-y-2">
      {document.materials.map((m) => (
        <div key={m.id} className="flex items-center gap-2">
          <span className="h-4 w-4 rounded" style={{ background: m.color, opacity: m.opacity }} />
          <div>
            <div>{m.name}</div>
            <div className="text-xs text-sand/50">{m.code}</div>
          </div>
        </div>
      ))}
      <div className="pt-3 text-xs text-sand/50">Grid</div>
      <button className="w-full rounded bg-white/10 py-1" onClick={() => useStudioStore.getState().addGridLine('Y')}>
        + Grid Y
      </button>
      <button className="w-full rounded bg-white/10 py-1" onClick={() => useStudioStore.getState().addGridLine('X')}>
        + Grid X
      </button>
    </div>
  )
}

function PropertiesPanel({ tab, selected }: { tab: string; selected?: BIMElement }) {
  const validation = useStudioStore((s) => s.validation)
  if (!selected) {
    return <div className="text-sand/60">Pilih objek untuk melihat properti.</div>
  }
  const wall = selected.type === 'wall' ? selected : null
  return (
    <div className="space-y-3">
      {tab === 'properties' && (
        <>
          <Field label="ID" value={selected.id} readOnly />
          <Field label="Name" value={selected.name} onChange={(v) => useStudioStore.getState().updateSelected({ name: v })} />
          <Field label="Code" value={selected.code ?? ''} onChange={(v) => useStudioStore.getState().updateSelected({ code: v })} />
          <Field label="Type" value={selected.type} readOnly />
          <Field label="IFC Class" value={selected.ifcClass ?? ''} readOnly />
        </>
      )}
      {tab === 'geometry' && wall && (
        <>
          <Field label="Length" value={String(Math.round(wallLength(wall)))} readOnly />
          <Field label="Thickness" value={String(wall.geometry.thickness)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...wall.geometry, thickness: Number(v) } })} />
          <Field label="Height" value={String(wall.geometry.height)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...wall.geometry, height: Number(v) } })} />
          <Field label="Base Offset" value={String(wall.geometry.baseOffset)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...wall.geometry, baseOffset: Number(v) } })} />
        </>
      )}
      {tab === 'geometry' && selected.type === 'column' && (
        <>
          <Field label="Width" value={String(selected.geometry.width)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...selected.geometry, width: Number(v) } })} />
          <Field label="Depth" value={String(selected.geometry.depth)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...selected.geometry, depth: Number(v) } })} />
          <Field label="Height" value={String(selected.geometry.height)} onChange={(v) => useStudioStore.getState().updateSelected({ geometry: { ...selected.geometry, height: Number(v) } })} />
        </>
      )}
      {tab === 'material' && (
        <div className="space-y-1">
          {useStudioStore.getState().document.materials.map((m) => (
            <button
              key={m.id}
              onClick={() => useStudioStore.getState().updateSelected({ materialId: m.id, properties: { ...selected.properties, materialId: m.id } })}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 ${selected.materialId === m.id ? 'bg-bronze/20' : ''}`}
            >
              <span className="h-3 w-3 rounded" style={{ background: m.color }} />
              {m.name}
            </button>
          ))}
        </div>
      )}
      {tab === 'bim' && (
        <>
          <Field label="Classification" value={selected.ifcClass ?? ''} readOnly />
          <Field
            label="Description"
            value={String(selected.properties.description ?? '')}
            onChange={(v) => useStudioStore.getState().updateSelected({ properties: { ...selected.properties, description: v } })}
          />
          {validation && (
            <div className="rounded bg-white/5 p-2 text-xs">
              Skor {validation.score} — {validation.valid ? 'valid' : `${validation.errors.length} error`}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, value, onChange, readOnly }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean }) {
  return (
    <label className="block text-xs">
      <span className="text-sand/60">{label}</span>
      <input
        className="mt-1 w-full rounded bg-white/10 px-2 py-1 text-sm"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  )
}

function IssuesPanel() {
  const issues = useStudioStore((s) => s.issues)
  const validation = useStudioStore((s) => s.validation)
  const [title, setTitle] = useState('')
  const roleCanReview = true
  return (
    <div className="space-y-3">
      {validation && (
        <div className="rounded bg-white/5 p-2">
          <div className="text-gold">Validasi · {validation.score}</div>
          {validation.errors.map((e) => (
            <div key={e.code + e.message} className="text-xs text-danger">
              {e.message}
            </div>
          ))}
          {validation.warnings.map((e) => (
            <div key={e.code + e.message} className="text-xs text-sand/70">
              {e.message}
            </div>
          ))}
        </div>
      )}
      {issues.map((issue) => (
        <div key={issue.id} className="rounded bg-white/5 p-2">
          <div className="flex justify-between text-xs uppercase text-sand/50">
            <span>{issue.severity}</span>
            <span>{issue.status}</span>
          </div>
          <div>{issue.title}</div>
        </div>
      ))}
      {roleCanReview && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            void useStudioStore.getState().createIssue({ title, description: title, severity: 'minor' })
            setTitle('')
          }}
        >
          <input className="w-full rounded bg-white/10 px-2 py-1" placeholder="Issue baru" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="w-full rounded bg-bronze py-1 text-ink">Buat issue</button>
        </form>
      )}
    </div>
  )
}

function InstructionDock() {
  const steps = useStudioStore((s) => s.labSteps)
  const index = useStudioStore((s) => s.labStepIndex)
  const document = useStudioStore((s) => s.document)
  if (!steps.length) return null
  const step = steps[index]
  const done = labStepCompleted(step.required_action, document)
  return (
    <div className="absolute bottom-4 left-4 max-w-sm rounded border border-bronze/40 bg-charcoal/95 p-3 shadow">
      <div className="text-xs uppercase tracking-wide text-gold">
        BIM Lab · Langkah {index + 1}/{steps.length}
      </div>
      <div className="font-serif text-lg">{step.title}</div>
      <p className="mt-1 text-sm text-sand/80">{step.instruction}</p>
      {step.hint && <p className="mt-1 text-xs text-sand/50">Hint: {step.hint}</p>}
      <div className={`mt-2 text-xs ${done ? 'text-olive' : 'text-sand/60'}`}>{done ? 'Syarat terpenuhi' : 'Belum selesai'}</div>
    </div>
  )
}

function StatusBar() {
  const pointer = useStudioStore((s) => s.pointerWorld)
  const snap = useStudioStore((s) => s.snap)
  const selectedIds = useStudioStore((s) => s.selectedIds)
  const tool = useStudioStore((s) => s.tool)
  const camera = useStudioStore((s) => s.camera2d)
  const saveStatus = useStudioStore((s) => s.saveStatus)
  const document = useStudioStore((s) => s.document)
  const selected = document.elements.find((el) => el.id === selectedIds[0])
  const preview = useStudioStore((s) => s.preview)
  const length = preview?.type === 'wall' ? dist2(preview.start as never, preview.end as never) : null
  return (
    <footer className="flex h-8 items-center gap-4 border-t border-white/10 px-3 text-[11px] uppercase tracking-wide text-sand/70">
      <span>
        X {Math.round(pointer.x)} · Y {Math.round(pointer.y)}
      </span>
      <span>Snap {snap?.kind ?? 'free'}</span>
      <span>Sel {selected?.name ?? '—'}</span>
      <span>Tool {tool}</span>
      <span>mm</span>
      <span>Zoom {Math.round(camera.zoom * 1000) / 10}%</span>
      {length !== null && <span>Preview {formatMm(length)}</span>}
      <span className="ml-auto">{saveStatus}</span>
      <Columns2 size={12} />
      <LayoutGrid size={12} />
      <BoxSelect size={12} />
    </footer>
  )
}
