import type { BIMDocument } from '../core/types'

export type BIMCommand = {
  name: string
  execute: (doc: BIMDocument) => BIMDocument
  undo: (doc: BIMDocument) => BIMDocument
}

export function createCommandEngine() {
  let undoStack: BIMCommand[] = []
  let redoStack: BIMCommand[] = []

  return {
    execute(doc: BIMDocument, command: BIMCommand): BIMDocument {
      const next = command.execute(doc)
      undoStack = [...undoStack, command]
      redoStack = []
      return next
    },
    undo(doc: BIMDocument): BIMDocument {
      const command = undoStack[undoStack.length - 1]
      if (!command) return doc
      undoStack = undoStack.slice(0, -1)
      redoStack = [...redoStack, command]
      return command.undo(doc)
    },
    redo(doc: BIMDocument): BIMDocument {
      const command = redoStack[redoStack.length - 1]
      if (!command) return doc
      redoStack = redoStack.slice(0, -1)
      undoStack = [...undoStack, command]
      return command.execute(doc)
    },
    canUndo() {
      return undoStack.length > 0
    },
    canRedo() {
      return redoStack.length > 0
    },
    reset() {
      undoStack = []
      redoStack = []
    },
  }
}

export type CommandEngine = ReturnType<typeof createCommandEngine>
