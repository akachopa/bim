import { wallLength } from '../geometry/WallGeometry'
import { generateSlabGeometry } from '../geometry/SlabGeometry'
import type { BIMDocument, BIMWall, ValidationIssue, ValidationReport, ValidationRule } from '../core/types'

export function validateDocument(doc: BIMDocument, rules: ValidationRule[] = []): ValidationReport {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const levelIds = new Set(doc.levels.map((l) => l.id))

  for (const el of doc.elements) {
    if (['wall', 'column', 'beam', 'slab', 'door', 'window'].includes(el.type) && !el.levelId) {
      errors.push({ code: 'wall-level', elementId: el.id, message: `${el.name} tidak memiliki level.` })
    } else if (el.levelId && !levelIds.has(el.levelId)) {
      errors.push({ code: 'invalid-parent', elementId: el.id, message: `${el.name} merujuk level yang tidak ada.` })
    }

    if (['wall', 'column', 'beam', 'slab'].includes(el.type) && !el.materialId) {
      warnings.push({ code: 'missing-material', elementId: el.id, message: `${el.name} belum memiliki material.` })
    }

    if ((el.type === 'door' || el.type === 'window') && !el.hostWallId) {
      errors.push({ code: 'host-required', elementId: el.id, message: `${el.name} wajib memiliki host wall.` })
    }

    if (el.type === 'wall') {
      const length = wallLength(el)
      if (length < 100 || el.geometry.thickness < 50 || el.geometry.height < 500) {
        errors.push({ code: 'dimension-range', elementId: el.id, message: `${el.name} memiliki dimensi tidak valid.` })
      }
    }
    if (el.type === 'slab') {
      const geom = generateSlabGeometry(el)
      if (!geom.closed) {
        errors.push({ code: 'slab-open', elementId: el.id, message: `${el.name} polygon tidak tertutup.` })
      }
    }
  }

  const ruleResults = rules.map((rule) => {
    const result = evaluateRule(rule, doc)
    if (!result.passed) {
      errors.push({ code: rule.id, message: result.message })
    }
    return { id: rule.id, name: rule.name, type: rule.type, weight: rule.weight, ...result }
  })

  const completion = ruleResults.length
    ? (ruleResults.filter((r) => r.passed).length / ruleResults.length) * 100
    : Math.min(100, doc.elements.length * 8)
  const accuracy = Math.max(0, 100 - errors.length * 12)
  const compliance = Math.max(0, 100 - warnings.length * 8)
  const discipline = 100
  const score = completion * 0.4 + accuracy * 0.3 + compliance * 0.2 + discipline * 0.1

  return {
    valid: errors.length === 0,
    score: Math.round(score * 100) / 100,
    errors,
    warnings,
    rules: ruleResults,
  }
}

export function evaluateRule(rule: ValidationRule, doc: BIMDocument): { passed: boolean; message: string } {
  const type = (rule.config.elementType as string | undefined) ?? undefined
  const count = type ? doc.elements.filter((el) => el.type === type).length : doc.elements.length
  switch (rule.type) {
    case 'MIN_ELEMENT_COUNT':
      return {
        passed: count >= Number(rule.config.min ?? 0),
        message: `Minimal ${rule.config.min} ${type}. Saat ini: ${count}`,
      }
    case 'MAX_ELEMENT_COUNT':
      return {
        passed: count <= Number(rule.config.max ?? 9999),
        message: `Maksimal ${rule.config.max} ${type}. Saat ini: ${count}`,
      }
    case 'REQUIRED_ELEMENT':
      return { passed: count > 0, message: `Wajib ada elemen ${type}` }
    case 'REQUIRED_LEVEL':
      return {
        passed: doc.levels.length >= Number(rule.config.min ?? 1),
        message: `Wajib memiliki minimal ${rule.config.min ?? 1} level`,
      }
    case 'REQUIRED_MATERIAL':
      return {
        passed: doc.elements
          .filter((el) => ['wall', 'column', 'beam', 'slab'].includes(el.type))
          .every((el) => Boolean(el.materialId)),
        message: 'Semua elemen struktural wajib memiliki material',
      }
    case 'HOST_REQUIRED':
      return {
        passed: doc.elements
          .filter((el) => el.type === 'door' || el.type === 'window')
          .every((el) => Boolean(el.hostWallId)),
        message: 'Door/window wajib memiliki host wall',
      }
    default:
      return { passed: true, message: 'OK' }
  }
}

export function labStepCompleted(requiredAction: string, doc: BIMDocument): boolean {
  const walls = doc.elements.filter((el): el is BIMWall => el.type === 'wall')
  switch (requiredAction) {
    case 'activate_wall':
      return true
    case 'draw_wall_5000':
      return walls.some((w) => Math.abs(wallLength(w) - 5000) < 50)
    case 'set_thickness_150':
      return walls.some((w) => w.geometry.thickness === 150)
    case 'set_height_3000':
      return walls.some((w) => w.geometry.height === 3000 && Boolean(w.materialId))
    default:
      return false
  }
}
