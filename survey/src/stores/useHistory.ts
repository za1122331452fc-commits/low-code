/**
 * 撤销/重做历史记录仓库
 */
import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { useEditorStore } from './useEditor'
import type { HistoryAction, Status } from '@/types'

const MAX_HISTORY = 50

function cloneComForHistory(com: Status): Status {
  const raw = toRaw(com)
  const clonedStatus: Record<string, Record<string, unknown>> = {}
  for (const key in raw.status) {
    const prop = toRaw(raw.status[key]) as unknown as Record<string, unknown>
    const clonedProp: Record<string, unknown> = {}
    for (const propKey in prop) {
      if (propKey === 'editCom' || propKey === 'name' || propKey === 'id') {
        // Keep component refs and identifiers as-is — they never change
        clonedProp[propKey] = prop[propKey]
        continue
      }
      const val = prop[propKey]
      if (Array.isArray(val)) {
        clonedProp[propKey] = val.map((item) =>
          typeof item === 'object' && item !== null ? { ...item } : item,
        )
      } else if (typeof val === 'object' && val !== null) {
        clonedProp[propKey] = { ...val }
      } else {
        clonedProp[propKey] = val
      }
    }
    clonedStatus[key] = clonedProp
  }
  return {
    type: raw.type,
    name: raw.name,
    id: raw.id,
    status: clonedStatus,
  } as unknown as Status
}

export function snapshotCom(com: Status): Status {
  return cloneComForHistory(com)
}

// 将 source 的状态数据就地写回 target（直接操作响应式对象以触发视图更新，editCom 组件引用保持 target 的）
function restoreComInPlace(target: Status, source: Status) {
  for (const key in source.status) {
    const src = source.status[key] as unknown as Record<string, unknown>
    const dst = target.status[key] as unknown as Record<string, unknown> | undefined
    if (!dst) {
      ;(target.status[key] as unknown) = src
      continue
    }
    for (const k in src) {
      if (k === 'editCom') continue
      const sv = src[k]
      if (Array.isArray(sv)) {
        if (Array.isArray(dst[k])) {
          ;(dst[k] as unknown[]).splice(0, dst[k].length, ...sv)
        } else {
          dst[k] = sv.slice()
        }
      } else if (typeof sv === 'object' && sv !== null) {
        dst[k] = { ...sv }
      } else {
        dst[k] = sv
      }
    }
  }
}

// 对比组件数据（忽略组件引用），用于判断修改前后是否真的发生了变化
function comDataEqual(a: Status, b: Status): boolean {
  const replacer = (key: string, value: unknown) =>
    key === 'editCom' || key === 'type' ? undefined : value
  return JSON.stringify(a, replacer) === JSON.stringify(b, replacer)
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    past: [] as HistoryAction[],
    future: [] as HistoryAction[],
    version: 0, // 撤销/重做后自增，用于强制右侧编辑面板重新挂载
  }),
  getters: {
    canUndo: (state) => state.past.length > 0,
    canRedo: (state) => state.future.length > 0,
  },
  actions: {
    record(action: HistoryAction) {
      this.past.push(action)
      if (this.past.length > MAX_HISTORY) {
        this.past.shift()
      }
      this.future = []
    },
    undo() {
      const action = this.past.pop()
      if (!action) return
      const editor = useEditorStore()
      const focusedId = editor.coms[editor.currentComponentIndex]?.id
      this.future.push(action)
      try {
        this._applyReverse(action)
      } finally {
        this.version++
        this._restoreFocus(focusedId)
      }
    },
    redo() {
      const action = this.future.pop()
      if (!action) return
      const editor = useEditorStore()
      const focusedId = editor.coms[editor.currentComponentIndex]?.id
      this.past.push(action)
      try {
        this._applyForward(action)
      } finally {
        this.version++
        this._restoreFocus(focusedId)
      }
    },
    _restoreFocus(focusedId: string | undefined) {
      const editor = useEditorStore()
      // 撤销/重做后尽量保留原聚焦的组件（通过 id 重新定位）；
      // 仅当该组件被操作删除时才取消聚焦
      if (!focusedId) {
        editor.setCurrentComponentIndex(-1)
        return
      }
      const newIndex = editor.coms.findIndex((com) => com.id === focusedId)
      if (newIndex === -1) {
        editor.setCurrentComponentIndex(-1)
      } else {
        editor.setCurrentComponentIndex(newIndex)
      }
    },
    clear() {
      this.past = []
      this.future = []
    },
    recordAdd(comIndex: number, com: Status) {
      this.record({
        type: 'ADD',
        comIndex,
        com: cloneComForHistory(com),
      })
    },
    recordDelete(comIndex: number, com: Status) {
      this.record({
        type: 'DELETE',
        comIndex,
        com: cloneComForHistory(com),
      })
    },
    recordMove(fromIndex: number, toIndex: number) {
      this.record({
        type: 'MOVE',
        fromIndex,
        toIndex,
      })
    },
    recordUpdate(comIndex: number, prevCom: Status) {
      const editor = useEditorStore()
      const newCom = snapshotCom(editor.coms[comIndex])
      // 数据未发生变化则不记录（例如删除选项时不足两个被拦截、选中状态切换等）
      if (comDataEqual(prevCom, newCom)) return
      this.record({
        type: 'UPDATE',
        comIndex,
        prevCom,
        newCom,
      })
    },
    _applyReverse(action: HistoryAction) {
      const editor = useEditorStore()
      switch (action.type) {
        case 'ADD':
          editor.coms.splice(action.comIndex, 1)
          break
        case 'DELETE':
          editor.coms.splice(action.comIndex, 0, action.com)
          break
        case 'MOVE': {
          const [moved] = editor.coms.splice(action.toIndex, 1)
          editor.coms.splice(action.fromIndex, 0, moved)
          break
        }
        case 'UPDATE': {
          const com = editor.coms[action.comIndex]
          if (com) restoreComInPlace(com, action.prevCom)
          break
        }
      }
    },
    _applyForward(action: HistoryAction) {
      const editor = useEditorStore()
      switch (action.type) {
        case 'ADD':
          editor.coms.splice(action.comIndex, 0, action.com)
          break
        case 'DELETE':
          editor.coms.splice(action.comIndex, 1)
          break
        case 'MOVE': {
          const [moved] = editor.coms.splice(action.fromIndex, 1)
          editor.coms.splice(action.toIndex, 0, moved)
          break
        }
        case 'UPDATE': {
          const com = editor.coms[action.comIndex]
          if (com) restoreComInPlace(com, action.newCom)
          break
        }
      }
    },
  },
})
