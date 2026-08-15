<template>
  <div>
    <div class="header">
      <Header :isEditor="true" :id="id" />
    </div>
    <div class="container">
      <LeftSide />
      <RightSide />
    </div>
    <div class="canvas-area">
      <Center />
    </div>
    <!-- 加载指示器：固定居中、不拦截点击，保证一定可见 -->
    <div v-if="isLoading" class="loading-mask">
      <div class="loading-box">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span class="loading-text" v-if="totalCount > 0">加载中 {{ loadProgress }}/{{ totalCount }}</span>
        <span class="loading-text" v-else>加载中…</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useMagicKeys, whenever } from '@vueuse/core'
// db
import { getSurveyById } from '@/db/operation'
import { db } from '@/db/db'
import { getSurveyByIdApi } from '@/api'
import Header from '@/components/Common/Header.vue'
import LeftSide from './LeftSide/Index.vue'
import Center from './Center.vue'
import RightSide from './RightSide.vue'
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()
store.initStore() // 先初始化一次状态，保证进入编辑器时有初始状态
import { useHistoryStore, snapshotCom } from '@/stores/useHistory'
const historyStore = useHistoryStore()
historyStore.clear()
// 路由
import { useRoute } from 'vue-router'
const route = useRoute()
// 工具
import { restoreComponentStatus } from '@/utils'
// 数据仓库更新方法
import { dispatchStatus } from '@/stores/dispatch'
// 类型
import type { UpdateStatus, TypeStatus, OptionsStatus, GetLink, PicLink } from '@/types'

// 加载动画状态
const isLoading = ref(false)
const loadProgress = ref(0)
const totalCount = ref(0)

async function loadSurvey(surveyId: number) {
  isLoading.value = true
  // 安全兜底：无论加载是否完成，最迟 8s 后隐藏加载遮罩，避免卡死挡住操作
  const loadingGuard = setTimeout(() => {
    isLoading.value = false
  }, 8000)
  let res: Awaited<ReturnType<typeof getSurveyById>>
  res = await getSurveyById(surveyId)
  if (!res) {
    // 如果本地获取不到，则从服务器中获取
    try {
      res = await getSurveyByIdApi(surveyId)
      if (res) {
        db.surveys.put({ ...res } as never).catch(() => {})
      }
    } catch (e) {
      console.warn('[加载] 本地与服务器均无该问卷:', e)
    }
  }
  if (!res) {
    isLoading.value = false
    clearTimeout(loadingGuard)
    return
  }
  restoreComponentStatus(res.coms)
  // 分片渲染
  const BATCH = 10
  const coms = res.coms || []
  const total = coms.length
  totalCount.value = total
  if (total > BATCH) {
    store.setStore({ ...res, coms: coms.slice(0, BATCH) })
    historyStore.clear()
    loadProgress.value = BATCH
    let index = BATCH
    const appendRest = () => {
      if (index >= total) {
        isLoading.value = false
        clearTimeout(loadingGuard)
        return
      }
      const next = coms.slice(index, index + BATCH)
      store.coms.push(...next)
      index += BATCH
      loadProgress.value = index
      requestAnimationFrame(appendRest)
    }
    requestAnimationFrame(appendRest)
  } else {
    store.setStore(res)
    historyStore.clear()
    loadProgress.value = total
    isLoading.value = false
    clearTimeout(loadingGuard)
  }
  await nextTick()
}

// 如果有传递过来 id，就从对应数据源获取数据来初始化仓库
const id = computed(() => (route.params.id ? String(route.params.id) : undefined))
if (id.value) {
  loadSurvey(Number(id.value))
}
// ==================== 加载耗时打点结束 ====================
// 向子组件提供修改状态的方法
const updateStatus: UpdateStatus = (
  configKey: string,
  payload?: number | string | boolean | object,
  isShowChange?: boolean,
) => {
  // 如果没有选中组件，不执行
  if (store.currentComponentIndex === -1) {
    ElMessage({
      message: '请先将组件处于编辑状态',
      type: 'warning',
    })
    return
  }
  const comIndex = store.currentComponentIndex
  // 修改前先拍快照（克隆组件并保留 editCom 引用）
  const prevCom = snapshotCom(store.coms[comIndex])
  const status = store.coms[store.currentComponentIndex].status as unknown as
    | TypeStatus
    | OptionsStatus
  dispatchStatus(store, status, configKey, payload, isShowChange)
  historyStore.recordUpdate(comIndex, prevCom)
}
provide('updateStatus', updateStatus)
const getPicLink: GetLink = (link: PicLink) => {
  // 拿到上传的链接地址，从而更新状态仓库
  updateStatus('options', link)
}
provide('getPicLink', getPicLink)

// 快捷键
const keys = useMagicKeys()
// 撤销：Ctrl+Z / Cmd+Z
whenever(keys['ctrl+z'], () => historyStore.undo())
whenever(keys['meta+z'], () => historyStore.undo())
// 重做：Ctrl+Y / Cmd+Y
whenever(keys['ctrl+y'], () => historyStore.redo())
whenever(keys['meta+y'], () => historyStore.redo())
// 删除：Backspace
whenever(keys['backspace'], () => {
  if (store.currentComponentIndex === -1) return
  const activeEl = document.activeElement
  if (
    activeEl &&
    (activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable)
  ) {
    return
  }
  const index = store.currentComponentIndex
  historyStore.recordDelete(index, store.coms[index])
  store.removeCom(index)
  store.setCurrentComponentIndex(-1)
})
</script>

<style scoped lang="scss">
.header {
  width: 100%;
  background-color: var(--white);
  position: fixed;
  top: 0;
  z-index: 10;
}
.container {
  width: calc(100vw - 40px);
  padding: 20px;
  // Header的高度50px，上下padding 20px
  height: calc(100vh - 50px - 40px);
  background: url('@/assets/imgs/editor_background.png');
  position: fixed;
  top: 50px;
}
/* canvas-area 保持普通静态定位，避免全宽盒子盖住左侧/右侧固定面板 */
/* 加载指示器：固定居中，pointer-events:none 不拦截任何点击/滚动 */
.loading-mask {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}
.loading-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);
  color: var(--font-color-base);
  font-size: 16px;
  border: 1px solid var(--border-color);
}
.loading-icon {
  font-size: 24px;
  animation: loading-rotate 1s linear infinite;
}
@keyframes loading-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
