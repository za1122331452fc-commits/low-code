// 在线问卷的后端状态（我的发布 / 统计 / 答题明细）
// composables/useQuiz.ts
import { ref, computed, type Ref } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { getMyQuizzesApi, getQuizStatsApi, getQuizAnswersApi } from '@/api'

// 我的发布列表（搜索 + 分页 + 排序）
export const useMyQuizzes = (params?: {
  keyword?: Ref<string>
  page?: Ref<number>
  pageSize?: Ref<number>
  order?: Ref<'asc' | 'desc'>
}) => {
  const keyword = params?.keyword ?? ref('')
  const page = params?.page ?? ref(1)
  const pageSize = params?.pageSize ?? ref(10)
  const order = params?.order ?? ref<'asc' | 'desc'>('desc')

  const query = useQuery({
    queryKey: ['my-quizzes', keyword, page, pageSize, order],
    queryFn: () =>
      getMyQuizzesApi({
        keyword: keyword.value.trim() || undefined,
        page: page.value,
        pageSize: pageSize.value,
        order: order.value,
      }),
    placeholderData: keepPreviousData,
  })

  return {
    quizList: computed(() => query.data.value?.list),
    total: computed(() => query.data.value?.total ?? 0),
    isFetching: query.isFetching,
    isLoading: query.isPending,
  }
}

// 问卷统计
export const useQuizStats = (quizId: Ref<string>) => {
  const query = useQuery({
    queryKey: ['quiz-stats', quizId],
    queryFn: () => getQuizStatsApi(quizId.value),
    enabled: !!quizId.value,
  })
  return {
    stats: query.data,
    isFetching: query.isFetching,
    isLoading: query.isPending,
  }
}

// 某道题的答题明细（分页）
export const useQuizAnswers = (
  quizId: Ref<string>,
  qIndex: Ref<number>,
  page: Ref<number>,
  pageSize: Ref<number>
) => {
  const query = useQuery({
    queryKey: ['quiz-answers', quizId, qIndex, page, pageSize],
    queryFn: () => getQuizAnswersApi(quizId.value, qIndex.value, page.value, pageSize.value),
    enabled: !!quizId.value && qIndex.value >= 0,
    placeholderData: keepPreviousData,
  })
  return {
    answers: query.data,
    isFetching: query.isFetching,
  }
}
