<template>
  <div @click.stop>
    <div class="container mb-10">
      <div class="top flex justify-content-center align-items-center">
        <el-upload
          v-if="isEditable"
          class="avatar-uploader"
          action="/api/upload"
          name="image"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeAvatarUpload"
          :headers="uploadHeaders"
        >
          <img v-if="value" :src="value" class="avatar" loading="lazy" />
          <div v-else>
            <el-icon><Upload /></el-icon>
            添加图片
          </div>
        </el-upload>
        <!-- 预览/答题模式：只读展示，不允许上传 -->
        <div v-else class="readonly">
          <img v-if="value" :src="value" class="avatar" loading="lazy" />
          <span v-else class="empty-text">暂无图片</span>
        </div>
      </div>
      <div
        class="bottom flex justify-content-center align-items-center flex-direction-column font-weight-500"
      >
        <div class="item">{{ picTitle }}</div>
        <div class="desc mt-5 mb-5">{{ picDesc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
import type { GetLink } from '@/types'
const props = defineProps({
  picTitle: {
    type: String,
    default: '选项',
  },
  picDesc: {
    type: String,
    default: '说明（选填，限24字）',
  },
  value: {
    type: String,
    default: null,
  },
  index: {
    type: Number,
    default: 0,
  },
})
// 上传请求需要携带登录 token（el-upload 不走 axios 拦截器）
const token = localStorage.getItem('token')
const uploadHeaders = token ? { Authorization: `Bearer ${token}` } : {}
// 编辑器/组件市场会 provide getPicLink；预览、在线答题没有提供 → 只读，禁止上传
const getPicLink = inject<GetLink | null>('getPicLink', null)
const isEditable = computed(() => !!getPicLink)

const handleAvatarSuccess: UploadProps['onSuccess'] = async (response) => {
  // 兼容多种返回结构：{imageUrl} / {url} / {data:{imageUrl}} / {code,msg,data:{imageUrl}}
  const url =
    (response && (response.imageUrl || response.url || response.data?.imageUrl || response.data?.url)) || ''
  if (getPicLink && url) {
    getPicLink({
      index: props.index,
      link: url,
    })
  }
}

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试')
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 先校验再上传，避免上传完才提示
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('仅支持上传图片文件')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('上传图片不能超过2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.container {
  width: 200px;
  height: 300px;
  border: 1px solid var(--font-color-lightest);
  border-radius: var(--border-radius-md);
  color: var(--font-color-light);
  > .top {
    width: 100%;
    height: 200px;
    background-color: var(--font-color-lightest);
  }
  > .bottom {
    height: 100px;
    font-size: var(--font-size-lg);
    > .desc {
      font-size: var(--font-size-base);
      color: var(--font-color-light);
    }
  }
}
.avatar {
  width: 200px;
  height: 200px;
  object-fit: contain;
}
.readonly {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  color: var(--font-color-light);
  font-size: var(--font-size-base);
}
</style>
