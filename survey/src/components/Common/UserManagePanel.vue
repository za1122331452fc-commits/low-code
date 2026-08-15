<template>
  <div class="panel-root">
    <!-- 用户统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num stat-new">{{ stats?.todayNew ?? 0 }}</div>
        <div class="stat-label">今日新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-active">{{ stats?.todayActive ?? 0 }}</div>
        <div class="stat-label">今日活跃</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-total">{{ stats?.total ?? 0 }}</div>
        <div class="stat-label">总用户</div>
      </div>
    </div>

    <div class="tool-bar">
      <el-input
        v-model="keyword"
        placeholder="按用户名 / 昵称 / ID 搜索"
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
      :data="userList"
      style="width: 100%"
      empty-text="暂无用户"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="loginId" label="用户名" />
      <el-table-column prop="name" label="昵称" />
      <el-table-column label="角色" width="110">
        <template #default="scope">
          {{ scope.row.roleId === 10 ? '管理员' : '普通用户' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <span :class="scope.row.isblock === 20 ? 'text-danger' : 'text-success'">
            {{ scope.row.isblock === 20 ? '已禁用' : '正常' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="110">
        <template #default="scope">
          <el-button
            size="small"
            :type="scope.row.isblock === 20 ? 'success' : 'danger'"
            :disabled="scope.row.roleId === 10"
            @click="handleToggleBlock(scope.row as AdminUserItem)"
          >
            {{ scope.row.isblock === 20 ? '启用' : '禁用' }}
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
import { ElMessage } from 'element-plus'
import DocsPagination from '@/components/Common/DocsPagination.vue'
import { useAdminUser } from '@/composables/useAdminUser'
import type { AdminUserItem } from '@/types'

const keyword = ref('') // 输入框内容
const searchKeyword = ref('') // 实际生效的关键字（点查询/回车才生效）
const currentPage = ref(1)
const pageSize = ref(10)
const order = ref<'asc' | 'desc'>('desc')

const { userList, total, stats, isFetching, setBlock } = useAdminUser({
  keyword: searchKeyword,
  page: currentPage,
  pageSize,
  order,
})

const isLoading = computed(() => isFetching.value && !userList.value)

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

// 搜索后当前页可能超出总页数，自动回收
watch(total, (val) => {
  const totalPages = Math.max(1, Math.ceil(val / pageSize.value))
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages
  }
})

const handleToggleBlock = async (row: AdminUserItem) => {
  try {
    const wasBlocked = row.isblock === 20
    await setBlock(row.id, wasBlocked ? 10 : 20)
    ElMessage.success(wasBlocked ? '已启用该用户' : '已禁用该用户')
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

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  background: #ffffff;
  border: 1px solid #f0f1f4;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(26, 58, 92, 0.04);
  transition: all 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(26, 58, 92, 0.08);
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-new {
  color: #1a3a5c;
}
.stat-active {
  color: #2c5f7c;
}
.stat-total {
  color: #1a1a1a;
}
.stat-label {
  font-size: 13px;
  color: #999999;
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
