import { useEffect, useRef } from 'react'
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core'
import { MM_TO_BABYLON, type BIMDocument, type BIMElement, type BIMWall } from '../core/types'
import { generateWallGeometry, wallPointAt } from '../geometry/WallGeometry'
import { generateColumnGeometry } from '../geometry/ColumnGeometry'
import { useStudioStore } from '../../../stores/studioStore'

export function BabylonViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const document = useStudioStore((s) => s.document)
  const selectedIds = useStudioStore((s) => s.selectedIds)
  const isolatedIds = useStudioStore((s) => s.isolatedIds)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    sceneRef.current = scene
    scene.clearColor = new Color4(0.13, 0.15, 0.16, 1)
    const camera = new ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3.2, 28, new Vector3(6, 0, 4), scene)
    camera.attachControl(canvas, true)
    camera.lowerRadiusLimit = 4
    camera.upperRadiusLimit = 120
    camera.wheelPrecision = 20
    camera.panningSensibility = 80
    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.72
    const sun = new DirectionalLight('sun', new Vector3(-0.4, -1, -0.3), scene)
    sun.intensity = 0.5
    const ground = MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene)
    const groundMat = new StandardMaterial('gmat', scene)
    groundMat.diffuseColor = Color3.FromHexString('#2a3034')
    groundMat.specularColor = Color3.Black()
    ground.material = groundMat
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      sceneRef.current = null
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    for (const mesh of [...scene.meshes]) {
      if (mesh.name.startsWith('bim-')) mesh.dispose()
    }
    const visible = document.elements.filter((el) => !el.hidden && (!isolatedIds.length || isolatedIds.includes(el.id)))
    for (const el of visible) createMesh(scene, el, document, selectedIds.includes(el.id))
  }, [document, selectedIds, isolatedIds])

  return (
    <div className="relative h-full w-full bg-ink">
      <canvas ref={canvasRef} className="block h-full w-full outline-none" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-charcoal/80 px-2 py-1 text-[11px] uppercase tracking-wide text-sand">
        Viewport 3D
      </div>
    </div>
  )
}

function createMesh(scene: Scene, el: BIMElement, doc: BIMDocument, selected: boolean) {
  const materialDef = doc.materials.find((m) => m.id === el.materialId)
  const mat = new StandardMaterial(`bim-mat-${el.id}`, scene)
  mat.diffuseColor = Color3.FromHexString(selected ? '#C89C54' : materialDef?.color || '#9AA0A6')
  mat.specularColor = Color3.FromHexString('#222222')
  mat.alpha = materialDef?.opacity ?? 1
  const levelZ = (doc.levels.find((l) => l.id === el.levelId)?.elevation ?? 0) * MM_TO_BABYLON

  if (el.type === 'wall') {
    const geom = generateWallGeometry(el, doc)
    for (const [i, seg] of geom.segments.entries()) {
      const length = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y) * MM_TO_BABYLON
      if (length < 0.02) continue
      const box = MeshBuilder.CreateBox(`bim-wall-${el.id}-${i}`, {
        width: length,
        height: seg.height * MM_TO_BABYLON,
        depth: el.geometry.thickness * MM_TO_BABYLON,
      }, scene)
      const midX = ((seg.start.x + seg.end.x) / 2) * MM_TO_BABYLON
      const midZ = ((seg.start.y + seg.end.y) / 2) * MM_TO_BABYLON
      const angle = Math.atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x)
      box.position = new Vector3(midX, levelZ + (seg.base + seg.height / 2) * MM_TO_BABYLON, midZ)
      box.rotation.y = -angle
      box.material = mat
    }
  }

  if (el.type === 'column') {
    const geom = generateColumnGeometry(el)
    const box = MeshBuilder.CreateBox(`bim-col-${el.id}`, {
      width: geom.width * MM_TO_BABYLON,
      depth: geom.depth * MM_TO_BABYLON,
      height: geom.height * MM_TO_BABYLON,
    }, scene)
    box.position = new Vector3(
      el.transform.position.x * MM_TO_BABYLON,
      levelZ + (el.geometry.baseOffset + geom.height / 2) * MM_TO_BABYLON,
      el.transform.position.z * MM_TO_BABYLON,
    )
    box.material = mat
  }

  if (el.type === 'beam') {
    const dx = el.geometry.end.x - el.geometry.start.x
    const dz = el.geometry.end.z - el.geometry.start.z
    const length = Math.hypot(dx, dz) * MM_TO_BABYLON
    const box = MeshBuilder.CreateBox(`bim-beam-${el.id}`, {
      width: length,
      height: el.geometry.height * MM_TO_BABYLON,
      depth: el.geometry.width * MM_TO_BABYLON,
    }, scene)
    box.position = new Vector3(
      ((el.geometry.start.x + el.geometry.end.x) / 2) * MM_TO_BABYLON,
      ((el.geometry.start.y + el.geometry.end.y) / 2) * MM_TO_BABYLON,
      ((el.geometry.start.z + el.geometry.end.z) / 2) * MM_TO_BABYLON,
    )
    box.rotation.y = -Math.atan2(dz, dx)
    box.material = mat
  }

  if (el.type === 'slab' && el.geometry.polygon.length >= 3) {
    const xs = el.geometry.polygon.map((p) => p.x)
    const ys = el.geometry.polygon.map((p) => p.y)
    const w = (Math.max(...xs) - Math.min(...xs)) * MM_TO_BABYLON
    const d = (Math.max(...ys) - Math.min(...ys)) * MM_TO_BABYLON
    const box = MeshBuilder.CreateBox(`bim-slab-${el.id}`, {
      width: Math.max(w, 0.1),
      depth: Math.max(d, 0.1),
      height: el.geometry.thickness * MM_TO_BABYLON,
    }, scene)
    box.position = new Vector3(
      ((Math.min(...xs) + Math.max(...xs)) / 2) * MM_TO_BABYLON,
      levelZ + el.geometry.baseOffset * MM_TO_BABYLON,
      ((Math.min(...ys) + Math.max(...ys)) / 2) * MM_TO_BABYLON,
    )
    box.material = mat
  }

  if ((el.type === 'door' || el.type === 'window') && el.hostWallId) {
    const host = doc.elements.find((e): e is BIMWall => e.type === 'wall' && e.id === el.hostWallId)
    if (!host) return
    const mid = wallPointAt(host, el.geometry.offset + el.geometry.width / 2)
    const angle = Math.atan2(host.geometry.end.y - host.geometry.start.y, host.geometry.end.x - host.geometry.start.x)
    const box = MeshBuilder.CreateBox(`bim-open-${el.id}`, {
      width: el.geometry.width * MM_TO_BABYLON,
      height: el.geometry.height * MM_TO_BABYLON,
      depth: Math.max(host.geometry.thickness * MM_TO_BABYLON * 1.15, 0.08),
    }, scene)
    box.position = new Vector3(
      mid.x * MM_TO_BABYLON,
      levelZ + (el.geometry.sillHeight + el.geometry.height / 2) * MM_TO_BABYLON,
      mid.y * MM_TO_BABYLON,
    )
    box.rotation.y = -angle
    box.material = mat
  }
}
