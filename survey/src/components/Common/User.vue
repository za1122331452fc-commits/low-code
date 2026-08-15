<template>
  <div
    ref="avatarRef"
    class="avatar-wrapper"
    :style="{
      position: 'fixed',
      left: position.x + 'px',
      top: position.y + 'px',
      zIndex: 9999,
      cursor: isDragging ? 'grabbing' : 'grab',
    }"
    @mousedown="startDrag"
    @touchstart="startDragTouch"
  >
    <!-- 圆形头像 -->
    <div
      class="avatar-trigger"
      :class="{ 'is-active': isOpen, 'is-dragging': isDragging }"
      @click.stop="toggleCard"
    >
      <img
        v-if="!avatarError"
        :src="avatar"
        class="avatar-image"
        alt=""
        @error="avatarError = true"
      />
      <div v-else class="avatar-placeholder">{{ avatarText }}</div>
    </div>

    <!-- 弹出卡片 -->
    <Teleport to="body">
      <Transition name="card">
        <div
          v-if="isOpen"
          ref="cardRef"
          class="avatar-card"
          :style="{
            position: 'fixed',
            left: cardPosition.x + 'px',
            top: cardPosition.y + 'px',
          }"
          @click.stop
        >
          <div class="card-arrow"></div>

          <!-- 用户信息区 -->
          <div class="card-header">
            <div class="card-avatar">
              <img
                v-if="!avatarError"
                :src="avatar"
                class="avatar-image"
                alt=""
                @error="avatarError = true"
              />
              <div v-else class="avatar-placeholder">{{ avatarText }}</div>
            </div>
            <div class="card-user-info">
              <div class="card-username">{{ user?.name || '未登录' }}</div>
              <div class="card-user-id">ID: {{ user?.id ?? '未知' }}</div>
              <div class="card-role">{{ userRole }}</div>
            </div>
          </div>

          <div class="card-profile-info" v-if="showProfileDetails">
            <div class="info-row">
              <span>姓名</span>
              <strong>{{ user?.name || '未登录' }}</strong>
            </div>
            <div class="info-row">
              <span>用户 ID</span>
              <strong>{{ user?.id ?? '未知' }}</strong>
            </div>
          </div>

          <!-- 操作菜单 -->
          <div class="card-menu">
            <!-- <div class="menu-item" @click="handleAction('profile')">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </div> -->
            <div
              class="menu-item"
              @click="handleAction('users')"
              v-if="isAdmin"
            >
              <el-icon><UserFilled /></el-icon>
              <span>管理用户</span>
            </div>
            <div
              class="menu-item"
              @click="handleAction('surveys')"
              v-if="isAdmin"
            >
              <el-icon><Document /></el-icon>
              <span>管理问卷</span>
            </div>
            <div class="menu-divider"></div>
            <div v-if="user?.id" class="menu-item menu-item-danger" @click="handleAction('logout')">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { UserFilled, Document, SwitchButton } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'
const avatar = ref('https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif')
// 头像图加载失败时回退为「姓名首字」文字头像，保证任何情况下都适配
const avatarError = ref(false)
const avatarText = computed(() => {
  const name = user.value?.name || ''
  return name ? name.slice(0, 1) : '?'
})
const router = useRouter()
const { user,logout } = useAuth()

// ============ 状态 ============
const isOpen = ref(false)
const isDragging = ref(false)
const showProfileDetails = ref(true)

const avatarRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)

// ============ 位置 ============
const position = ref({ x: window.innerWidth - 120, y: 30 })

const cardPosition = ref({ x: 0, y: 0 })

// ============ 拖拽状态 ============
const dragStart = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })
const hasMoved = ref(false)

// ============ 用户信息 ============
const userRole = computed(() => {
  if (!user.value) return '游客'
  return user.value.roleId === 10 ? '管理员' : '普通用户'
})

const isAdmin = computed(() => {
  return user.value?.roleId === 10
})

// ============ 卡片位置计算 ============
const updateCardPosition = () => {
  if (!avatarRef.value || !cardRef.value) return
  const rect = avatarRef.value.getBoundingClientRect()
  // 用卡片真实宽高判断，避免写死 280 与内容高度不符导致遮挡头像
  const cardWidth = cardRef.value.offsetWidth || 240
  const cardHeight = cardRef.value.offsetHeight || 280
  const gap = 12

  let left = rect.right - cardWidth
  let top = rect.bottom + gap

  // 右侧空间不足，贴右
  if (left < 10) left = 10
  // 左侧空间不足
  if (left + cardWidth > window.innerWidth - 10) {
    left = window.innerWidth - cardWidth - 10
  }

  // 下方空间不足，显示在上方
  if (top + cardHeight > window.innerHeight - 10) {
    top = rect.top - cardHeight - gap
  }

  // 上方也不足，直接贴顶部
  if (top < 10) top = 10

  cardPosition.value = { x: left, y: top }
}

