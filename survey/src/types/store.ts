import type { TextProps, OptionsProps, Status, Material, SurveyDBData } from '@/types'

// 定义 updateStatus 的类型
export type UpdateStatus = (
  configKey: string,
  payload?: number | string | boolean | object,
  isShowChange?: boolean,
) => void
export type PicLink = { link: string; index: number }
export type GetLink = (obj: PicLink) => void

export type optionsStatusByIndexPayload = {
  val: string
  index: number
}

export function isOptionsStatusByIndexPayload(obj: object): obj is optionsStatusByIndexPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'val' in obj &&
    typeof (obj as optionsStatusByIndexPayload).val === 'string' &&
    'index' in obj &&
    typeof (obj as optionsStatusByIndexPayload).index === 'number'
  )
}

export function isPicLink(obj: object): obj is PicLink {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'link' in obj &&
    typeof (obj as PicLink).link === 'string' &&
    'index' in obj &&
    typeof (obj as PicLink).index === 'number'
  )
}

export interface Actions {
  addOption: (optionProps: OptionsProps) => void
  removeOption: (optionProps: OptionsProps, index: number) => boolean
  setPosition: (positionProps: OptionsProps, index: number) => void
  setSize: (sizeProps: OptionsProps, index: number) => void
  setWeight: (weightProps: OptionsProps, index: number) => void
  setItalic: (italicProps: OptionsProps, index: number) => void
  setColor: (colorProps: TextProps, color: string) => void
  setTextType: (typeProps: OptionsProps, index: number) => void
  setTextStatus: (textProps: TextProps, text: string) => void
  setUse: (optionsProps: OptionsProps, isUse: boolean) => void
  setOptionsStatusByIndex: (
    optionsProps: OptionsProps,
    payload: optionsStatusByIndexPayload,
  ) => void
  setPicLinkByIndex: (optionsProps: OptionsProps, payload: PicLink) => void
}

export interface MaterialStore extends Actions {
  currentMaterialCom: Material
  coms: Record<Material, Status>
  setCurrentSurveyCom: (com: Material) => void
}

export interface EditorStore extends Actions {
  currentComponentIndex: number
  surveyCount: number
  coms: Status[]
  setCurrentComponentIndex: (index: number) => void
  addCom: (coms: Status[], newCom: Status) => void
  setStore: (storeStatus: SurveyDBData) => void
  initStore: () => void
  removeCom: (index: number) => void
  resetComs: () => void
}

export type QuizData = {
  title?: string
  disabled?: boolean
  surveyCount: number
  coms: Status[]
}

// 我的发布分页结果
export type MyQuizListResult = {
  list: MyQuizItem[]
  total: number
}

// 我的发布查询参数（搜索 + 分页 + 排序）
export type QuizListParams = {
  keyword?: string
  page: number
  pageSize: number
  order?: 'asc' | 'desc'
}

// 已发布的在线问卷（接口返回）
export type PublishedQuiz = {
  id: number
  quizId: string
  title: string
  surveyCount: number
  createDate: number
}

// 我的发布列表项
export type MyQuizItem = PublishedQuiz & {
  answerCount: number
}

// 单选项统计
export type QuizOptionStat = {
  label: string
  image?: string
  desc?: string
  count: number
  percent: number
}

// 单题统计
export type QuizQuestionStat = {
  index: number
  name: string
  title: string
  type: 'choice' | 'text' | 'note'
  answered: number
  options?: QuizOptionStat[]
}

// 问卷统计
export type QuizStats = {
  quizId: string
  title: string
  total: number
  questions: QuizQuestionStat[]
}

// 答题明细条目
export type QuizAnswerItem = {
  answer: string
  time: number
}

// 答题明细分页
export type QuizAnswerPage = {
  title: string
  name?: string
  type?: string
  total: number
  list: QuizAnswerItem[]
}
