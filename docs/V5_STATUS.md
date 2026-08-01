# 昌都记忆 Changdu Memory V5.5.1 — 开发状态

> 最新更新: 2026-08-01
> 版本: V5.5.1
> Build: `npm run build` ✅ 0 errors
> Type Check: `vue-tsc -b --noEmit` ✅ 0 errors
> Lint: `eslint` ✅ 0 errors

---

## 1. 项目定位

个人支教数字档案系统。记录一年西藏昌都支教期间的时间、日记、工作、待办、花费、地点、照片、标签。PWA + 云同步（Supabase），手机和 PC 双端。

---

## 2. 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 (Composition API, `<script setup>`) | ^3.5 |
| 语言 | TypeScript | ~5.8 |
| 构建 | Vite | ^6.3 |
| UI 库 | Naive UI | ^2.41 |
| 状态管理 | Pinia | ^2.3 |
| 路由 | Vue Router | ^4.5 |
| 后端服务 | Supabase (Auth + PostgreSQL + Storage) | ^2.49 |
| PWA | vite-plugin-pwa | ^0.21 |
| 代码规范 | ESLint + Prettier | — |

---

## 3. V5.5.1 更新摘要

### 首页 Hero（按 首页1.1.html 原型还原）
- 真实雪山大图背景（`photo-1464822759023-fed622ff2c3b?w=1600`）+ 天幕渐变遮罩 + hover 缓慢放大
- 左侧标题 + 大号「第 X 天」（日照金），右侧半透明倒计时卡（距离返程 / 目标天数 / 柔和进度条 / `% Completed`）
- 圆角 32px，手机 `aspect-ratio 3/4`、桌面 `16/6`；数据全部来自 timeStore，无写死

### 我的页个人 Hero 卡（按 我的1.1.html 原型还原）
- 夜空蓝→高原青深色渐变 + 底部雪山线稿 SVG 纹理
- 顶部徽标（project_name）+ 位置；渐变环头像 + 右下角绿色勾选徽章
- 底部「服务学校 / 教学科目」双卡（`profiles.school / subject`，数据库 V5.5.1 新增列）
- 「退出登录」移入系统菜单；整卡点击仍可进入账号管理

### 账号管理
- 弹窗新增「服务学校 / 教学科目」输入框，保存写入 `profiles.school / subject`（列不存在时静默降级）

### 我的页布局
- 手机端隐藏页面标题区 + 「在昌都的印记」卡片（电脑端不变）
- 电脑端设置项两列：左（常用功能 + 系统）/ 右（数据管理）

### 功能合并与清理
- 「数据导入 / 数据导出」合并为「数据管理」统一入口
- 「标签管理」彻底移除（页面 / 路由 / 组件 / 入口）

### 交互修复
- 行政安排：只能删除，不能修改（移除编辑路由 / `editWork`）
- 待办：新增「已过期」分组，显示全部历史；移除工作页旧待办 Tab，统一 `/todo`
- 今日心情：新增独立 `/mood` 页面，仅存 localStorage，不入库
- 首页「今日课程」→ `/work?tab=课程表`
- 日记模板支持随时切换

---

## 4. 路由

| 路径 | 页面 | 认证 |
|------|------|------|
| `/login` | 登录 | 游客 |
| `/` | 首页 | 可选 |
| `/diary` `/diary/:id` `/diary/:id/edit` `/diary/new` | 日记 | 需登录 |
| `/work` `/work/new` | 工作 / 添加行政安排 | 需登录 |
| `/expense` `/expense/:id/edit` `/expense/new` | 账本 | 需登录 |
| `/time-center` | 时光中心 | 需登录 |
| `/memory` | 大事记 | 需登录 |
| `/todo` `/todo/:id/edit` `/todo/new` | 待办 | 需登录 |
| `/mood` | 今日心情 | 可选 |
| `/profile` | 我的 | 需登录 |
| `/search` | 搜索 | 可选 |
| `/statistics` | 年度统计 | 需登录 |
| `/import` | 数据导入 | 需登录 |
| `/settings` | 设置 | 需登录 |
| `/settings/recycle-bin` | 回收站 | 需登录 |

> **已移除**：`/work/:id/edit`（编辑行政安排）、`/settings/tags`（标签管理）。

---

## 5. 暗色模式

- 设计令牌层面已完成（`variables.css` 中 `.dark` 规则覆盖所有颜色变量）
- 通过页面顶栏/我的页或设置页的深色模式开关切换
- 部分纯 CSS 装饰（Hero 雪山渐变、Wallet 渐变卡）在暗色模式下保留原效果（可后续逐页调优）

## 6. 数据库迁移（V5.5.1）

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject TEXT;
```

## 7. 已知限制

- 旅程路线节点为前端按比例计算，不可由用户自定义编辑
- 统计分类图标（如 CATEGORY_ICONS）仍保留 emoji 映射但已不再使用