// ============ 切换卡片 ============
const toggleCard = () => {
  if (isDragging.value || hasMoved.value) {
    hasMoved.value = false
    return
  }
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      updateCardPosition()
    })
  }
}

// ============ 鼠标拖拽 ============
const startDrag = (e: MouseEvent) => {
  if (e.button !== 0) return
  isDragging.value = true
  hasMoved.value = false
  dragStart.value = { x: e.clientX, y: e.clientY }
  offset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    hasMoved.value = true
  }

  if (isOpen.value) {
    isOpen.value = false
  }

  let newX = e.clientX - offset.value.x
  let newY = e.clientY - offset.value.y

  // 边界限制
  const size = 44
  newX = Math.max(0, Math.min(window.innerWidth - size, newX))
  newY = Math.max(0, Math.min(window.innerHeight - size, newY))

  position.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// ============ 触摸拖拽 ============
const startDragTouch = (e: TouchEvent) => {
  const touch = e.touches[0]
  isDragging.value = true
  hasMoved.value = false
  dragStart.value = { x: touch.clientX, y: touch.clientY }
  offset.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y,
  }

  document.addEventListener('touchmove', onDragTouch, { passive: false })
  document.addEventListener('touchend', stopDragTouch, { passive: false })
}

const onDragTouch = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  const dx = touch.clientX - dragStart.value.x
  const dy = touch.clientY - dragStart.value.y
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    hasMoved.value = true
  }

  if (isOpen.value) {
    isOpen.value = false
  }

  let newX = touch.clientX - offset.value.x
  let newY = touch.clientY - offset.value.y

  const size = 44
  newX = Math.max(0, Math.min(window.innerWidth - size, newX))
  newY = Math.max(0, Math.min(window.innerHeight - size, newY))

  position.value = { x: newX, y: newY }
}

const stopDragTouch = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', onDragTouch)
  document.removeEventListener('touchend', stopDragTouch)
}

// ============ 点击外部关闭 ============
const handleClickOutside = (e: MouseEvent) => {
  if (!avatarRef.value) return
  const target = e.target as Node
  if (!avatarRef.value.contains(target)) {
    if (!cardRef.value || !cardRef.value.contains(target)) {
      isOpen.value = false
    }
  }
}

// ============ 窗口变化时更新卡片位置 ============
const handleResize = () => {
  if (isOpen.value) {
    updateCardPosition()
  }
}

// ============ 操作处理 ============
const handleAction = (action: string) => {
  isOpen.value = false
  switch (action) {
    case 'profile':
      showProfileDetails.value = !showProfileDetails.value
      break
    case 'users':
      router.push('/admin-users')
      break
    case 'surveys':
      router.push('/admin-surveys')
      break
    case 'logout':
      handleLogout()
      break
    default:
      break
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      logout()
      router.push('/login')
    })
    .catch(() => {})
}

// ============ 生命周期 ============
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDragTouch)
  document.removeEventListener('touchend', stopDragTouch)
})
</script>

<style scoped>
.avatar-wrapper {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.avatar-trigger {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: grab;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
  background: #fff;
}

.avatar-trigger:hover {
  border-color: #2563eb;
  transform: scale(1.05);
}

.avatar-trigger.is-active {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.avatar-trigger.is-dragging {
  cursor: grabbing;
  transform: scale(0.95);
  opacity: 0.85;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

/* ========== 卡片样式 ========== */
.avatar-card {
  width: 240px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  padding: 16px 0;
  z-index: 10000;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transform-origin: top right;
}

.card-arrow {
  position: absolute;
  top: -8px;
  right: 16px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #ffffff;
  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.06));
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0f2942 0%, #1d4ed8 100%);
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.card-user-info {
  flex: 1;
  min-width: 0;
}

.card-username {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.card-user-id {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  margin-top: 2px;
}

.card-role {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.card-profile-info {
  margin: 10px 16px 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.info-row span {
  color: #909399;
}

.info-row strong {
  color: #303133;
  font-weight: 600;
}

.card-menu {
  padding: 6px 0 0 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  color: #606266;
  font-size: 14px;
}

.menu-item:hover {
  background: #f5f7fa;
}

.menu-item .el-icon {
  font-size: 18px;
  color: #909399;
}

.menu-item-danger {
  color: #f56c6c;
}

.menu-item-danger .el-icon {
  color: #f56c6c;
}

.menu-item-danger:hover {
  background: #fef0f0;
}

.menu-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 6px 12px;
}

/* ========== 过渡动画 ========== */
.card-enter-active,
.card-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
}

.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-8px);
}
</style>