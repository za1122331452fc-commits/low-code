<template>
  <div class="auth-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="circle c4"></div>
    </div>

    <div class="auth-container">
      <!-- 左侧品牌区 -->
      <div class="brand-section">
        <div class="brand-eyebrow">LOW-CODE SURVEY</div>
        <h1 class="brand-title">自定义问卷</h1>
        <p class="brand-subtitle">让每一次数据收集，简单而专业</p>
        <div class="brand-divider"></div>
        <p class="brand-desc">
          拖拽搭建问卷，一键发布、在线作答、实时统计，零门槛开启你的调研。
        </p>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-section">
        <!-- Tab 切换 -->
        <div class="form-tabs">
          <button
            class="tab-btn"
            :class="{ active: isLogin }"
            @click="isLogin = true"
          >
            登录
          </button>
          <button
            class="tab-btn"
            :class="{ active: !isLogin }"
            @click="isLogin = false"
          >
            注册
          </button>
        </div>

        <!-- 登录表单 -->
        <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-item">
            <label>用户名</label>
            <el-input
              v-model="loginForm.loginId"
              placeholder="请输入用户名"
              class="handwrite-el-input"
              :class="{ 'is-filled': loginForm.loginId }"
            />
          </div>

          <div class="form-item">
            <label>密码</label>
            <el-input
              v-model="loginForm.loginPwd"
              type="password"
              placeholder="请输入密码"
              class="handwrite-el-input"
              :class="{ 'is-filled': loginForm.loginPwd }"
              show-password
            />
          </div>

          <!-- 验证码 -->
          <div class="form-item captcha-item">
            <label>验证码</label>
            <div class="captcha-wrapper">
              <el-input
                v-model="loginForm.captcha"
                placeholder="请输入验证码"
                class="handwrite-el-input captcha-input"
                :class="{ 'is-filled': loginForm.captcha }"
                maxlength="4"
              />
              <!-- v-html 渲染 SVG -->
              <div 
                class="captcha-image" 
                v-html="captchaSrc"
                @click="refreshCaptcha"
              />
            </div>
            <span class="captcha-hint" @click="refreshCaptcha">
              🔄 点击图片刷新验证码
            </span>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="loginForm.remember" />
              <span class="checkmark"></span>
              <span class="checkbox-text">7天免登录</span>
            </label>
          </div>

          <button type="submit" class="submit-btn">登录</button>
        </form>

        <!-- 注册表单 -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-item">
            <label>设置用户名</label>
            <el-input
              v-model="registerForm.loginId"
              placeholder="起一个名字吧"
              class="handwrite-el-input"
              :class="{ 'is-filled': registerForm.loginId }"
            />
          </div>

          <div class="form-item">
            <label>设置密码</label>
            <el-input
              v-model="registerForm.loginPwd"
              type="password"
              placeholder="至少6位密码"
              class="handwrite-el-input"
              :class="{ 'is-filled': registerForm.loginPwd }"
              show-password
            />
          </div>

          <button type="submit" class="submit-btn">注册账号</button>
        </form>

        <!-- 底部提示 -->
        <p class="form-footer">
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
          <span class="switch-link" @click="isLogin = !isLogin">
            {{ isLogin ? '去注册' : '去登录' }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
// import { Loading } from '@element-plus/icons-vue'

// 引入api
import {getCaptcha} from '@/api'
import {useAuth} from '@/composables/useAuth'
const auth = useAuth()
const route = useRoute()

// 支持 ?type=register 直达注册 tab
const isLogin = ref(route.query.type !== 'register')

const loginForm = reactive({
  loginId: '',
  loginPwd: '',
  remember:0,
  captcha: ''
})

const registerForm = reactive({
  loginId: '',
  loginPwd: ''
})

const captchaSrc = ref('')

// 获取验证码
const fetchCaptcha =  async () => {
  try {
    captchaSrc.value = await getCaptcha()
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  fetchCaptcha()
}

// 登录
const handleLogin = async () => {
  if (!loginForm.loginId || !loginForm.loginPwd) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (!loginForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  if(loginForm.remember){
    loginForm.remember = 7
  }else{
    loginForm.remember = 1
  }
  try {
    await auth.login(loginForm)
    refreshCaptcha()
  } catch {
    loginForm.captcha = ''
    refreshCaptcha()
  }
}

// 注册
const handleRegister = async () => {
  if (!registerForm.loginId || !registerForm.loginId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (registerForm.loginPwd.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
   await auth.regist(registerForm)
    isLogin.value = true
    loginForm.loginId = registerForm.loginId
    registerForm.loginId = ''
    registerForm.loginPwd = ''
}

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
/* ========== 布局：文档风登录页 ========== */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  background: #3451b2;
}
.c1 {
  width: 360px;
  height: 360px;
  top: -140px;
  right: -100px;
}
.c2 {
  width: 240px;
  height: 240px;
  bottom: -90px;
  left: -80px;
}
.c3 {
  width: 140px;
  height: 140px;
  top: 62%;
  left: 8%;
}
.c4 {
  width: 90px;
  height: 90px;
  top: 12%;
  left: 38%;
}

.auth-container {
  display: flex;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 24px rgba(16, 24, 40, 0.08);
  overflow: hidden;
  width: 860px;
  max-width: 94vw;
  min-height: 500px;
  position: relative;
}

/* ========== 左侧品牌区 ========== */
.brand-section {
  background: #f6f8fd;
  padding: 56px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 0 300px;
  position: relative;
  border-right: 1px solid #e5e7eb;
}
.brand-section::after {
  content: '';
  position: absolute;
  right: -2px;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(180deg, #3451b2, #b6c1e6);
  opacity: 0.6;
}

.brand-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #3451b2;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.brand-title {
  font-size: 32px;
  font-weight: 800;
  color: #3451b2;
  letter-spacing: 0.02em;
  line-height: 1.3;
  margin: 0 0 18px;
}
.brand-subtitle {
  font-size: 15px;
  font-weight: 300;
  color: #111111;
  letter-spacing: 0.04em;
  line-height: 1.7;
  margin: 0 0 22px;
}
.brand-divider {
  width: 42px;
  height: 2px;
  background: #3451b2;
  margin: 0 0 24px;
}
.brand-desc {
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
  line-height: 2;
  margin: 0;
  max-width: 220px;
}

/* ========== 右侧表单区 ========== */
.form-section {
  flex: 1;
  padding: 56px 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Tab：文档式下划线标签 */
.form-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 36px;
  border-bottom: 1px solid #eceef1;
}
.tab-btn {
  background: none;
  border: none;
  padding: 8px 24px;
  font-size: 16px;
  font-family: inherit;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
  position: relative;
  font-weight: 500;
}
.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #3451b2;
  transition: width 0.2s;
}
.tab-btn.active {
  color: #1f2328;
}
.tab-btn.active::after {
  width: 70%;
}
.tab-btn:hover {
  color: #3451b2;
}

/* 表单 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-item label {
  font-size: 13px;
  color: #6b7280;
  letter-spacing: 0.02em;
  padding-left: 2px;
}

/* 验证码 */
.captcha-item {
  margin-top: 2px;
}
.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}
.captcha-input {
  flex: 1;
}
.captcha-image {
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.captcha-image:hover {
  border-color: #3451b2;
}
.captcha-hint {
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
  margin-top: 2px;
}
.captcha-hint:hover {
  color: #3451b2;
}

/* 自定义复选框 */
.form-options {
  display: flex;
  align-items: center;
  margin-top: 2px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  user-select: none;
}
.checkbox-label input {
  display: none;
}
.checkmark {
  width: 18px;
  height: 18px;
  border: 1.5px solid #c3cad1;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.checkbox-label input:checked + .checkmark {
  background: #3451b2;
  border-color: #3451b2;
}
.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
}

/* 提交按钮 */
.submit-btn {
  background: #3451b2;
  color: #fff;
  border: 1px solid #3451b2;
  padding: 13px 24px;
  border-radius: 0;
  font-size: 15px;
  font-family: inherit;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
}
.submit-btn:hover {
  background: #2a407e;
  border-color: #2a407e;
  box-shadow: 0 2px 8px rgba(52, 81, 178, 0.3);
}
.submit-btn:active {
  transform: translateY(1px);
}

/* 底部切换 */
.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #9ca3af;
}
.switch-link {
  color: #3451b2;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}
.switch-link:hover {
  color: #2a407e;
}

/* ========== 响应式 ========== */
@media (max-width: 700px) {
  .auth-container {
    flex-direction: column;
    min-height: auto;
    border-radius: 10px;
    max-width: 96vw;
  }
  .brand-section {
    flex: none;
    padding: 28px 24px;
    align-items: center;
    text-align: center;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  .brand-section::after {
    display: none;
  }
  .brand-features {
    justify-content: center;
  }
  .form-section {
    padding: 28px 24px;
  }
  .captcha-wrapper {
    flex-wrap: wrap;
  }
  .captcha-image {
    width: 100px;
    height: 38px;
  }
}
</style>