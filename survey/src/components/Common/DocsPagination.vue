<template>
  <div class="pager">
    <button
      class="page-btn arrow arrow-prev"
      :disabled="currentPage <= 1"
      aria-label="上一页"
      @click="changePage(currentPage - 1)"
    ></button>
    <div class="page-jump">
      <el-input
        v-model.number="pageInput"
        class="page-input"
        size="small"
        @change="onPageInputChange"
      />
      <span class="page-slash">/</span>
      <span class="page-total-pages">{{ totalPages }}</span>
    </div>
    <button
      class="page-btn arrow arrow-next"
      :disabled="currentPage >= totalPages"
      aria-label="下一页"
      @click="changePage(currentPage + 1)"
    ></button>
    <span class="page-count">共 {{ total }} 条</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  /** 总条数 */
  total: number
  /** 每页条数 */
  pageSize: number
  /** 当前页（v-model） */
  modelValue: number
}>()
const emit = defineEmits<{ (e: 'update:modelValue', page: number): void }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const pageInput = ref(props.modelValue)

const currentPage = computed(() => props.modelValue)

// 外部页码变化（搜索回页首/越界回收）时同步输入框
watch(
  () => props.modelValue,
  (val) => {
    pageInput.value = val
  }
)

function changePage(p: number) {
  if (p < 1) p = 1
  if (p > totalPages.value) p = totalPages.value
  emit('update:modelValue', p)
}

// 中间页码输入后跳转（回车或失焦触发）
function onPageInputChange() {
  let p = Math.round(Number(pageInput.value))
  if (!Number.isFinite(p) || p < 1) p = 1
  if (p > totalPages.value) p = totalPages.value
  pageInput.value = p
  emit('update:modelValue', p)
}
</script>

<style scoped>
.pager {
  display: inline-flex;
  align-items: center;
}

.page-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  background: #ffffff;
  color: #4a4a4a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.3s,
    color 0.3s,
    background-color 0.3s,
    transform 0.3s;
}
.page-btn:hover:not(:disabled) {
  border-color: #1a3a5c;
  color: #1a3a5c;
  background: #f0f4f9;
  transform: translateY(-1px);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 实心三角形箭头 */
.arrow::before {
  content: '';
  width: 0;
  height: 0;
}
.arrow-prev::before {
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-right: 8px solid currentColor;
}
.arrow-next::before {
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid currentColor;
}

.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 12px;
  color: #999999;
}
.page-input {
  width: 56px;
}
.page-slash {
  color: #999999;
}
.page-total-pages {
  color: #1a1a1a;
  font-weight: 600;
}
.page-count {
  margin-left: 16px;
  font-size: 13px;
  color: #999999;
}
</style>
