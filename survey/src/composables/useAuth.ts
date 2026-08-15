// 用户身份认证
// composables/useAuth.ts
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { login as loginApi, getUserInfoApi, regist as registApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { loginRequest, registRequest, LoginData } from '@/types'
import { useRouter, useRoute } from 'vue-router'

// 模块级共享状态：所有 useAuth() 实例共用同一份，登录页写入、首页即可读到
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUser = ref<LoginData | null>(null)

export const useAuth = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const route = useRoute()

  // 查询用户信息（刷新/带 token 进入时同步到 currentUser）
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: getUserInfoApi,
    enabled: () => isLoggedIn.value && route.path !== '/login',
    staleTime: 1000 * 60 * 30, // 30分钟
    retry: 1,
  })

  watch(
    userQuery.data,
    (val) => {
      if (val) currentUser.value = val
    },
    { immediate: true }
  )

  // 登录成功后清空上一账号的用户级缓存（问卷列表/我的发布等按用户隔离）
  const clearUserScopedCache = () => {
    queryClient.removeQueries({ queryKey: ['surveys'] })
    queryClient.removeQueries({ queryKey: ['my-quizzes'] })
    queryClient.removeQueries({ queryKey: ['admin-surveys'] })
    queryClient.removeQueries({ queryKey: ['admin-users'] })
  }

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      isLoggedIn.value = true
      currentUser.value = res
      clearUserScopedCache()
      queryClient.setQueryData(['user'], res)
      ElMessage.success(`欢迎回来，${res.name}`)
      // 有来源页则跳回，否则回首页
      const redirect = route.query.redirect
      router.push(typeof redirect === 'string' && redirect ? redirect : '/')
    },
  })

  // 登出
  const logout = () => {
    // 立即置为未登录，userQuery 停用，不再拉取
    isLoggedIn.value = false
    currentUser.value = null
    // 清除token
    localStorage.removeItem('token')
    // 清空所有后端状态缓存，避免下一个登录用户看到上一个用户的数据
    queryClient.clear()
    ElMessage.success('已退出登录')
  }

  // 注册
  const registMutation = useMutation({
    mutationFn: registApi,
    onSuccess: (res) => {
      isLoggedIn.value = true
      currentUser.value = res
      clearUserScopedCache()
      queryClient.setQueryData(['user'], res)
      ElMessage.success(`恭喜您,${res.name},注册成功!`)
      router.push('/')
    },
  })

  const regist = (params: registRequest) => {
    return registMutation.mutateAsync(params)
  }

  const login = (params: loginRequest) => {
    return loginMutation.mutateAsync(params)
  }

  // 需要登录的操作守卫：未登录时提示并跳转登录页（浏览不拦截，仅写操作/生成问卷时调用）
  const requireLogin = () => {
    if (isLoggedIn.value) return true
    ElMessage.warning('请先登录后再操作')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }

  return {
    // 状态
    user: currentUser,
    isLoading: userQuery.isPending,
    isAuthenticated: computed(() => !!currentUser.value),

    // 登录
    login,
    loginPending: loginMutation.isPending,

    // 操作守卫
    requireLogin,

    // 登出
    logout,

    // 注册
    regist,
  }
}
