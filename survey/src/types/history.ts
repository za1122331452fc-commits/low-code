import type { Status } from './common'

export type HistoryAction =
  | { type: 'ADD'; comIndex: number; com: Status }
  | { type: 'DELETE'; comIndex: number; com: Status }
  | { type: 'MOVE'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE'; comIndex: number; prevCom: Status; newCom: Status }