import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import Login from '@/views/Login.vue'
import type { Material } from '@/types'
import { useMaterialStore } from '@/stores/useMaterial'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/my-quizzes',
      name: 'my-quizzes',
      component: () => import('@/views/MyPublishedView.vue'),
    },
    {
      path: '/admin-users',
      name: 'admin-users',
      component: () => import('@/views/UserManageView.vue'),
    },
    {
      path: '/admin-surveys',
      name: 'admin-surveys',
      component: () => import('@/views/SurveyManageView.vue'),
    },
      {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/materials',
      name: 'materials',
      component: () => import('@/views/MaterialsView/Index.vue'),
      redirect: '/select-group',
      children: [
        {
          path: '/select-group',
          name: 'select-group',
          component: () => import('@/views/MaterialsView/SelectGroupView.vue'),
          redirect: '/single-select',
          children: [
            {
              path: '/single-select',
              name: 'single-select',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SingleSelect.vue'),
            },
            {
              path: '/multi-select',
              name: 'multi-select',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/MultiSelect.vue'),
            },
            {
              path: '/option-select',
              name: 'option-select',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/OptionSelect.vue'),
            },
            {
              path: '/single-pic-select',
              name: 'single-pic-select',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SinglePicSelect.vue'),
            },
            {
              path: '/multi-pic-select',
              name: 'multi-pic-select',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/MultiPicSelect.vue'),
            },
          ],
        },
        {
          path: '/input-group',
          name: 'input-group',
          component: () => import('@/views/MaterialsView/InputGroupView.vue'),
          redirect: '/text-input',
          children: [
            {
              path: '/text-input',
              name: 'text-input',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
          ],
        },
        {
          path: '/advanced-group',
          name: 'advanced-group',
          component: () => import('@/views/MaterialsView/AdvancedGroupView.vue'),
          redirect: '/rate-score',
          children: [
            {
              path: '/rate-score',
              name: 'rate-score',
              component: () =>
                import('@/components/SurveyComs/Materials/AdvancedComs/RateScore.vue'),
            },
            {
              path: '/date-time',
              name: 'date-time',
              component: () =>
                import('@/components/SurveyComs/Materials/AdvancedComs/DateTime.vue'),
            },
          ],
        },
        {
          path: '/note-group',
          name: 'note-group',
          component: () => import('@/views/MaterialsView/NoteGroup.vue'),
          redirect: '/text-note',
          children: [
            {
              path: '/text-note',
              name: 'text-note',
              component: () => import('@/components/SurveyComs/Materials/NoteComs/TextNote.vue'),
            },
          ],
        },
        {
          path: '/personal-info-group',
          name: 'personal-info-group',
          component: () => import('@/views/MaterialsView/PersonalInfoGroupView.vue'),
          redirect: '/personal-info-name',
          children: [
            {
              path: '/personal-info-name',
              name: 'personal-info-name',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-id',
              name: 'personal-info-id',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-birth',
              name: 'personal-info-birth',
              component: () =>
                import('@/components/SurveyComs/Materials/AdvancedComs/DateTime.vue'),
            },
            {
              path: '/personal-info-gender',
              name: 'personal-info-gender',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SingleSelect.vue'),
            },
            {
              path: '/personal-info-age',
              name: 'personal-info-age',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SingleSelect.vue'),
            },
            {
              path: '/personal-info-education',
              name: 'personal-info-education',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SingleSelect.vue'),
            },
            {
              path: '/personal-info-collage',
              name: 'personal-info-collage',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-major',
              name: 'personal-info-major',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-industry',
              name: 'personal-info-industry',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-career',
              name: 'personal-info-career',
              component: () =>
                import('@/components/SurveyComs/Materials/SelectComs/SingleSelect.vue'),
            },
            {
              path: '/personal-info-company',
              name: 'personal-info-company',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-position',
              name: 'personal-info-position',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
          ],
        },
        {
          path: '/contact-group',
          name: 'contact-group',
          component: () => import('@/views/MaterialsView/ContactGroupView.vue'),
          redirect: '/personal-info-tel',
          children: [
            {
              path: '/personal-info-tel',
              name: 'personal-info-tel',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-wechat',
              name: 'personal-info-wechat',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-qq',
              name: 'personal-info-qq',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-email',
              name: 'personal-info-email',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
            {
              path: '/personal-info-address',
              name: 'personal-info-address',
              component: () => import('@/components/SurveyComs/Materials/InputComs/TextInput.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/editor/:id(\\d+)?',
      name: 'editor',
      component: () => import('@/views/EditorView/Index.vue'),
      children: [
        {
          path: 'survey-type',
          name: 'survey-type',
          component: () => import('@/views/EditorView/LeftSide/SurveyType.vue'),
        },
        {
          path: 'outline',
          name: 'outline',
          component: () => import('@/views/EditorView/LeftSide/Outline.vue'),
        },
      ],
    },
    {
      path: '/preview/:id(\\d+)?',
      name: 'preview',
      component: () => import('@/views/Preview.vue'),
    },
    {
      path: '/quiz/:id',
      name: 'quiz',
      component: () => import('@/views/QuizView.vue'),
    },
    {
      path: '/quiz/:id/stats',
      name: 'quiz-stats',
      component: () => import('@/views/QuizStats.vue'),
    },
    {
      path: '/quiz/:id/question/:qIndex',
      name: 'quiz-answers',
      component: () => import('@/views/QuizAnswers.vue'),
    },
  ],
})

router.beforeEach((to, _, next) => {
  // // 登录拦截守卫
  // const token = localStorage.getItem('token')
  // // 判断是否需要登录
  // const requiresAuth = to.meta.requiresAuth !== false
  // // 如果需要登录但没有 Token
  // if (requiresAuth && !token) {
  //   next({
  //     path: '/login',
  //     query: { redirect: to.fullPath }  // 记录目标路径
  //   })
  //   return
  // }
  // // 已登录访问登录页 → 跳转到首页
  // if (token && to.path === '/login') {
  //   next('/')
  //   return
  // }
  // 根据路由显示组件
  const activeView = localStorage.getItem('activeView')
  const store = useMaterialStore()
  // 仅当目标仍是组件市场内的路由时才设置当前组件，避免离开时把路由名误设为组件名导致 undefined 报错
  if (activeView === 'materials' && to.name && to.path.startsWith('/materials')) {
    store.setCurrentSurveyCom(to.name as Material)
  }
  next()
})

// 网站名（与 index.html 的 <title> 保持一致）
const siteTitle = '低代码问卷平台'
// 路由名 → 中文标题
const titleMap: Record<string, string> = {
  home: '我的问卷',
  'my-quizzes': '我的发布',
  'admin-users': '用户管理',
  'admin-surveys': '问卷管理',
  login: '登录',
  materials: '组件市场',
  'select-group': '选择类',
  'single-select': '单选',
  'multi-select': '多选',
  'option-select': '下拉',
  'single-pic-select': '图片单选',
  'multi-pic-select': '图片多选',
  'input-group': '文本输入',
  'text-input': '文本输入',
  'advanced-group': '高级题型',
  'rate-score': '评价/打分',
  'date-time': '日期/时间',
  'note-group': '备注说明',
  'text-note': '备注说明',
  'personal-info-group': '个人信息',
  'contact-group': '联系方式',
  editor: '问卷编辑器',
  'survey-type': '题型选择',
  outline: '大纲',
  preview: '问卷预览',
  quiz: '在线答题',
  'quiz-stats': '问卷统计',
  'quiz-answers': '答题详情',
}
// 动态设置标签页标题：网站名-路由名
router.afterEach((to) => {
  const name = typeof to.name === 'string' ? to.name : ''
  const pageTitle = titleMap[name]
  document.title = pageTitle ? `${siteTitle}-${pageTitle}` : siteTitle
})

export default router
