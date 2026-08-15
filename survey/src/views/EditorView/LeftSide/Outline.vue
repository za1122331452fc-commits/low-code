<template>
  <div v-if="store.surveyCount">
    <draggable v-model="store.coms" item-key="id" @start="dragstart" @change="onDragChange">
      <template #item="{ element, index }">
        <div
          class="mb-10"
          @click="clickHandle(index)"
          :key="element.id"
          v-show="isSurveyComName(element.name)"
          :class="{
            active: store.currentComponentIndex === index,
          }"
        >
          <div class="item">
            {{ serialNum[index] }}.
            {{
              element.status.title.status.length > 10
                ? element.status.title.status.substring(0, 10) + '...'
                : element.status.title.status
            }}
          </div>
        </div>
      </template>
    </draggable>
  </div>
  <div v-else class="tip flex align-items-center justify-content-center">请添加题目</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// EventBus
import EventBus from '@/utils/eventBus'
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()
import { useHistoryStore } from '@/stores/useHistory'
const historyStore = useHistoryStore()
// 拖动组件
import draggable from 'vuedraggable'
// 类型
import { isSurveyComName } from '@/types'
// 组合式函数
import { useSurveyNo } from '@/utils/hooks'
// 获取题目编号
const serialNum = computed(() => useSurveyNo(store.coms).value)
// 组件名
defineOptions({
  name: 'Outline',
})
// 拖动开始
function dragstart() {
  // 拖动开始的时候，将当前选中的组件取消选中
  store.setCurrentComponentIndex(-1)
}
// 拖动结束，记录移动操作
function onDragChange(event: { moved?: { oldIndex: number; newIndex: number } }) {
  if (event.moved && event.moved.oldIndex !== event.moved.newIndex) {
    historyStore.recordMove(event.moved.oldIndex, event.moved.newIndex)
  }
}
const clickHandle = function (index: number) {
  if (store.currentComponentIndex === index) {
    store.setCurrentComponentIndex(-1)
  } else {
    store.setCurrentComponentIndex(index)
    EventBus.emit('scrollToCenter', index)
  }
}
</script>

<style scoped>
.item {
  /* outline: 1px solid black; */
  color: var(--font-color-light);
  font-size: var(--font-size-base);
  padding: 10px;
  cursor: pointer;
}
.tip {
  height: calc(100% - 50px);
}
.active {
  transform: scale(1.04);
  transition: 0.5s;
  background-color: var(--border-color);
  border-radius: var(--border-radius-lg);
}
</style>
