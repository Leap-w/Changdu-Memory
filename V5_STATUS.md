# 昌都记忆 Changdu Memory V5.4 — 开发状态

> 最新更新: 2026-07-31
> 版本: V5.4 UI
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

## 3. V5.4 UI 升级摘要

### 设计系统
- **设计令牌**：高原自然色系——主色高原青 `#4B8F8C`、天空蓝 `#6FA8DC`、日照金 `#D6A84F`、雪山白底色 `#F7F9F8`、夜空蓝文字 `#101820`
- **卡片**：毛玻璃背景 `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)` + 统一 24px 圆角 + 轻阴影 + hover 上浮
- **字体**：Hero 大数字 56–72px / 页面标题 32px / 区块标题 18–20px / 正文 15–16px

### 应用外壳
- 统一 `AppLayout.vue`（替代旧的 DesktopLayout + MobileLayout 双布局）
- 顶部悬浮胶囊导航（毛玻璃 + 圆角全圆）+ 桌面端全部导航链接 + 用户头像
- 移动端底部五栏导航（首页·日记·工作·账本·我的）+ 安全区适配

### 通用 UI 组件（`src/components/ui/`）
| 组件 | 用途 |
|------|------|
| `AppCard` | 毛玻璃卡片，支持 hover、多档 padding |
| `AppSection` | 区块标题 + 右侧操作入口 + 可选底部分隔线 |
| `AppPillTabs` | 胶囊切换（v-model 双向绑定） |
| `AppFab` | 悬浮操作按钮，移动端自动避让底栏 |
| `AppIcon` | 统一 SVG 图标（50+ 图标，禁止 Emoji） |
| `AppAvatar` | 头像组件（首字母 fallback） |
| `AppEmpty` | 空状态组件 |

### 已迁移页面
- **首页**：Hero 高原雪山 + 日照金大数字 + 返程倒计时 + 今日状态四卡 + 快捷入口 + 最近记忆
- **我的**：深色渐变 Hero 卡片 + 支教时光胶囊 + 在昌都的印记统计 + 分组功能入口
- **日记**：月份筛选 + 三种自适应卡片（单图/多图/纯文字）+ 沉浸式阅读详情 + 上下篇导航
- **工作**：今日时间轴总览 + 四 Tab 体系 + 课程表今日高亮 + 学生画廊
- **账本**：Wallet Hero 渐变卡 + AppPillTabs 四态切换 + 分类聚合 + 资产/福利档案
- **时光中心 + 大事记**：旅程路线时间轴 + 自定义倒计时 + 大事记图文时间流 + 分类筛选
- **次要页面**：搜索、统计、导入、回收站、标签管理、设置、待办、登录——全部统一标题区与按钮风格

### 已移除
- `DesktopLayout.vue` / `MobileLayout.vue`（已被 `AppLayout.vue` 替代）
- 所有业务页面中的 Emoji 结构性图标（替换为 AppIcon SVG）

---

## 4. 路由（保持不变）

| 路径 | 页面 | 认证 |
|------|------|------|
| `/login` | 登录 | 游客 |
| `/` | 首页 | 可选 |
| `/diary` `/diary/:id` `/diary/:id/edit` `/diary/new` | 日记 | 需登录 |
| `/work` `/work/:id/edit` `/work/new` | 工作 | 需登录 |
| `/expense` `/expense/:id/edit` `/expense/new` | 账本 | 需登录 |
| `/time-center` | 时光中心 | 需登录 |
| `/memory` | 大事记 | 需登录 |
| `/todo` `/todo/:id/edit` `/todo/new` | 待办 | 需登录 |
| `/profile` | 我的 | 需登录 |
| `/search` | 搜索 | 可选 |
| `/statistics` | 年度统计 | 需登录 |
| `/import` | 数据导入 | 需登录 |
| `/settings` | 设置 | 需登录 |
| `/settings/recycle-bin` | 回收站 | 需登录 |
| `/settings/tags` | 标签管理 | 需登录 |

---

## 5. 暗色模式

- 设计令牌层面已完成（`variables.css` 中 `.dark` 规则覆盖所有颜色变量）
- 通过页面顶栏/我的页或设置页的深色模式开关切换
- 使用 CSS Variables 继承机制，大部分页面自动适配
- 部分纯 CSS 装饰（Hero 雪山渐变、Wallet 渐变卡）在暗色模式下保留原效果（可后续逐页调优）

## 6. 已知限制

- 旅程路线节点为前端按比例计算，不可由用户自定义编辑
- 统计分类图标（如 CATEGORY_ICONS）仍保留 emoji 映射但已不再使用
