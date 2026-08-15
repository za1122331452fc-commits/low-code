<template>
  <div>
    <div class="container flex self-start align-items-center border-box">
      <div class="left flex justify-content-center align-items-center">
        <el-button :icon="ArrowLeft" circle size="small" @click="goBack" />
      </div>
      <div class="center flex align-items-center space-between pl-15 pr-15">
        <div v-if="isEditor">
          <div v-if="id">
            <el-button type="warning" size="small" @click="updateSurveyHandle"
              >更新问卷</el-button
            >
          </div>
          <div v-else>
            <el-button type="danger" size="small" @click="reset">重置问卷</el-button>
            <el-button type="success" size="small" @click="saveSurvey">保存问卷</el-button>
          </div>
        </div>
        <div v-if="isEditor" class="flex align-items-center">
          <el-tooltip content="撤销 Ctrl+Z">
            <el-button :disabled="!historyStore.canUndo" size="small" @click="historyStore.undo()">
              <font-awesome-icon icon="fa-solid fa-rotate-left" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做 Ctrl+Y">
            <el-button
              :disabled="!historyStore.canRedo"
              size="small"
              @click="historyStore.redo()"
              class="ml-5"
            >
              <font-awesome-icon icon="fa-solid fa-rotate-right" />
            </el-button>
          </el-tooltip>
        </div>
        <div v-if="isEditor">
          <el-button type="primary" size="small" @click="preview">预览</el-button>
        </div>
      </div>
      <div class="right flex justify-content-center align-items-center">
        <el-avatar :size="30" :src="avatar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
// 路由
import { useRouter } from 'vue-router'
const router = useRouter()
// 工具方法
import { save, update } from '@/utils/dboperate'
// 问卷后端状态管理（mutation 内部负责失效列表缓存）
import { useSurvey } from '@/composables/useSurvey'
const { saveSurvey: createSurvey, updateSurvey } = useSurvey()
// 登录守卫：保存/更新/发布需要登录
import { useAuth } from '@/composables/useAuth'
const { requireLogin } = useAuth()
// 类型
import type { EditorStore } from '@/types'
// 仓库
import { useEditorStore } from '@/stores/useEditor'
const store = useEditorStore() as EditorStore
import { useHistoryStore } from '@/stores/useHistory'
const historyStore = useHistoryStore()

const goHome = () => {
  localStorage.setItem('activeView', 'home')
  router.push('/')
}

// 返回：优先回到上一页（如答题详情 -> 统计页），无历史记录时回首页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
const props = defineProps({
  isEditor: {
    type: Boolean,
    required: true,
  },
  id: {
    type: String,
    default: '',
  },
})
const avatar = ref('https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif')
// 重置题目
function reset() {
  ElMessageBox.confirm('是否确定重置试卷？已有题目将全部删除', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      store.resetComs()
      historyStore.clear()
      ElMessage({
        type: 'success',
        message: '已重置',
      })
    })
    .catch(() => {
      console.log('取消重置')
    })
}

// 保存题目（需要登录）
function saveSurvey() {
  if (!requireLogin()) return
  save(store, createSurvey).then((id) => {
    router.push(`/editor/${id}/survey-type`)
  })
}

// 更新问卷（需要登录）
function updateSurveyHandle() {
  if (!requireLogin()) return
  update(store, Number(props.id), updateSurvey)
}

function preview() {
  if (!requireLogin()) return
  ElMessageBox.confirm('预览会保存问卷，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      if (props.id) {
        // 说明是更新
        update(store, Number(props.id), updateSurvey).then(() => {
          router.push({
            path: `/preview/${props.id}`,
            state: { from: 'editor' },
          })
        })
      } else {
        // 说明是新建
        save(store, createSurvey).then((id) => {
          router.push({
            path: `/preview/${id}`,
            state: { from: 'editor' },
          })
        })
      }
    })
    .catch(() => {
      console.log('取消预览')
    })
}
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 50px;
  border-bottom: 1px solid var(--border-color);
  .left {
    width: 60px;
    height: 100%;
  }
  .center {
    flex: 1;
    height: 100%;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
  .right {
    width: 80px;
    height: 100%;
  }
}
</style>
