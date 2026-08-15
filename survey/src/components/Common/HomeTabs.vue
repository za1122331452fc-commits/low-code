<template>
  <div class="home-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="home-tab"
      :class="{ active: isActive(tab.path) }"
      @click="go(tab.path)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const isAdmin = computed(() => auth.user.value?.roleId === 10)

const tabs = computed(() => {
  const list = [
    { path: '/', label: '我的问卷' },
    { path: '/my-quizzes', label: '我的发布' },
  ]
  if (isAdmin.value) {
    list.push({ path: '/admin-users', label: '用户管理' })
    list.push({ path: '/admin-surveys', label: '问卷管理' })
  }
  return list
})

const isActive = (path: string) => route.path === path

const go = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-tabs {
  display: flex;
  gap: 4px;
}

.home-tab {
  background: transparent;
  border: none;
  padding: 6px 16px;
  font-size: 14px;
  font-family: inherit;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  font-weight: 500;
  border-radius: 999px;
}

.home-tab.active {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
}
.home-tab:hover {
  color: #0f172a;
}
</style>
