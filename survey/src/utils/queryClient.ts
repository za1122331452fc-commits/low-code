// utils/queryClient.ts
import { QueryClient } from '@tanstack/vue-query'

// 全局唯一的 QueryClient：
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据新鲜时间：10 分钟内复用缓存，过期后重新挂载时自动重新请求
      staleTime: 1000 * 60 * 10,
      // 垃圾回收时间 数据保存时间
      gcTime: 1000 * 60 * 40, // 40分钟
      // 重试次数
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
