<template>
  <div
    :class="{
      'text-center': computedState.position,
    }"
  >
    <MaterialsHeader
      :serialNum="serialNum"
      :title="computedState.title"
      :titleSize="computedState.titleSize"
      :titleWeight="computedState.titleWeight"
      :titleItalic="computedState.titleItalic"
      :titleColor="computedState.titleColor"
      :desc="computedState.desc"
      :descSize="computedState.descSize"
      :descWeight="computedState.descWeight"
      :descItalic="computedState.descItalic"
      :descColor="computedState.descColor"
    />
    <el-date-picker
      v-model="datetimeValue"
      :type="pickerType"
      placeholder="请选择日期"
      @click.stop
      @change="emitAnswer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUpdated } from 'vue'
import { renderTick } from '@/utils/renderDebug'
onUpdated(() => renderTick('DateTime'))
import {
  getTextStatus,
  getStringStatusByCurrentStatus,
  getCurrentStatus,
  getValueStatusByCurrentStatus,
} from '@/utils'
import MaterialsHeader from '@/components/SurveyComs/Common/MaterialsHeader.vue'
// 类型
import type { DatePickerType } from 'element-plus'
import type { TypeStatus } from '@/types'
const props = defineProps<{
  status: TypeStatus
  serialNum: number
}>()
const emits = defineEmits(['updateAnswer'])
const datetimeValue = ref<Date>(new Date())
const computedState = computed(() => ({
  title: getTextStatus(props.status.title),
  desc: getTextStatus(props.status.desc),
  position: getCurrentStatus(props.status.position),
  type: getValueStatusByCurrentStatus(props.status.type),
  titleSize: getStringStatusByCurrentStatus(props.status.titleSize),
  descSize: getStringStatusByCurrentStatus(props.status.descSize),
  titleWeight: getCurrentStatus(props.status.titleWeight),
  descWeight: getCurrentStatus(props.status.descWeight),
  titleItalic: getCurrentStatus(props.status.titleItalic),
  descItalic: getCurrentStatus(props.status.descItalic),
  titleColor: getTextStatus(props.status.titleColor),
  descColor: getTextStatus(props.status.descColor),
}))
// el-date-picker 的 type 需要窄化到合法枚举
const pickerType = computed<DatePickerType>(
  () => (computedState.value.type?.value as DatePickerType) || 'date',
)
const emitAnswer = () => {
  emits('updateAnswer', datetimeValue.value)
}
</script>

<style scoped lang="scss"></style>
