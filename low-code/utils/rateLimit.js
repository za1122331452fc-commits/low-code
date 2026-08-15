// 简单的内存限流工具（单进程场景够用，重启即清零）
// key: 例如 `${quizId}:${ip}`，windowMs 内只允许一次

const store = new Map()
const DEFAULT_WINDOW_MS = 5 * 60 * 1000 // 5 分钟

/**
 * 检查是否允许执行。允许时记录当前时间并返回 true；窗口内重复则返回 false。
 */
function allow(key, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now()
  const last = store.get(key)
  if (last && now - last < windowMs) {
    return false
  }
  store.set(key, now)

  // 定期清理过期条目，避免内存无限增长
  if (store.size > 10000) {
    for (const [k, t] of store) {
      if (now - t > windowMs) {
        store.delete(k)
      }
    }
  }
  return true
}

module.exports = { allow }
