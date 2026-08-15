// 管理员用户管理的后端状态（对齐 useSurvey 的写法）
// composables/useAdminUser.ts
import { ref, computed, type Ref } from 'vue'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import { getAdminUsersApi, setUserBlockApi, getUserStatsApi } from '@/api'

export const useAdminUser = (params?: {
  keyword?: Ref<string>
  page?: Ref<number>
  pageSize?: Ref<number>
  order?: Ref<'asc' | 'desc'>
}) => {
  const queryClient = useQueryClient()

  // 查询条件（外部 ref 变化即可驱动重新查询）
  const keyword = params?.keyword ?? ref('')
  const page = params?.page ?? ref(1)
  const pageSize = params?.pageSize ?? ref(10)
  const order = params?.order ?? ref<'asc' | 'desc'>('desc')

  // ============ 用户列表（后端分页 + 关键字搜索） ============
  const userListQuery = useQuery({
    queryKey: ['admin-users', keyword, page, pageSize, order],
    queryFn: () =>
      getAdminUsersApi({
        keyword: keyword.value.trim() || undefined,
        page: page.value,
        pageSize: pageSize.value,
        order: order.value,
      }),
    placeholderData: keepPreviousData,
  })

  const userList = computed(() => userListQuery.data.value?.list)
  const total = computed(() => userListQuery.data.value?.total ?? 0)

  // ============ 用户统计（总用户 / 今日新增 / 今日活跃） ============
  const statsQuery = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => getUserStatsApi(),
  })
  const stats = statsQuery.data

  // ============ 启用/禁用用户 ============
  const setBlockMutation = useMutation({
    mutationFn: (p: { id: number; isblock: number }) => setUserBlockApi(p.id, p.isblock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const setBlock = (id: number, isblock: number) => setBlockMutation.mutateAsync({ id, isblock })

  return {
    // 状态
    userList,
    total,
    stats,
    isFetching: userListQuery.isFetching,
    isLoading: userListQuery.isPending,

    // 操作
    setBlock,
    setBlockPending: setBlockMutation.isPending,
  }
}
