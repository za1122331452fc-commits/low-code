// 问卷相关的后端状态管理
// composables/useSurvey.ts
import { ref, computed, type Ref } from 'vue'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/vue-query'
import {
  getSurveysApi,
  saveSurveyApi,
  updateSurveyApi,
  deleteSurveyApi,
} from '@/api'
import type { SurveyDBData } from '@/types'

export const useSurvey = (params?: {
  keyword?: Ref<string>
  page?: Ref<number>
  pageSize?: Ref<number>
  order?: Ref<'asc' | 'desc'>
}) => {
  const queryClient = useQueryClient()

  // 查询条件（默认值，保持响应式，外部 ref 变化即可驱动重新查询）
  const keyword = params?.keyword ?? ref('')
  const page = params?.page ?? ref(1)
  const pageSize = params?.pageSize ?? ref(10)
  const order = params?.order ?? ref<'asc' | 'desc'>('desc')

  // ============ 查询问卷列表（后端分页 + 标题搜索） ============
  // queryKey 内嵌查询条件：翻页/搜索/排序变化时自动重新请求
  const surveyListQuery = useQuery({
    queryKey: ['surveys', keyword, page, pageSize, order],
    queryFn: () =>
      getSurveysApi({
        keyword: keyword.value.trim() || undefined,
        page: page.value,
        pageSize: pageSize.value,
        order: order.value,
      }),
    // 翻页/搜索切换时保留上一份数据，避免列表闪烁
    placeholderData: keepPreviousData,
  })

  const surveyList = computed(() => surveyListQuery.data.value?.list)
  const total = computed(() => surveyListQuery.data.value?.total ?? 0)

  // ============ 保存问卷 ============
  const saveSurveyMutation = useMutation({
    mutationFn: (data: SurveyDBData) => saveSurveyApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  // ============ 更新问卷 ============
  const updateSurveyMutation = useMutation({
    mutationFn: (params: { id: number; data: Partial<SurveyDBData> }) =>
      updateSurveyApi(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  // ============ 删除问卷 ============
  const deleteSurveyMutation = useMutation({
    mutationFn: (id: number) => deleteSurveyApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  // mutateAsync 包装，返回 Promise 供业务侧继续链式处理（如保存后跳转）
  const saveSurvey = (data: SurveyDBData) => saveSurveyMutation.mutateAsync(data)
  const updateSurvey = (id: number, data: Partial<SurveyDBData>) =>
    updateSurveyMutation.mutateAsync({ id, data })
  const deleteSurvey = (id: number) => deleteSurveyMutation.mutateAsync(id)

  return {
    // 状态
    surveyList,
    total,
    isFetching: surveyListQuery.isFetching,
    isLoading: surveyListQuery.isPending,

    // 保存
    saveSurvey,
    saveSurveyPending: saveSurveyMutation.isPending,

    // 更新
    updateSurvey,
    updateSurveyPending: updateSurveyMutation.isPending,

    // 删除
    deleteSurvey,
    deleteSurveyPending: deleteSurveyMutation.isPending,
  }
}
