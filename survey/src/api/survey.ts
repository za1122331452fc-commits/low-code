import { post, get, put, del } from '@/utils/request'
// 请求响应类型
import type {
  loginRequest,
  LoginData,
  registRequest,
  SurveyDBData,
  SurveyDBReturnData,
  SurveyListParams,
  SurveyListResult,
  AdminUserListParams,
  AdminUserListResult,
  AdminUserStats,
  PublishedQuiz,
  MyQuizListResult,
  QuizListParams,
  QuizStats,
  QuizAnswerPage,
  AdminSurveyListParams,
  AdminSurveyListResult,
} from '@/types'

// 登录
export const login = (data: loginRequest) => {
  return post<LoginData>('/api/user/login', data)
}

// 注册
export const regist = (data: registRequest) => {
  return post<LoginData>('/api/user/regist', data)
}

// 查询用户信息
export const getUserInfoApi = () => {
  return get<LoginData>('/api/user/whoami')
}

// ============ 用户管理（管理员） ============

// 管理员：用户列表（分页 + 关键字搜索）
export const getAdminUsersApi = (params?: AdminUserListParams) => {
  return get<AdminUserListResult>('/api/user/admin/users', { params })
}

// 管理员：用户统计（总用户 / 今日新增 / 今日活跃）
export const getUserStatsApi = () => {
  return get<AdminUserStats>('/api/user/admin/stats')
}

// 管理员：启用/禁用用户
export const setUserBlockApi = (id: number, isblock: number) => {
  return put<void>(`/api/user/admin/block/${id}`, { isblock })
}

// ============ 问卷 ============

// 保存问卷（后端，与 IndexedDB 的 @/db/operation 并存）
export const saveSurveyApi = (data: SurveyDBData) => {
  return post<SurveyDBReturnData>('/api/survey', data)
}

// 查询问卷列表（后端分页 + 标题搜索）
export const getSurveysApi = (params?: SurveyListParams) => {
  return get<SurveyListResult>('/api/survey', { params })
}

// 查询单个问卷
export const getSurveyByIdApi = (id: number) => {
  return get<SurveyDBReturnData>(`/api/survey/${id}`)
}

// 更新问卷
export const updateSurveyApi = (id: number, data: Partial<SurveyDBData>) => {
  return put<void>(`/api/survey/${id}`, data)
}

// 删除问卷
export const deleteSurveyApi = (id: number) => {
  return del<void>(`/api/survey/${id}`)
}

// 获取验证码
export const getCaptcha = async (): Promise<string> => {
  const response = await fetch(`/res/captcha?t=${Date.now()}`)
  if (!response.ok) {
    throw new Error('获取验证码失败')
  }
  return await response.text()
}

// ============ 在线问卷 ============

// 发布在线问卷（需登录，返回 quizId 用于生成答题链接）
export const publishQuizApi = (data: {
  title?: string
  coms: unknown[]
  surveyCount?: number
  surveyId?: number
}) => {
  return post<PublishedQuiz>('/api/quiz', data)
}

// 我发布的问卷列表（含提交数，搜索 + 分页 + 排序）
export const getMyQuizzesApi = (params: QuizListParams) => {
  return get<MyQuizListResult>('/api/quiz/mine', { params })
}

// 问卷统计
export const getQuizStatsApi = (quizId: string) => {
  return get<QuizStats>(`/api/quiz/${quizId}/stats`)
}

// 某道题的答题明细（分页）
export const getQuizAnswersApi = (
  quizId: string,
  qIndex: number,
  page: number,
  pageSize: number
) => {
  return get<QuizAnswerPage>(`/api/quiz/${quizId}/answers`, {
    params: { qIndex, page, pageSize },
  })
}

// ============ 问卷管理（管理员） ============

// 管理员：所有用户的问卷列表（分页 + 搜索）
export const getAdminSurveysApi = (params?: AdminSurveyListParams) => {
  return get<AdminSurveyListResult>('/api/survey/admin/list', { params })
}

// 管理员：禁用/启用问卷
export const setSurveyBlockApi = (id: number, isblock: boolean) => {
  return put<void>(`/api/survey/admin/block/${id}`, { isblock })
}