<template>
  <div>
    <div class="container mb-15">
      <h2
        class="title font-weight-100"
        :style="{
          fontSize: titleSize + 'px',
          color: titleColor,
        }"
      >
        <span
          :class="{
            'font-bold': !titleWeight,
            'font-italic': !titleItalic,
          }"
          >{{ serialNum < 10 ? '0' + serialNum : serialNum }}.</span
        ><span
          v-if="isUnanswered"
          class="required-star"
          >*</span
        ><span
          :class="{
            'font-bold': !titleWeight,
            'font-italic': !titleItalic,
          }"
          >{{ title }}</span
        >
      </h2>
      <div
        class="desc"
        :class="{
          'font-bold': !descWeight,
          'font-italic': !descItalic,
        }"
        :style="{
          fontSize: descSize + 'px',
          color: descColor,
        }"
      >
        {{ desc }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
const props = defineProps({
  serialNum: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  titleSize: {
    type: String,
    default: '18',
  },
  titleWeight: {
    type: Number,
    default: 0,
  },
  titleItalic: {
    type: Number,
    default: 0,
  },
  titleColor: {
    type: String,
    default: '#000',
  },
  desc: {
    type: String,
    default: '请输入题目说明（选填）',
  },
  descSize: {
    type: String,
    default: '14',
  },
  descWeight: {
    type: Number,
    default: 0,
  },
  descItalic: {
    type: Number,
    default: 0,
  },
  descColor: {
    type: String,
    default: '#666',
  },
})
// 答题页：注入“未作答题号”集合，未作答的题目标题前显示红色 *
const quizUnanswered = inject<Set<number> | undefined>('quizUnanswered', undefined)
const isUnanswered = computed(() => !!quizUnanswered?.has(props.serialNum))
</script>

<style scoped lang="scss">
.container {
  > h2 {
    font-size: 20px;
    > span {
      margin: 0 5px;
    }
  }
}
.required-star {
  color: #f56c6c;
  font-weight: 700;
}
.desc {
  font-size: var(--font-size-base);
  color: var(--font-color-light);
  text-indent: 5px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
