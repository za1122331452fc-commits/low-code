<template>
  <div class="panel-root">
    <div class="tool-bar">
      <el-input
        v-model="keyword"
        placeholder="按问卷标题 / 所有者搜索"
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
      :data="surveyList"
      style="width: 100%"
      empty-text="暂无问卷"
    >
      <el-table-column label="问卷标题" min-width="200">
        <template #default="scope">
          <span>{{ scope.row.title }}</span>
          <el-tag v-if="scope.row.isblock" size="small" type="danger" class="ml-5">已禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所有者" width="140">
        <template #default="scope">
          {{ scope.row.ownerName || scope.row.ownerLoginId }}
        </template>
      </el-table-column>
      <el-table-column prop="surveyCount" label="题目数" width="90" align="center" />
      <el-table-column label="更新时间" width="160">
        <template #default="scope">
          {{ formatTime(scope.row.updateDate) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <span :class="scope.row.isblock ? 'text-danger' : 'text-success'">
            {{ scope.row.isblock ? '已禁用' : '正常' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" align="center">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="viewSurvey(scope.row as AdminSurveyItem)"
            >访问</el-button
          >
          <el-button
            link
            size="small"
            :type="scope.row.isblock ? 'success' : 'danger'"
            @click="handleToggleBlock(scope.row as AdminSurveyItem)"
          >
            {{ scope.row.isblock ? '启用' : '禁用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="total" class="pagination-wrap">
      <DocsPagination v-model="currentPage" :total="total" :page-size="pageSize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DocsPagination from '@/components/Common/DocsPagination.vue'
import { useAdminSurvey } from '@/composables/useAdminSurvey'
import type { AdminSurveyItem } from '@/types'

const router = useRouter()

const keyword = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const order = ref<'asc' | 'desc'>('desc')

const { surveyList, total, isFetching, setBlock } = useAdminSurvey({
  keyword: searchKeyword,
  page: currentPage,
  pageSize,
  order,
})

const isLoading = computed(() => isFetching.value && !surveyList.value)

const handleSearch = () => {
  searchKeyword.value = keyword.value
  currentPage.value = 1
}

const resetSearch = () => {
  keyword.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
}

// 切换排序回到第一页
watch(order, () => {
  currentPage.value = 1
})

watch(total, (val) => {
  const totalPages = Math.max(1, Math.ceil(val / pageSize.value))
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages
  }
})

function formatTime(t: number) {
  return new Date(t).toLocaleString('zh-CN')
}

// 访问：跳转预览页（只读查看，不能修改）
function viewSurvey(row: AdminSurveyItem) {
  router.push({
    path: `/preview/${row.id}`,
    state: { from: 'home' },
  })
}

const handleToggleBlock = async (row: AdminSurveyItem) => {
  try {
    await setBlock(row.id, !row.isblock)
    ElMessage.success(row.isblock ? '已启用该问卷' : '已禁用该问卷')
  } catch {
    // 失败提示由请求拦截器统一处理
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

.pagination-wrap {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.text-success {
  color: #2f9e44;
}

.text-danger {
  color: #e03131;
}
</style>
