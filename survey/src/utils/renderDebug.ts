// 渲染调试工具（测试用，可随时删除）
// 用法（浏览器控制台）：
//   __renderDebug()   打印并重置计数
//   __renderReset()   只重置计数
let total = 0
const byName: Record<string, number> = {}

export function renderTick(name: string) {
  total++
  byName[name] = (byName[name] || 0) + 1
}

const win = window as unknown as Record<string, unknown>
win.__renderDebug = () => {
  console.log(`[渲染] 本次累计渲染 ${total} 次`)
  console.table(byName)
  total = 0
  for (const k in byName) delete byName[k]
}
win.__renderReset = () => {
  total = 0
  for (const k in byName) delete byName[k]
}
