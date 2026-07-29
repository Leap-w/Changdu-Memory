import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/time-center',
    name: 'TimeCenter',
    component: () => import('@/pages/TimeCenter.vue'),
    meta: { title: '时光中心' },
  },
  {
    path: '/todo',
    name: 'Todo',
    component: () => import('@/pages/Todo.vue'),
    meta: { title: '今日待办' },
  },
  {
    path: '/work',
    name: 'Work',
    component: () => import('@/pages/Work.vue'),
    meta: { title: '工作安排' },
  },
  {
    path: '/expense',
    name: 'Expense',
    component: () => import('@/pages/Expense.vue'),
    meta: { title: '花费记录' },
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/pages/Diary.vue'),
    meta: { title: '日记' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { title: '我的' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { title: '设置' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
