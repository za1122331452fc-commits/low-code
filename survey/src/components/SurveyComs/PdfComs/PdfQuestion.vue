<template>
  <div class="pdf-question" :class="{ 'is-center': isCenter }">
    <!-- 备注说明（无编号） -->
    <template v-if="isNote">
      <div
        v-if="noteType === 0"
        class="pdf-note-title"
        :style="titleStyle"
      >
        {{ title }}
      </div>
      <div
        v-else
        class="pdf-note-desc"
        :style="descStyle"
      >
        {{ desc }}
      </div>
    </template>

    <!-- 题目 -->
    <template v-else>
      <div class="pdf-head">
        <span class="pdf-serial">{{ serialText }}.</span>
        <span class="pdf-title" :style="titleStyle">{{ title }}</span>
      </div>
      <div v-if="desc" class="pdf-desc" :style="descStyle">{{ desc }}</div>

      <!-- 图片选项 -->
      <div v-if="isPic" class="pdf-pic-options">
        <div v-for="(opt, i) in picOptions" :key="i" class="pdf-pic-option">
          <div class="pdf-pic-meta">
            <span class="pdf-letter">{{ isMulti ? '□ ' : '' }}{{ letter(i) }}.</span>
          </div>
          <img class="pdf-pic-img" :src="opt.value" :alt="opt.picTitle" />
          <div class="pdf-pic-title">{{ opt.picTitle }}</div>
          <div v-if="opt.picDesc" class="pdf-pic-desc">{{ opt.picDesc }}</div>
        </div>
      </div>

      <!-- 文本选项 -->
      <div v-else-if="isSelect" class="pdf-options">
        <div v-for="(opt, i) in options" :key="i" class="pdf-option">
          <span class="pdf-letter">{{ isMulti ? '□ ' : '' }}{{ letter(i) }}.</span>
          <span class="pdf-option-text">{{ opt }}</span>
        </div>
      </div>

      <!-- 填空输入框（细边框） -->
      <div v-else class="pdf-input">
        <div class="pdf-input-line" :class="{ textarea: inputType !== 0 }"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Status, PicTitleDescStatusArr, TextProps, OptionsProps } from '@/types'
import {
  getTextStatus,
  getStringStatus,
  getCurrentStatus,
  getStringStatusByCurrentStatus,
  getValueStatus,
} from '@/utils'

const props = defineProps<{
  com: Status
  serialNum: number | null
}>()

type ComStatus = Record<string, TextProps | OptionsProps>
const st = computed<ComStatus>(() => props.com.status)

const title = computed(() => getTextStatus(st.value.title as TextProps) ?? '')
const desc = computed(() => getTextStatus(st.value.desc as TextProps) ?? '')
const titleSize = computed(
  () => Number(getStringStatusByCurrentStatus(st.value.titleSize as OptionsProps)) || 18
)
const descSize = computed(
  () => Number(getStringStatusByCurrentStatus(st.value.descSize as OptionsProps)) || 14
)
const titleWeight = computed(() => getCurrentStatus(st.value.titleWeight as OptionsProps) ?? 1)
const descWeight = computed(() => getCurrentStatus(st.value.descWeight as OptionsProps) ?? 1)
const titleItalic = computed(() => getCurrentStatus(st.value.titleItalic as OptionsProps) ?? 1)
const descItalic = computed(() => getCurrentStatus(st.value.descItalic as OptionsProps) ?? 1)
const titleColor = computed(() => getTextStatus(st.value.titleColor as TextProps) ?? '#000')
const descColor = computed(() => getTextStatus(st.value.descColor as TextProps) ?? '#666')

const isCenter = computed(() => (getCurrentStatus(st.value.position as OptionsProps) ?? 0) === 1)

const isNote = computed(() => props.com.name === 'text-note')
const hasOptions = computed(() => 'options' in st.value)
const hasType = computed(() => 'type' in st.value)

const isSelect = computed(() => hasOptions.value)
const isInput = computed(() => !isNote.value && hasType.value)
const isMulti = computed(
  () => props.com.name === 'multi-select' || props.com.name === 'multi-pic-select'
)

const options = computed(() =>
  isSelect.value ? getStringStatus(st.value.options as OptionsProps) ?? [] : []
)
const picOptions = computed(() => {
  if (!isSelect.value) return []
  return (getValueStatus(st.value.options as OptionsProps) ?? []) as PicTitleDescStatusArr
})
const isPic = computed(() => picOptions.value.length > 0)

const inputType = computed(() =>
  isInput.value ? getCurrentStatus(st.value.type as OptionsProps) ?? 0 : 0
)
const noteType = computed(() => getCurrentStatus(st.value.type as OptionsProps) ?? 0)

const titleStyle = computed(() => ({
  fontSize: titleSize.value + 'px',
  fontWeight: titleWeight.value === 0 ? 700 : 400,
  fontStyle: titleItalic.value === 0 ? 'italic' : 'normal',
  color: titleColor.value,
}))
const descStyle = computed(() => ({
  fontSize: descSize.value + 'px',
  fontWeight: descWeight.value === 0 ? 700 : 400,
  fontStyle: descItalic.value === 0 ? 'italic' : 'normal',
  color: descColor.value,
}))

const serialText = computed(() => {
  const n = props.serialNum
  return n == null ? '' : String(n).padStart(2, '0')
})

// 选项编号：A、B、C ... Z，超过 26 后 AA、AB...
function letter(i: number) {
  if (i < 26) return String.fromCharCode(65 + i)
  return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))
}
</script>

<style scoped>
.pdf-question {
  color: #1f2328;
  line-height: 1.6;
  font-size: 14px;
  padding: 4px 0;
}
.pdf-note-title,
.pdf-note-desc,
.pdf-title,
.pdf-desc {
  white-space: pre-wrap;
  word-break: break-word;
}
.is-center {
  text-align: center;
}
/* 居中：flex 布局不受 text-align 影响，需单独 justify-content */
.is-center .pdf-head {
  justify-content: center;
}
.is-center .pdf-option {
  justify-content: center;
}
.is-center .pdf-pic-options {
  justify-content: center;
}

.pdf-head {
  display: flex;
  align-items: baseline;
}
.pdf-serial {
  font-weight: 700;
  margin-right: 6px;
  color: #1f2328;
}
.pdf-title {
  color: #1f2328;
}
.pdf-desc {
  margin: 4px 0 8px;
}

.pdf-options {
  margin-top: 4px;
}
.pdf-option {
  display: flex;
  gap: 6px;
  padding: 3px 0;
}
.pdf-letter {
  font-weight: 700;
  flex-shrink: 0;
  min-width: 30px;
}
.pdf-option-text {
  flex: 1;
}

.pdf-pic-options {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 6px;
}
.pdf-pic-option {
  width: 150px;
  text-align: center;
}
.pdf-pic-meta {
  text-align: left;
  margin-bottom: 4px;
}
.pdf-pic-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.pdf-pic-title {
  font-weight: 600;
  margin-top: 4px;
}
.pdf-pic-desc {
  color: #9ca3af;
  font-size: 12px;
}

.pdf-input {
  margin-top: 8px;
}
.pdf-input-line {
  height: 28px;
  border: 1px solid #b6bec7;
  border-radius: 2px;
}
.pdf-input-line.textarea {
  height: 72px;
}
</style>
