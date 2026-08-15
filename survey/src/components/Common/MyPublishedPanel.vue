<template>
  <div class="panel-root">
    <div class="tool-bar">
      <el-input
        v-model="keyword"
        placeholder="按问卷标题搜索"
        style="width: 280px"
        clearable
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-select v-model="order" class="order-select" placeholder="时间排序">
        <el-option label="最新" value="desc" />
        <el-option label="最旧" value="asc" />
      </el-select>
    </div>

    <el-table
      v-loading="isLoading"
      :data="quizList"
      style="width: 100%"
      empty-text="还没有发布过在线问卷"
    >
      <el-table-column prop="title" label="问卷标题" min-width="180" />
      <el-table-column prop="surveyCount" label="题目数" width="80" align="center" />
      <el-table-column prop="answerCount" label="提交数" width="90" align="center" />
      <el-table-column label="在线答题链接" min-width="240">
        <template #default="scope">
          <div class="link-cell">
            <el-link
              type="primary"
              :href="quizUrl(scope.row.quizId)"
              target="_blank"
              :underline="false"
              class="quiz-link"
            >
              {{ quizUrl(scope.row.quizId) }}
            </el-link>
            <el-button link type="primary" size="small" @click="copyQuizLink(scope.row as MyQuizItem)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="scope">
          {{ formatTime(scope.row.createDate) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="goStats(scope.row as MyQuizItem)"
            >查看统计</el-button
          >
          <el-button link size="small" @click="openQuiz(scope.row as MyQuizItem)"
            >打开问卷</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div v-if="total" class="pagination-wrap">
      <DocsPagination v-model="page" :total="total" :page-size="pageSize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import DocsPagination from '@/components/Common/DocsPagination.vue'
import { useMyQuizzes } from '@/composables/useQuiz'
import { copyToClipboard } from '@/utils'
import type { MyQuizItem } from '@/types'

const router = useRouter()

const keyword = ref('') // 输入框内容
const searchKeyword = ref('') // 实际生效的关键字（点查询/回车才生效）
const page = ref(1)
const pageSize = ref(10)
const order = ref<'asc' | 'desc'>('desc')
const { quizList, total, isLoading } = useMyQuizzes({
  keyword: searchKeyword,
  page,
  pageSize,
  order,
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  page.value = 1
}

const resetSearch = () => {
  keyword.value = ''
  searchKeyword.value = ''
  page.value = 1
}

// 切换排序回到第一页
watch(order, () => {
  page.value = 1
})

// 页码越界自动回收
watch(total, (val) => {
  const totalPages = Math.max(1, Math.ceil(val / pageSize.value))
  if (page.value > totalPages) {
    page.value = totalPages
  }
})

function formatTime(t: number) {
  return new Date(t).toLocaleString('zh-CN')
}

function goStats(row: MyQuizItem) {
  router.push(`/quiz/${row.quizId}/stats`)
}

function openQuiz(row: MyQuizItem) {
  window.open(`${window.location.origin}/quiz/${row.quizId}`, '_blank')
}

function quizUrl(quizId: string) {
  return `${window.location.origin}/quiz/${quizId}`
}

async function copyQuizLink(row: MyQuizItem) {
  const ok = await copyToClipboard(quizUrl(row.quizId))
  if (ok) {
    ElMessage.success('在线答题链接已复制')
  } else {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}
</script>

<style scoped>
.panel-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tool-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.order-select {
  width: 110px;
}

.link-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.quiz-link {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-wrap {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
