import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页', requiresAuth: true },
  },
  {
    path: '/time-center',
    name: 'TimeCenter',
    component: () => import('@/pages/TimeCenter.vue'),
    meta: { title: '时光中心', requiresAuth: true },
  },
  {
    path: '/todo',
    name: 'Todo',
    component: () => import('@/pages/Todo.vue'),
    meta: { title: '今日待办', requiresAuth: true },
  },
  {
    path: '/todo/new',
    name: 'TodoCreate',
    component: () => import('@/pages/TodoEdit.vue'),
    meta: { title: '新建待办', requiresAuth: true },
  },
  {
    path: '/todo/:id/edit',
    name: 'TodoEdit',
    component: () => import('@/pages/TodoEdit.vue'),
    meta: { title: '编辑待办', requiresAuth: true },
  },
  {
    path: '/work',
    name: 'Work',
    component: () => import('@/pages/Work.vue'),
    meta: { title: '工作安排', requiresAuth: true },
  },
  {
    path: '/work/new',
    name: 'WorkCreate',
    component: () => import('@/pages/WorkEdit.vue'),
    meta: { title: '添加工作', requiresAuth: true },
  },
  {
    path: '/work/:id/edit',
    name: 'WorkEdit',
    component: () => import('@/pages/WorkEdit.vue'),
    meta: { title: '编辑工作', requiresAuth: true },
  },
  {
    path: '/expense',
    name: 'Expense',
    component: () => import('@/pages/Expense.vue'),
    meta: { title: '花费记录', requiresAuth: true },
  },
  {
    path: '/expense/new',
    name: 'ExpenseCreate',
    component: () => import('@/pages/ExpenseEdit.vue'),
    meta: { title: '记录花费', requiresAuth: true },
  },
  {
    path: '/expense/:id/edit',
    name: 'ExpenseEdit',
    component: () => import('@/pages/ExpenseEdit.vue'),
    meta: { title: '编辑花费', requiresAuth: true },
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/pages/Diary.vue'),
    meta: { title: '日记', requiresAuth: true },
  },
  {
    path: '/diary/new',
    name: 'DiaryCreate',
    component: () => import('@/pages/DiaryEdit.vue'),
    meta: { title: '写日记', requiresAuth: true },
  },
  {
    path: '/diary/:id',
    name: 'DiaryDetail',
    component: () => import('@/pages/DiaryDetail.vue'),
    meta: { title: '日记详情', requiresAuth: true },
  },
  {
    path: '/diary/:id/edit',
    name: 'DiaryEdit',
    component: () => import('@/pages/DiaryEdit.vue'),
    meta: { title: '编辑日记', requiresAuth: true },
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/pages/Location.vue'),
    meta: { title: '地点', requiresAuth: true },
  },
  {
    path: '/location/new',
    name: 'LocationCreate',
    component: () => import('@/pages/LocationEdit.vue'),
    meta: { title: '添加地点', requiresAuth: true },
  },
  {
    path: '/location/:id/edit',
    name: 'LocationEdit',
    component: () => import('@/pages/LocationEdit.vue'),
    meta: { title: '编辑地点', requiresAuth: true },
  },
  {
    path: '/photo',
    name: 'Photo',
    component: () => import('@/pages/Photo.vue'),
    meta: { title: '照片', requiresAuth: true },
  },
  {
    path: '/photo/new',
    name: 'PhotoCreate',
    component: () => import('@/pages/PhotoEdit.vue'),
    meta: { title: '上传照片', requiresAuth: true },
  },
  {
    path: '/photo/:id',
    name: 'PhotoDetail',
    component: () => import('@/pages/PhotoDetail.vue'),
    meta: { title: '照片详情', requiresAuth: true },
  },
  {
    path: '/photo/:id/edit',
    name: 'PhotoEdit',
    component: () => import('@/pages/PhotoEdit.vue'),
    meta: { title: '编辑照片', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { title: '我的', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '设置', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 访问需要登录的页面：未登录 → 跳转 /login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录用户访问 /login → 跳转首页
  if (to.meta.guest && authStore.isLoggedIn) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
