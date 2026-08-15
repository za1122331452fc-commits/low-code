<template>
  <div class="home-page">
    <header class="home-header">
      <div class="home-header-inner">
        <div class="brand">
          <div class="brand-mark">问</div>
          <span class="brand-name">低代码问卷</span>
        </div>

        <HomeTabs />

        <div class="header-right">
          <template v-if="!isAuthenticated">
            <span class="auth-login" @click="goLogin">登录</span>
            <button class="auth-register" @click="goRegister">注册</button>
          </template>
        </div>
      </div>
    </header>

    <main class="home-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import HomeTabs from '@/components/Common/HomeTabs.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isAuthenticated } = useAuth()

const goLogin = () => router.push('/login')
const goRegister = () => router.push('/login?type=register')
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f6fa;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    sans-serif;
}

/* 顶部导航：64px 纯白 + 极轻分割线 */
.home-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.home-header-inner {
  max-width: 1080px;
  height: 100%;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* 品牌区 */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 8px rgba(15, 41, 66, 0.18);
}
.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.01em;
}

/* 右侧登录/注册：登录=干净文本链，注册=藏蓝实色小按钮 */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.auth-login {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: color 0.3s;
}
.auth-login:hover {
  color: #2563eb;
}
.auth-register {
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 1px 8px rgba(15, 41, 66, 0.12);
  transition: all 0.3s ease;
}
.auth-register:hover {
  box-shadow: 0 4px 16px rgba(15, 41, 66, 0.2);
  transform: translateY(-1px);
}
.auth-register:active {
  transform: translateY(0);
}

/* 主内容：直接平铺在浅灰背景上，无任何包裹卡片 */
.home-main {
  max-width: 1080px;
  margin: 24px auto 56px;
  padding: 0 28px;
  animation: home-fade-up 0.4s ease both;
}

@keyframes home-fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<!-- 主页组件覆盖：通透表格 / 输入框 / 按钮 -->
<style>
/* 表格：通透，极浅表头，无竖线，仅横向分割线 */
.home-page .el-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #f1f5f9;
  --el-table-header-text-color: #475569;
  --el-table-row-hover-bg-color: #f8fafc;
  --el-table-border-color: #e2e8f0;
  --el-table-text-color: #334155;
  font-size: 14px;
}
.home-page .el-table th.el-table__cell {
  font-weight: 600;
  font-size: 13px;
  height: 48px;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
}
.home-page .el-table td.el-table__cell {
  height: 56px;
  padding: 0 24px;
  border-right: none;
  border-bottom: 1px solid #e2e8f0;
}

/* 输入框 / 选择器：纯白或极浅灰底 + 细边框 */
.home-page .el-input__wrapper,
.home-page .el-select .el-input__wrapper {
  background: #ffffff;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
}
.home-page .el-input__wrapper.is-focus,
.home-page .el-select .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #2563eb inset;
}

/* 按钮：主按钮深藏蓝渐变 / 危险按钮柔和红 */
.home-page .el-button--primary {
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 1px 8px rgba(15, 41, 66, 0.12);
  transition: all 0.3s ease;
}
.home-page .el-button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(15, 41, 66, 0.2);
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
}
.home-page .el-button--danger {
  background: #e74c6f;
  border-color: #e74c6f;
}
.home-page .el-button--danger:hover {
  background: #d63a5e;
  border-color: #d63a5e;
}
</style>
