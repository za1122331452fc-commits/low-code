// 管理员问卷管理的后端状态（对齐 useAdminUser 的写法）
// composables/useAdminSurvey.ts
import { ref, computed, type Ref } from 'vue'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { getAdminSurveysApi, setSurveyBlockApi } from '@/api'

export const useAdminSurvey = (params?: {
  keyword?: Ref<string>
  page?: Ref<number>
  pageSize?: Ref<number>
  order?: Ref<'asc' | 'desc'>
}) => {
  const queryClient = useQueryClient()

  const keyword = params?.keyword ?? ref('')
  const page = params?.page ?? ref(1)
  const pageSize = params?.pageSize ?? ref(10)
  const order = params?.order ?? ref<'asc' | 'desc'>('desc')

  // ============ 问卷列表（后端分页 + 搜索 + 排序） ============
  const surveyListQuery = useQuery({
    queryKey: ['admin-surveys', keyword, page, pageSize, order],
    queryFn: () =>
      getAdminSurveysApi({
        keyword: keyword.value.trim() || undefined,
        page: page.value,
        pageSize: pageSize.value,
        order: order.value,
      }),
    placeholderData: keepPreviousData,
  })

  const surveyList = computed(() => surveyListQuery.data.value?.list)
  const total = computed(() => surveyListQuery.data.value?.total ?? 0)

  // ============ 禁用/启用 ============
  const setBlockMutation = useMutation({
    mutationFn: (p: { id: number; isblock: boolean }) => setSurveyBlockApi(p.id, p.isblock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
  })

  const setBlock = (id: number, isblock: boolean) => setBlockMutation.mutateAsync({ id, isblock })

  return {
    surveyList,
    total,
    isFetching: surveyListQuery.isFetching,
    isLoading: surveyListQuery.isPending,
    setBlock,
    setBlockPending: setBlockMutation.isPending,
  }
}
