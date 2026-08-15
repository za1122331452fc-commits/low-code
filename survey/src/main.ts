import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 引入样式
import './assets/css/index.scss'
// ElMessage/ElMessageBox 是 JS 程序化调用，模板解析不到，需手动引入样式（否则提示框无样式）
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
// 渲染调试工具（测试用，确保 window.__renderDebug 总是可用）
import '@/utils/renderDebug'

// 引入 Font Awesome 图标库（只注册用到的图标，避免打包进全部 1300+ 图标）
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faRotateLeft,
  faRotateRight,
  faItalic,
  faAlignLeft,
  faAlignCenter,
  faFont,
  faHeading,
  faParagraph,
  faBold,
} from '@fortawesome/free-solid-svg-icons'

//引入 tanstack-query后端状态管理及工具
import { VueQueryPlugin } from '@tanstack/vue-query'
// 全局共享的 QueryClient（默认配置见 utils/queryClient.ts）
import { queryClient } from '@/utils/queryClient'

// 只注册实际用到的 solid 图标（Header 撤销/重做 + 编辑控件）
library.add(
  faRotateLeft,
  faRotateRight,
  faItalic,
  faAlignLeft,
  faAlignCenter,
  faFont,
  faHeading,
  faParagraph,
  faBold
)

const app = createApp(App)

// 注册 FontAwesomeIcon 组件
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)
// 后端状态管理全局配置（使用共享 QueryClient，非组件环境也能直接 import 操作缓存）
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')

// 空闲时预加载编辑器路由 chunk，优化首次进入编辑器（创建/编辑问卷）的加载速度：
// 提前下载并解析编辑器模块图，用户点击"创建问卷"时基本即时打开
const preloadEditor = () => {
  import('@/views/EditorView/Index.vue').catch(() => {})
}
if ('requestIdleCallback' in window) {
  const ric = window as Window & {
    requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number
  }
  ric.requestIdleCallback(preloadEditor, { timeout: 3000 })
} else {
  setTimeout(preloadEditor, 2000)
}
