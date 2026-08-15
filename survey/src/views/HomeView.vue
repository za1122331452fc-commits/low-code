<template>
  <HomeLayout>
    <div class="mb-15 toolbar">
      <el-button class="btn-primary" :icon="Plus" @click="goToEditor">创建问卷</el-button>
      <el-button class="btn-secondary" :icon="Compass" @click="goToComMarket">组件市场</el-button>
      <el-select v-model="order" class="order-select" placeholder="时间排序">
        <el-option label="最新" value="desc" />
        <el-option label="最旧" value="asc" />
      </el-select>
      <el-input
        v-model="keyword"
        class="search-input"
        placeholder="按问卷标题搜索"
        :prefix-icon="Search"
        clearable
      />
    </div>
    <el-table
      v-loading="isLoading"
      element-loading-text="正在加载问卷列表..."
      :data="surveyList"
      style="width: 100%"
    >
      <template #empty>
        <div class="table-empty">
          <svg
            class="empty-icon"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="#cbd5e1"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="10" y="6" width="28" height="36" rx="3" />
            <path d="M17 15h14M17 22h14M17 29h8" />
          </svg>
          <div class="empty-title">暂无问卷</div>
          <div class="empty-desc">点击「+ 创建问卷」开始设计你的第一份问卷</div>
        </div>
      </template>
      <el-table-column
        fixed
        prop="createDate"
        label="创建日期"
        width="150"
        :formatter="formatDate"
      />
      <el-table-column prop="title" label="问卷标题">
        <template #default="scope">
          <span>{{ scope.row.title }}</span>
          <el-tag v-if="scope.row.isblock" size="small" type="danger" class="ml-5">已禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="surveyCount" label="题目数" width="150" align="center" />
      <el-table-column
        prop="updateDate"
        label="最近更新日期"
        width="150"
        align="center"
        :formatter="formatDate"
      />
      <el-table-column fixed="right" label="操作" width="300" align="center">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="viewSurvey(scope.row as SurveyDBReturnData)"
            >查看问卷</el-button
          >
          <el-button link type="primary" size="small" @click="editSurvey(scope.row as SurveyDBReturnData)"
            >编辑</el-button
          >
          <el-button link class="danger-link" size="small" @click="delSurvey(scope.row as SurveyDBReturnData)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div v-if="total" class="pagination-wrap">
      <DocsPagination v-model="currentPage" :total="total" :page-size="pageSize" />
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { Plus, Compass, Search } from '@element-plus/icons-vue'
// 路由
import { useRouter } from 'vue-router'
// 问卷后端状态管理（列表缓存 + 删除 mutation）
import { useSurvey } from '@/composables/useSurvey'
// 公共布局
import HomeLayout from '@/components/Common/HomeLayout.vue'
// 分页组件（三角箭头 + 中间可编辑页码）
import DocsPagination from '@/components/Common/DocsPagination.vue'
// 类型
import type { SurveyDBReturnData } from '@/types'
// 工具方法
import { formatDate } from '@/utils'
import { remove } from '@/utils/dboperate'

const router = useRouter()

// ============ 查询条件（分页/搜索/排序都在后端完成） ============
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const order = ref<'asc' | 'desc'>('desc')

// ============ 问卷列表（useSurvey 统一管理后端状态） ============
const { surveyList, total, isFetching, deleteSurvey } = useSurvey({
  keyword,
  page: currentPage,
  pageSize,
  order,
})

// 仅首次加载（无数据时）显示加载动画；翻页/搜索切换时保留上一份数据，不闪烁
const isLoading = computed(() => isFetching.value && !surveyList.value)

// 搜索防抖 300ms，搜索时回到第一页（queryKey 变化会自动重新请求后端）
watchDebounced(
  keyword,
  () => {
    currentPage.value = 1
  },
  { debounce: 300 }
)

// 切换排序时回到第一页
watch(order, () => {
  currentPage.value = 1
})

// 当前页超出总页数时（删除/翻页后）回收到最后一页
watch(total, (val) => {
  const totalPages = Math.max(1, Math.ceil(val / pageSize.value))
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages
  }
})

// ============ 页面跳转 ============
const goToEditor = () => {
  localStorage.setItem('activeView', 'editor')
  router.push('/editor/survey-type')
}

const goToComMarket = () => {
  localStorage.setItem('activeView', 'materials')
  router.push('/materials')
}

const viewSurvey = (surveyInfo: SurveyDBReturnData) => {
  router.push({
    path: `/preview/${surveyInfo.id}`,
    state: { from: 'home' },
  })
}

const editSurvey = (surveyInfo: SurveyDBReturnData) => {
  router.push(`/editor/${surveyInfo.id}/survey-type`)
}

const delSurvey = (surveyInfo: SurveyDBReturnData) => {
  // deleteSurvey（useSurvey）内部删除成功后会 invalidateQueries(['surveys'])，列表自动刷新
  remove(Number(surveyInfo.id), deleteSurvey)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

/* 主按钮（视觉核心）：深藏蓝渐变 */
.btn-primary {
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
  border: none;
  color: #ffffff;
  font-weight: 600;
  font-size: 15px;
  border-radius: 8px;
  padding: 11px 22px;
  box-shadow: 0 1px 8px rgba(15, 41, 66, 0.14);
  transition: all 0.3s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(15, 41, 66, 0.22);
  color: #ffffff;
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
}
.btn-primary:active {
  transform: translateY(0);
}

/* 次要按钮：白底细边框，视觉弱一级 */
.btn-secondary {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-weight: 500;
  border-radius: 8px;
  padding: 11px 18px;
  transition: all 0.3s ease;
}
.btn-secondary:hover {
  background: #f8fafc;
  color: #0f2942;
  border-color: #cbd5e1;
}
.btn-secondary:active {
  transform: translateY(0);
}

/* 表格内危险操作（柔和红） */
.danger-link {
  color: #e74c6f !important;
}
.danger-link:hover {
  color: #d63a5e !important;
}

.search-input {
  width: 260px;
  margin-left: auto;
}

.order-select {
  width: 110px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 20px 4px 0;
  flex-shrink: 0;
}

/* 空状态：通透，直接平铺在浅灰背景上 */
.table-empty {
  padding: 64px 0;
  text-align: center;
}
.empty-icon {
  margin-bottom: 16px;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}
.empty-desc {
  font-size: 13px;
  color: #94a3b8;
}
</style>
