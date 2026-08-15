import type { Status } from './common'
export interface SurveyDBData {
  createDate: number
  updateDate: number
  title: string
  surveyCount: number
  coms: Status[]
}

export interface SurveyDBReturnData extends SurveyDBData {
  id: number
  userId?: number
  isblock?: boolean
}

// 问卷列表查询参数（后端分页 + 标题搜索 + 排序）
export interface SurveyListParams {
  keyword?: string
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}

// 问卷列表接口返回（分页）
export interface SurveyListResult {
  list: SurveyDBReturnData[]
  total: number
}

// 管理员：问卷管理项（带所有者信息）
export interface AdminSurveyItem {
  id: number
  userId: number
  title: string
  createDate: number
  updateDate: number
  surveyCount: number
  isblock: boolean
  ownerLoginId: string
  ownerName: string
}

// 管理员：问卷列表查询参数
export interface AdminSurveyListParams {
  keyword?: string
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}

// 管理员：问卷列表接口返回（分页）
export interface AdminSurveyListResult {
  list: AdminSurveyItem[]
  total: number
}

// 管理员：用户项
export interface AdminUserItem {
  id: number
  loginId: string
  name: string
  roleId: number
  isblock: 10 | 20
}

// 管理员：用户统计
export interface AdminUserStats {
  total: number
  todayNew: number
  todayActive: number
}

// 管理员：用户列表查询参数
export interface AdminUserListParams {
  keyword?: string
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}

// 管理员：用户列表接口返回（分页）
export interface AdminUserListResult {
  list: AdminUserItem[]
  total: number
}
