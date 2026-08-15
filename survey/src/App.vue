<template>
  <el-config-provider :locale="zhCn">
    <div>
      <RouterView />
      <AvatarMenu/>
      <VueQueryDevtools v-if="VueQueryDevtools" />
    </div>
  </el-config-provider>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import AvatarMenu from '@/components/Common/User.vue'
// Element Plus 中文语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 仅开发环境加载 TanStack Query Devtools，生产打包不引入
const VueQueryDevtools = import.meta.env.DEV
  ? defineAsyncComponent(() =>
      import('@tanstack/vue-query-devtools').then((m) => m.VueQueryDevtools)
    )
  : null
</script>