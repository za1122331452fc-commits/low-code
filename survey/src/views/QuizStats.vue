<template>
  <div class="stats-page">
    <Header :isEditor="false" />
    <div class="container" v-loading="isLoading">
      <div class="stats-head">
        <div>
          <h1 class="page-title font-weight-100">{{ stats?.title || '问卷统计' }}</h1>
          <div class="stats-total">共 {{ stats?.total ?? 0 }} 份提交</div>
        </div>
        <el-button @click="router.back()">返回</el-button>
      </div>

      <div v-if="stats" class="question-list">
        <div v-for="q in stats.questions" :key="q.index" class="question-card">
          <!-- 备注说明：仅作上下文展示 -->
          <div v-if="q.type === 'note'" class="q-note">{{ q.title }}</div>

          <!-- 选择题：每个选项一条占比条，纵向排列 -->
          <div v-else-if="q.type === 'choice'" class="q-stats">
            <div class="q-head">
              <span class="q-serial">{{ serialOf(q.index) }}.</span>
              <span class="q-title">{{ q.title }}</span>
              <span class="q-meta">{{ q.answered }} 人作答</span>
            </div>

            <div v-if="q.options && q.options.length" class="option-bars">
              <div v-for="(opt, i) in q.options" :key="i" class="option-bar-row">
                <div class="opt-label">
                  <img v-if="opt.image" :src="opt.image" :alt="opt.label" class="opt-img" />
                  <span class="opt-text">{{ letter(i) }}. {{ opt.label }}</span>
                </div>
                <div class="bar-track">
                  <el-tooltip :content="`${opt.count} 人 · ${opt.percent}%`" placement="top">
                    <div
                      class="bar-fill"
                      :style="{
                        width: segWidth(opt, q.options) + '%',
                        backgroundColor: palette[i % palette.length],
                      }"
                    ></div>
                  </el-tooltip>
                </div>
                <span class="opt-count">{{ opt.count }} 人 · {{ opt.percent }}%</span>
              </div>
              <div v-if="maxCount(q.options) === 0" class="bar-empty-text">暂无作答</div>
            </div>
            <div v-else class="q-empty">暂无选项</div>
          </div>

          <!-- 文本题：答题详情入口 -->
          <div v-else class="q-stats">
            <div class="q-head">
              <span class="q-serial">{{ serialOf(q.index) }}.</span>
              <span class="q-title">{{ q.title }}</span>
              <span class="q-meta">{{ q.answered }} 份有效作答</span>
            </div>
            <div class="q-text-actions">
              <el-button size="small" @click="goAnswers(q.index)">答题详情</el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading" class="q-empty">暂无数据或问卷不存在</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '@/components/Common/Header.vue'
import { useQuizStats } from '@/composables/useQuiz'
import type { QuizOptionStat } from '@/types'

const route = useRoute()
const router = useRouter()
const quizId = computed(() => String(route.params.id || ''))
const { stats, isLoading } = useQuizStats(quizId)

const palette = [
  '#3451b2',
  '#2f9e44',
  '#e67700',
  '#e03131',
  '#7048e8',
  '#0ca678',
  '#f08c00',
  '#c2255c',
]

// 题号（备注不计号）
function serialOf(index: number) {
  if (!stats.value) return ''
  let n = 0
  for (let i = 0; i <= index; i++) {
    if (stats.value.questions[i] && stats.value.questions[i].type !== 'note') n++
  }
  return String(n).padStart(2, '0')
}

function maxCount(options: QuizOptionStat[]) {
  return options.reduce((m, o) => Math.max(m, o.count), 0)
}

function segWidth(opt: QuizOptionStat, options: QuizOptionStat[]) {
  const max = maxCount(options)
  if (max <= 0) return 0
  return Math.max(0.5, (opt.count / max) * 100)
}

function letter(i: number) {
  if (i < 26) return String.fromCharCode(65 + i)
  return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))
}

function goAnswers(index: number) {
  router.push(`/quiz/${route.params.id}/question/${index}`)
}
</script>

<style scoped>
.stats-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 32px 56px;
}

.stats-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 20px 0;
}

.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: #1f2328;
  letter-spacing: -0.01em;
}

.stats-total {
  color: #6b7280;
  font-size: 14px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.question-card {
  background: #fff;
  border: 1px solid #eceef1;
  border-radius: 8px;
  padding: 20px 24px;
}

.q-note {
  color: #9ca3af;
  font-style: italic;
  white-space: pre-wrap;
  word-break: break-word;
}

.q-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.q-serial {
  font-weight: 700;
  color: #1f2328;
}

.q-title {
  font-weight: 600;
  color: #1f2328;
  flex: 1;
}

.q-meta {
  color: #9ca3af;
  font-size: 12px;
  flex-shrink: 0;
}

/* 每个选项一条占比条，纵向排列 */
.option-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.option-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.opt-label {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #3c4043;
}
.opt-img {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.opt-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  flex: 1;
  height: 14px;
  border-radius: 3px;
  background: #f0f1f4;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
}

.opt-count {
  width: 110px;
  flex-shrink: 0;
  text-align: right;
  font-size: 12px;
  color: #6b7280;
}

.bar-empty-text {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
}

.q-text-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.q-empty {
  padding: 24px 0;
  text-align: center;
  color: #9ca3af;
}
</style>
