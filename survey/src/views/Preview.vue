<template>
  <div ref="preview-container" class="preview-container pb-40">
    <div class="center mc">
      <div class="button-group flex space-between align-items-center">
        <div class="flex space-between no-print">
          <el-button type="danger" @click="gobackHandle">返回</el-button>
          <el-button type="success" @click="genQuiz">生成在线问卷</el-button>
          <el-button type="warning" @click="genPDF">生成本地PDF</el-button>
        </div>
        <div class="mr-15">
          <el-text class="mx-1">题目数量：{{ store.surveyCount }}</el-text>
        </div>
      </div>
      <div class="content-group no-border">
        <div v-if="surveyTitle" class="survey-title">{{ surveyTitle }}</div>
        <div class="content mb-10" v-for="(com, index) in store.coms" :key="index">
          <component :is="com.type" :status="com.status" :serialNum="serialNum[index]" />
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" title="信息" width="500">
    分享链接: <a :href="quizLink" target="_blank">{{ quizLink }}</a>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="goToStats">查看答题情况</el-button>
        <el-button type="primary" @click="copyLink">复制链接</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 离屏渲染的 PDF 答题卡视图（纸质排版：A/B/C/D 选项 + 细线输入框） -->
  <div v-if="pdfSheetRendered" ref="pdfSheet" class="pdf-sheet" aria-hidden="true">
    <div class="pdf-sheet-inner">
      <div v-for="(com, index) in store.coms" :key="index" class="pdf-question-block">
        <PdfQuestion :com="com" :serial-num="serialNum[index]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
// 路由
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()
// db
import { getSurveyById } from '@/db/operation'
// 工具
import { restoreComponentStatus, copyToClipboard } from '@/utils'
// API
import { publishQuizApi, getSurveyByIdApi } from '@/api'
// 引入 ElementPlus 库
import { ElMessage, ElLoading } from 'element-plus'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuth } from '@/composables/useAuth'
import { isUseForPDF } from '@/types'
// PDF 答题卡渲染 + 导出工具
import PdfQuestion from '@/components/SurveyComs/PdfComs/PdfQuestion.vue'
import { exportSurveyToPdf } from '@/utils/pdf'

// 获取路由参数
// 主要解决从主页点击查看问卷时的预览
const id = Number(route.params.id)
const surveyTitle = ref('') // 问卷标题（用于 PDF 文件名）
if (id) {
  getSurveyById(id).then(async (res) => {
    // 本地没有时（如管理员查看他人问卷）从服务器获取
    if (!res) {
      try {
        res = await getSurveyByIdApi(id)
      } catch {
        res = undefined
      }
    }
    if (res) {
      restoreComponentStatus(res.coms)
      store.setStore(res)
      surveyTitle.value = res.title
    }
  })
}
const scrollToTop = function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
onMounted(() => {
  scrollToTop()
})

// 组合式函数
import { useSurveyNo } from '@/utils/hooks'
// 获取题目编号
const serialNum = computed(() => useSurveyNo(store.coms).value)

const gobackHandle = () => {
  const path = history.state.from
  if (path === 'home') {
    router.back()
  } else {
    router.push(`/editor/${id}/survey-type`)
  }
}

// 生成PDF（纸质答题卡视图 + 逐题分页导出）
const pdfSheetRendered = ref(false)
const pdfSheet = ref<HTMLElement | null>(null)

