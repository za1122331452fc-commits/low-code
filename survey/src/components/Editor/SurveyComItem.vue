<template>
  <div>
    <div
      class="survey-com-item-container pointer flex justify-content-center align-items-center self-center"
      @click="addSurveyComItem"
    >
      <div>{{ item?.comName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// EventBus
import EventBus from '@/utils/eventBus'
import type { PropType } from 'vue'
import type { MaterialItem } from '@/types'
import { defaultStatusMap } from '@/configs/defaultStatus/defaultStatusMap'
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore()
import { useHistoryStore } from '@/stores/useHistory'
const historyStore = useHistoryStore()
import { updateInitStatusBeforeAdd } from '@/utils'
const props = defineProps({
  item: Object as PropType<MaterialItem>,
})

const addSurveyComItem = () => {
  const newMaterialName = props.item?.materialName
  if (!newMaterialName) {
    console.warn('newMaterialName is required')
    return
  }
  const status = defaultStatusMap[newMaterialName]()
  updateInitStatusBeforeAdd(status, newMaterialName)
  store.addCom(store.coms, status)
  historyStore.recordAdd(store.coms.length - 1, store.coms[store.coms.length - 1])
  EventBus.emit('scrollToBottom')
}
</script>

<style scoped lang="scss">
.survey-com-item-container {
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  padding: 0 6px;
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  color: var(--font-color-light);
  user-select: none;
  white-space: nowrap;
}
.survey-com-item-container:hover {
  background-color: var(--font-color-lightest);
}
</style>
