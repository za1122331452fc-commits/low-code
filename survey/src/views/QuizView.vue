<template>
  <div v-if="quizData">
    <div class="quiz-container mc">
      <!-- 问卷已被管理员禁用 -->
      <div v-if="quizData.disabled" class="disabled-tip">
        <el-result icon="warning" title="问卷已停用" sub-title="该问卷已被管理员禁用，暂时无法作答" />
      </div>

      <template v-else>
        <div v-if="quizData.title" class="quiz-title">{{ quizData.title }}</div>
        <div class="mt-15 mb-20">题目数量：{{ quizData.surveyCount }}</div>
        <div class="content mb-10" v-for="(com, index) in quizData.coms" :key="index" :data-serial="serialNum[index]">
          <component
            :is="com.type"
            :status="com.status"
            :serialNum="serialNum[index]"
            @updateAnswer="updateAnswer(index, $event)"
          />
        </div>
        <div class="mt-20 mb-20 text-center">
          <el-result
            v-if="submitted"
            icon="success"
            title="已提交"
            sub-title="感谢您的作答，问卷已提交成功"
          />
          <el-button
            v-else
            type="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="submitAnswers"
          >
            提交答案
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive, provide, nextTick } from 'vue'
import type { Ref } from 'vue'
import type { QuizData } from '@/types'
// 工具
import { restoreComponentStatus } from '@/utils'
// 组合式函数
import { useSurveyNo } from '@/utils/hooks'
// 引入 ElementPlus 库
import { ElMessage } from 'element-plus'
// 路由
import { useRoute } from 'vue-router'
const route = useRoute()

const quizData = ref<QuizData>({
  coms: [],
  surveyCount: 0,
})
// 用于存储所有问题的答案
const answers: Ref<{ [key: number]: string | number | Date }> = ref({})
// 防连点 + 已提交状态（同浏览器只允许提交一次）
const submitting = ref(false)
const submitted = ref(false)
// 未作答题号集合：提供给各题目组件，未作答的题目标题前显示红色 *
const unansweredSerials = reactive(new Set<number>())
provide('quizUnanswered', unansweredSerials)
// 获取题目编号
const serialNum = computed(() => useSurveyNo(quizData.value?.coms).value)

// 判断某题是否已回答
function isAnswered(serial: number) {
  const v = answers.value[serial]
  if (v === undefined || v === null) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  return true
}

// 重新统计未作答的题（备注说明不计号，无需作答）
function refreshUnanswered() {
  unansweredSerials.clear()
  const coms = quizData.value?.coms || []
  for (let i = 0; i < coms.length; i++) {
    const serial = serialNum.value[i]
    if (serial !== null && !isAnswered(serial)) {
      unansweredSerials.add(serial)
    }
  }
}

onMounted(async () => {
  const quizId = route.params.id
  // 同浏览器已提交过则直接展示结果
  submitted.value = localStorage.getItem(`quiz_submitted_${quizId}`) === '1'
  // 公开接口获取在线问卷（无需登录）
  const response = await fetch(`/api/quiz/${quizId}`)
  const json = await response.json()
  const data = json && json.data
  if (!data || !data.coms) {
    ElMessage.error('问卷不存在或已失效')
    return
  }
  restoreComponentStatus(data.coms)
  quizData.value = data
  refreshUnanswered()
})

const updateAnswer = (index: number, answer: string | number | Date) => {
  // index是题目本来的索引，通过serialNum.value[index]获取显示的题目索引
  // 检查 serialNum.value[index] 是否为 null
  const serial = serialNum.value[index]
  if (serial !== null) {
    answers.value[serial] = answer
  } else {
    // 处理 serialNum.value[index] 为 null 的情况
    console.error(`The serial number at index ${index} is null.`)
  }
  refreshUnanswered()
}

const submitAnswers = async () => {
  if (submitting.value || submitted.value) return
  const quizId = route.params.id
  refreshUnanswered()
  if (unansweredSerials.size > 0) {
    ElMessage.warning(`还有 ${unansweredSerials.size} 道题未作答，请完成后再提交`)
    scrollToUnanswered()
    return
  }
  submitting.value = true
  try {
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers: answers.value }),
    })
    const json = await res.json()
    if (json && json.code === 200) {
      // 同浏览器标记为已提交，防止重复提交
      localStorage.setItem(`quiz_submitted_${quizId}`, '1')
      submitted.value = true
      ElMessage({
        message: '答案已提交',
        type: 'success',
      })
    } else {
      ElMessage({
        message: (json && json.msg) || '提交失败，请稍后再试',
        type: 'warning',
      })
    }
  } catch {
    ElMessage({
      message: '网络异常，请稍后重试',
      type: 'error',
    })
  } finally {
    submitting.value = false
  }
}

// 滚动到第一道未作答的题
async function scrollToUnanswered() {
  const first = unansweredSerials.values().next().value
  if (first === undefined) return
  await nextTick()
  const els = document.querySelectorAll<HTMLElement>('[data-serial]')
  for (const el of els) {
    if (Number(el.getAttribute('data-serial')) === first) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      break
    }
  }
}
</script>

<style scoped lang="scss">
.quiz-container {
  width: 800px;
}

.quiz-title {
  margin-top: 24px;
  font-size: 22px;
  font-weight: 700;
  color: #1f2328;
  text-align: center;
  letter-spacing: -0.01em;
}

.disabled-tip {
  padding: 40px 0;
}
</style>