async function genPDF() {
  // 问卷被管理员禁用时禁止生成本地 PDF
  if (id) {
    try {
      const fresh = await getSurveyByIdApi(id)
      if (fresh && fresh.isblock) {
        ElMessage({
          message: '该问卷已被禁用，无法生成本地PDF',
          type: 'warning',
        })
        return
      }
    } catch {
      // 查询失败不阻塞导出
    }
  }

  // 含有下拉评分/选择日期等不支持导出的组件时，禁止生成
  const checkResult = store.coms.every((item) => isUseForPDF(item.name))
  if (!checkResult) {
    ElMessage({
      message: '存在不支持PDF导出的组件，请先移除这些组件',
      type: 'warning',
    })
    return
  }
  if (!store.coms.length) return

  pdfSheetRendered.value = true
  const loading = ElLoading.service({ text: '正在生成 PDF...', fullscreen: true })
  try {
    // 等离屏视图渲染完成 + 系统字体就绪
    await nextTick()
    await (document.fonts ? document.fonts.ready : Promise.resolve())
    // 等图片加载完成
    await waitForPdfImages()

    const inner = pdfSheet.value?.querySelector('.pdf-sheet-inner') as HTMLElement | null
    const blocks = Array.from(
      pdfSheet.value?.querySelectorAll('.pdf-question-block') ?? []
    ) as HTMLElement[]

    // 文件名：问卷标题（过滤非法字符）+ 日期
    const safeTitle = (surveyTitle.value || '问卷').replace(/[\\/:*?"<>|]/g, '_')
    const filename = `${safeTitle}_${new Date().toISOString().slice(0, 10)}`
    await exportSurveyToPdf(inner as HTMLElement, blocks, filename)
    ElMessage({ message: 'PDF 已生成', type: 'success' })
  } catch (error) {
    console.error(error)
    ElMessage({ message: 'PDF 生成失败', type: 'error' })
  } finally {
    pdfSheetRendered.value = false
    loading.close()
  }
}

// 等待答题卡里的图片加载完成，避免导出时图片空白
function waitForPdfImages() {
  const imgs = Array.from(pdfSheet.value?.querySelectorAll('img') ?? []) as HTMLImageElement[]
  return Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            })
    )
  )
}

const dialogVisible = ref(false) // 控制弹窗
const quizLink = ref('') // 问卷链接
const currentQuizId = ref('') // 当前发布的 quizId
// 发布成功后失效“我的发布”列表缓存，切到该 tab 时重新拉取
const queryClient = useQueryClient()
const { requireLogin } = useAuth()
// 生成在线问卷（需要登录）
async function genQuiz() {
  if (!requireLogin()) return
  try {
    const res = await publishQuizApi({
      title: surveyTitle.value || '未命名问卷',
      coms: store.coms,
      surveyCount: store.surveyCount,
      surveyId: id || undefined,
    })
    currentQuizId.value = res.quizId
    quizLink.value = `${window.location.origin}/quiz/${res.quizId}`
    dialogVisible.value = true
    queryClient.invalidateQueries({ queryKey: ['my-quizzes'] })
    ElMessage({ message: '发布成功，链接已生成', type: 'success' })
  } catch {
    // 失败提示由请求拦截器统一处理
  }
}

// 跳转查看答题情况
function goToStats() {
  dialogVisible.value = false
  router.push(`/quiz/${currentQuizId.value}/stats`)
}

async function copyLink() {
  dialogVisible.value = false
  const ok = await copyToClipboard(quizLink.value)
  ElMessage({
    message: ok ? '链接已复制' : '复制失败，请手动复制链接',
    type: ok ? 'success' : 'warning',
  })
}
</script>

<style scoped lang="scss">
.preview-container {
  width: 100vw;
  min-height: 100vh;
  background: url('@/assets/imgs/editor_background.png');
}
.center {
  width: 800px;
}
.button-group {
  width: 100%;
  height: 60px;
  top: 0;
  left: 0;
  background-color: var(--white);
  z-index: 100;
}
.content-group {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: var(--white);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
@media print {
  .no-print {
    display: none;
  }
  .no-border {
    border: none;
    box-shadow: none;
  }
}

.survey-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2328;
  text-align: center;
  letter-spacing: -0.01em;
  margin: 0 0 24px;
}

/* ========== 离屏 PDF 答题卡视图 ========== */
.pdf-sheet {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 760px;
  padding: 20px;
  background: #fff;
  color: #1f2328;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.7;
}
.pdf-question-block {
  margin-bottom: 16px;
}
.pdf-sheet-inner {
  position: relative;
}
</style>
