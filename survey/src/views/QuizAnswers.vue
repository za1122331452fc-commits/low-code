<template>
  <div class="answers-page">
    <Header :isEditor="false" />
    <div class="container" v-loading="isFetching">
      <h1 class="page-title font-weight-100">{{ answers?.title || '答题详情' }}</h1>
      <div class="answers-total">共 {{ answers?.total ?? 0 }} 条回答</div>

      <div v-if="answers" class="answers-list">
        <div v-if="!answers.list.length" class="q-empty">暂无回答</div>
        <div v-for="(item, i) in answers.list" :key="i" class="answer-item">
          <span class="idx">{{ startIndex + i + 1 }}.</span>
          <span class="text">{{ formatAnswer(item.answer) }}</span>
          <span class="time">{{ formatTime(item.time) }}</span>
        </div>
      </div>

      <div v-if="answers && answers.total" class="pagination-wrap">
        <DocsPagination v-model="page" :total="answers.total" :page-size="pageSize" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Common/Header.vue'
import DocsPagination from '@/components/Common/DocsPagination.vue'
import { useQuizAnswers } from '@/composables/useQuiz'

const route = useRoute()
const quizId = computed(() => String(route.params.id || ''))
const qIndex = computed(() => Number(route.params.qIndex))
const page = ref(1)
const pageSize = ref(10)

const { answers, isFetching } = useQuizAnswers(quizId, qIndex, page, pageSize)

const startIndex = computed(() => (page.value - 1) * pageSize.value)

function formatTime(t: number) {
  return new Date(t).toLocaleString('zh-CN')
}

function formatAnswer(raw: string) {
  if (answers.value?.name !== 'date-time') return raw
  const t = Date.parse(raw)
  if (Number.isNaN(t)) return raw
  const d = new Date(t)
  if (answers.value.type === 'year') return d.getFullYear() + '年'
  if (answers.value.type === 'month') return `${d.getFullYear()}年${d.getMonth() + 1}月`
  return d.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.answers-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 32px 56px;
}

.page-title {
  height: 50px;
  line-height: 50px;
  margin: 20px 0 0;
  font-size: 22px;
  color: #1f2328;
  text-align: center;
}

.answers-total {
  text-align: center;
  color: #6b7280;
  margin-bottom: 20px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  background: #fff;
  border: 1px solid #eceef1;
  border-radius: 6px;
  padding: 12px 16px;
}

.idx {
  font-weight: 700;
  color: #1f2328;
  flex-shrink: 0;
}

.text {
  flex: 1;
  color: #3c4043;
  word-break: break-all;
}

.time {
  color: #9ca3af;
  font-size: 12px;
  flex-shrink: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.q-empty {
  padding: 24px 0;
  text-align: center;
  color: #9ca3af;
}
</style>
