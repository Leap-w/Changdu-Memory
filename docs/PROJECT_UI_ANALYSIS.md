# 昌都记忆 V5.2 — 项目 UI 全面分析报告

> **分析日期**：2026-07-30
> **分析范围**：全项目 108 个源文件（39 个组件、27 个页面、13 个 Store、9 个 Repository、7 个工具模块）
> **原则**：只分析，不修改

---

## 1. 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) | ^3.5.18 | 核心 UI 框架 |
| 构建 | Vite 6 | ^6.3.5 | 开发服务器 & 打包 |
| 语言 | TypeScript | ~5.8.3 | 类型安全 |
| 路由 | Vue Router 4 | ^4.5.1 | SPA 路由 (history mode) |
| 状态管理 | Pinia | ^2.3.1 | 全局状态 (13 个 Store) |
| UI 库 | Naive UI | ^2.41.0 | 组件库（卡片/表单/输入框/标签/选择器/加载/消息提示） |
| 后端 | Supabase | ^2.49.4 | 认证 + PostgreSQL + Storage |
| PWA | vite-plugin-pwa | ^0.21.2 | Service Worker & manifest |
| 导入导出 | xlsx | ^0.18.5 | Excel 解析 |
| 代码质量 | ESLint + Prettier | ^10 + ^3 | 代码规范 |
| 样式方案 | **纯手写 CSS（无预处理器/无 Tailwind）** | — | Scoped CSS + CSS 自定义属性 |
| 图标方案 | **内联 SVG + Emoji** | — | 无图标库 |

**关键发现**：项目未使用任何 CSS 框架（无 Tailwind、无 UnoCSS）。所有样式均为手写 scoped CSS，通过 `src/styles/variables.css` 中的 88 个 CSS 自定义属性维持设计一致性。

---

## 2. 页面路由结构

共 **27 条路由**，分为公开路由和需认证路由：

```
/login                          # 登录/注册（公开，全屏模式）
/                               # 首页（公开，支持游客模式）
/time-center                    # 时光中心（支教倒计时）
/todo, /todo/new, /todo/:id/edit    # 待办 CRUD
/work, /work/new, /work/:id/edit    # 工作安排 CRUD
/expense, /expense/new, /expense/:id/edit  # 花费记录 CRUD
/diary, /diary/new, /diary/:id, /diary/:id/edit  # 日记 CRUD + 详情
/location, /location/new, /location/:id, /location/:id/edit  # 地点 CRUD + 详情
/photo, /photo/timeline, /photo/new, /photo/:id, /photo/:id/edit  # 照片 CRUD + 时间轴
/memory                         # 记忆时间轴
/search                         # 全局搜索（公开）
/profile                        # 个人中心
/import                         # 数据导入
/statistics                     # 年度统计
/settings, /settings/recycle-bin, /settings/tags  # 设置/回收站/标签管理
/:pathMatch(.*)*                # 404 → 重定向首页
```

**路由守卫逻辑**（`src/router/index.ts:215-231`）：
- `requiresAuth` + 未登录 → 跳转 `/login?redirect=原路径`
- `guest`（登录页）+ 已登录 → 跳转首页
- 其余页面不做强制登录校验

**布局分发**（`src/App.vue:14-15`）：
- `route.name === 'Login'` → 全屏模式（不显示 App 外壳）
- 其他页面 → `appStore.isMobile` ? MobileLayout : DesktopLayout

---

## 3. 当前组件结构

```
src/
├── App.vue                          # 根组件：布局分发 + NMessageProvider
├── main.ts                          # 入口：Pinia → Router → Auth init → mount
├── layouts/
│   ├── DesktopLayout.vue            # 桌面端：固定左侧边栏（240px/64px）+ 内容区
│   └── MobileLayout.vue             # 移动端：底部 Tab 导航栏（4 项）
├── pages/                           # 27 个页面（路由级组件）
│   ├── Home.vue                     # 509 行 — 最复杂的页面
│   ├── Login.vue                    # 全屏页面
│   ├── Profile.vue                  # 334 行 — 微信风格个人中心
│   ├── Diary.vue / DiaryDetail.vue / DiaryEdit.vue
│   ├── Expense.vue / ExpenseEdit.vue
│   ├── Work.vue / WorkEdit.vue
│   ├── Todo.vue / TodoEdit.vue
│   ├── Photo.vue / PhotoDetail.vue / PhotoEdit.vue / PhotoTimeline.vue
│   ├── Location.vue / LocationDetail.vue / LocationEdit.vue
│   ├── MemoryTimeline.vue
│   ├── Statistics.vue               # 7 个统计子组件的容器
│   ├── Search.vue
│   ├── Import.vue
│   ├── TimeCenter.vue
│   ├── Settings.vue / RecycleBin.vue / TagManage.vue
│   └── Profile.vue
├── components/
│   ├── dashboard/    (6)  HeroSection, QuickAction, SummaryCard, TimeCard,
│   │                      TodayMemoryCard, QuoteCard
│   ├── diary/        (3)  DiaryCard, DiaryEditor, DiaryEmpty
│   ├── expense/      (3)  ExpenseCard, ExpenseEditor, ExpenseEmpty
│   ├── import/       (2)  ImportCard, ImportPreview
│   ├── location/     (3)  LocationCard, LocationEditor, LocationEmpty
│   ├── photo/        (3)  PhotoCard, PhotoEditor, PhotoEmpty
│   ├── schedule/     (2)  ScheduleEditor, ScheduleWeekView
│   ├── search/       (3)  SearchInput, SearchFilter, SearchResultCard
│   ├── statistics/   (7)  OverviewCard, MonthlyTrend, CategoryPie,
│   │                      ExpenseSummary, LocationSummary, WorkSummary, TagRanking
│   ├── student/      (1)  StudentCard
│   ├── tag/          (1)  TagSelector
│   ├── todo/         (3)  TodoCard, TodoEditor, TodoEmpty
│   └── work/         (3)  WorkCard, WorkEditor, WorkEmpty
├── stores/           (13)  app, auth, time, diary, photo, location, expense,
│                           work, todo, schedule, tag, student, welfare, asset
├── repositories/     (13)  对应 13 个数据表的 CRUD 操作
├── utils/            (7)   export, import, search, statistics, image, templates, quotes
├── services/         (1)   supabase.ts
├── types/            (1)   database.ts（完整的 Supabase Database 类型定义）
└── styles/           (2)   variables.css, global.css
```

**总计**：108 个源文件，含 39 个组件 + 27 个页面

---

## 4. UI 实现方式

### 4.1 混合策略

项目采用 **Naive UI 组件 + 手写 Scoped CSS** 的混合方式：

| 类别 | 使用 Naive UI 的组件 | 纯手写 CSS 的组件 |
|------|---------------------|-------------------|
| 卡片 | NCard（WorkCard, LocationCard, TodoCard, SearchResultCard, SummaryCard, OverviewCard, QuickAction, MonthlyTrend, TodayMemoryCard） | DiaryCard（自定义 article）, ExpenseCard, PhotoCard |
| 表单 | NForm, NInput, NButton, NSelect, NCheckbox（Login, TagSelector） | 手写 input/textarea/button（DiaryEditor, 所有 Editor 组件） |
| 反馈 | NSpin, NTag, NMessageProvider, useMessage | 手写 empty/error 状态 |

**关键矛盾**：编辑器组件（DiaryEditor, WorkEditor, ExpenseEditor 等）全部使用手写表单控件而非 Naive UI 的 NForm/NInput，但 Login 页面完全使用 Naive UI 表单。两种风格并存。

### 4.2 布局系统

- **DesktopLayout**：左侧固定侧边栏 + 右侧内容区（margin-left: 240px / 64px）
  - 6 个导航项（首页/工作/日记/时光中心/账本/我的）
  - 可折叠（sidebarCollapsed）
- **MobileLayout**：底部固定 Tab 栏 + 上方内容区
  - 4 个导航项（首页/工作/日记/我的），比桌面端少 2 个
  - 适配 safe-area-inset-bottom

### 4.3 响应式断点

项目中存在 **9 种不同断点**，无统一标准：

```css
/* 不同组件中出现的断点 */
@media (max-width: 400px)   /* Home.vue */
@media (max-width: 480px)   /* QuickAction.vue */
@media (max-width: 500px)   /* DiaryCard.vue */
@media (max-width: 599px)   /* Home.vue */
@media (min-width: 600px) and (max-width: 899px)  /* Home.vue */
@media (max-width: 767px)   /* HeroSection.vue, App store breakpoint <768 */
@media (min-width: 768px)   /* Profile.vue, Statistics.vue */
@media (min-width: 900px)   /* Home.vue */
@media (min-width: 1200px)  /* HeroSection.vue, Statistics.vue, App store */
```

App Store 中定义了 `isMobile (< 768)`, `isTablet (768-1199)`, `isDesktop (≥1200)`，但组件中并未统一使用这些断点。

### 4.4 HeroSection 特殊设计

HeroSection（`src/components/dashboard/HeroSection.vue`）是本项目最复杂的纯 CSS 视觉组件：
- **447 行**（约 70% 为 CSS）
- 多层 CSS 山脉：`clip-path: polygon()` 绘制远/中/近三层山峦 + 雪顶
- 渐变天空：7 段 linear-gradient
- 毛玻璃卡片：`backdrop-filter: blur(24px)` + 半透明白色背景
- 滚动提示动画：`@keyframes hero-scroll-bounce`
- 响应式山地高度调整

### 4.5 模态框实现

两种不同实现：
1. **Naive UI 方式**：Login 页使用 NForm（无独立模态框）
2. **手写 Teleport 方式**：Profile 编辑弹窗、DiaryEditor 图片查看器均使用 `<Teleport to="body">` + CSS transition

---

## 5. CSS / Tailwind 使用情况

### 5.1 Tailwind：零使用

全项目搜索 `tailwind|@tailwind|tailwindcss` — **0 结果**。未安装 tailwindcss 包。

### 5.2 CSS 自定义属性系统

`src/styles/variables.css` 定义了完整的 **88 个设计令牌**：

| 类别 | 令牌数 | 示例 |
|------|--------|------|
| 颜色 | 19 | `--color-primary: #5E81AC`, `--color-bg: #F8FAFC` |
| 圆角 | 8 | `--radius-sm: 8px` ~ `--radius-xl: 24px` |
| 间距 | 9 | `--spacing-xs: 4px` ~ `--spacing-3xl: 48px` |
| 阴影 | 4 | `--shadow-sm` ~ `--shadow-lg` |
| 字体 | 6 | `--font-display: 36px` ~ `--font-caption: 12px` |
| 行高 | 3 | `--leading-tight: 1.2` ~ `--leading-relaxed: 1.7` |
| 过渡 | 3 | `--transition-fast: 150ms` ~ `--transition-slow: 400ms` |
| 毛玻璃 | 3 | `--glass-bg`, `--glass-border`, `--glass-blur` |

### 5.3 设计令牌使用率

- **高使用率**：`--color-text-primary/secondary/tertiary`、`--color-primary`、`--radius-*`、`--spacing-*`、`--font-*`、`--shadow-*` — 几乎所有组件都使用
- **低使用率**：`--glass-*`、`--color-bg-warm`、`--color-primary-bg-active`、`--font-display`、`--leading-*` — 极少使用
- **未定义但直接硬编码的**：
  - 白色 `#fff` / `#ffffff`：在 12+ 个组件中直接使用
  - `rgba(79, 142, 247, 0.08)` 等半透明蓝色：反复硬编码（应为 `--color-primary-bg`）
  - `rgba(0, 0, 0, 0.06)` 等边框色：反复硬编码（应为 `--color-border`）
  - 线性渐变值：HeroSection、OverviewCard 中的渐变均为硬编码

### 5.4 CSS 组织方式

- 所有样式使用 `<style scoped>` 写在 `.vue` SFC 中
- 使用 BEM-like 命名：`.block__element--modifier`
- 部分组件使用压缩 CSS（如 DiaryCard: `.dc{display:flex;...}`），可读性较差
- 使用 `:deep()` 穿透 Naive UI 组件样式（在 10+ 个组件中出现）

---

## 6. 可复用组件

### 6.1 真正的通用组件

| 组件 | 复用次数 | 说明 |
|------|---------|------|
| **TagSelector** | 多个 Editor | 标签选择+创建，封装了 NSelect + NTag |
| **SearchInput** | Search 页 | 防抖搜索输入框（Naive UI NInput 封装） |
| **SearchFilter** | Search 页 | 类型/月份筛选项 |
| **SearchResultCard** | Search 页 | 统一搜索结果卡片 |

### 6.2 模式重复但未抽象为通用组件

| 模式 | 出现位置 | 重复次数 |
|------|---------|---------|
| **Empty 状态** | DiaryEmpty, TodoEmpty, WorkEmpty, ExpenseEmpty, PhotoEmpty, LocationEmpty | **6 次**（结构几乎相同：图标 + 标题 + 描述 + 按钮） |
| **模态框** | Profile 编辑弹窗、DiaryEditor 图片查看器、所有 Edit 页面的取消/保存按钮 | **~10 次** |
| **Icon 按钮组** | Home.vue 8 个快捷入口、Profile.vue 12 个菜单行 | 大量内联 SVG v-if 链 |
| **卡片外层** | 所有 `*Card.vue` 组件 | `border-radius: var(--radius-card); box-shadow: var(--shadow-card)` 重复 15+ 次 |
| **表单控件** | 所有 `*Editor.vue` 组件 | 相同的 label + input/textarea 模式重复 5+ 次 |
| **页面头部** | Diary, Expense, Work, Todo, Location, Photo 列表页 | 标题 + 新建按钮的 flex 布局重复 6+ 次 |

---

## 7. 需要重构的组件（按优先级）

### 🔴 高优先级

| 组件 | 文件 | 问题 |
|------|------|------|
| **HeroSection** | `components/dashboard/HeroSection.vue` (447 行) | CSS 占比过大（~70%），clip-path 山脉值无法维护，颜色硬编码，无可配置 props |
| **Home.vue** | `pages/Home.vue` (509 行) | 8 个快捷入口用 v-if 链渲染 SVG（200-223 行），每个 20 行重复代码。应抽取 `AppIcon` 组件 |
| **Profile.vue** | `pages/Profile.vue` (334 行) | 12 个菜单行的图标用 v-if 链（147-192 行），模态框嵌入页面内。应抽取 `ProfileRow` + `AppModal` |
| **6 个 Empty 组件** | `components/*/*Empty.vue` | 结构几乎完全相同（图标 + 标题 + 描述 + 按钮），应合并为 `<AppEmpty icon title desc :action>` |
| **DiaryEditor** | `components/diary/DiaryEditor.vue` (337 行) | 模板选择器 + 表单 + 图片上传 + 标签选择 + 图片查看器全部在一个组件中。应拆分为子组件 |

### 🟡 中优先级

| 组件 | 问题 |
|------|------|
| **所有 *Card.vue** | 卡片外层样式（border-radius + box-shadow + border）重复。应创建 `.card-base` CSS class 或 `<AppCard>` 包装组件 |
| **所有 *Editor.vue** | 表单控件样式重复（label + input/textarea + actions）。应抽取 `<FormField>` + `<FormActions>` |
| **DesktopLayout / MobileLayout** | `navItems` 数组、`navigateTo`、`handleResize` 在两个文件中重复。应抽取 `useNavigation` composable |
| **SVG 图标** | 摘要：至少 **50+ 处内联 SVG** 分散在 Home.vue、Profile.vue、各个 Card 组件中。无复用，修改图标需改多处 |

### 🟢 低优先级

| 组件 | 问题 |
|------|------|
| **Statistics 组件** | MonthlyTrend、CategoryPie 等 7 个组件中部分使用 NCard、部分手写卡片 |
| **SearchResultCard** | `periodLabels` 映射表与 WorkCard 中重复 |
| **ImportCard / ImportPreview** | 风格与其他 Card 组件不一致 |

---

## 8. 潜在风险

### 8.1 样式风险

| 风险 | 严重度 | 说明 |
|------|--------|------|
| **Naive UI 版本锁定风险** | 🔴 高 | 大量使用 `:deep()` 覆盖 Naive UI 内部样式（如 `.n-card__content`）。Naive UI 升级可能破坏所有覆盖 |
| **硬编码颜色泛滥** | 🟡 中 | `#fff`、`rgba(79,142,247,0.08)`、`rgba(0,0,0,0.06)` 等重复硬编码在 20+ 个组件中，改主题色需全局搜索替换 |
| **响应式断点碎片化** | 🟡 中 | 9 种不同断点分散在各组件中，无统一标准。某些组件在大屏可能布局异常 |
| **暗色模式形同虚设** | 🔴 高 | App Store 有 `theme` 字段，Profile 页有 `dark` class 切换，但 `variables.css` **只定义了 `:root` 浅色变量，没有 `.dark` / `[data-theme="dark"]` 的深色变量**。切换深色模式实际上不会改变任何颜色 |
| **PWA 缓存策略** | 🟡 中 | `index.html` 中内联脚本在每次页面加载时 unregister 所有 Service Worker — 这是调试 hack，不是正确的缓存策略 |

### 8.2 架构风险

| 风险 | 严重度 | 说明 |
|------|--------|------|
| **组件与 Store 强耦合** | 🟡 中 | PhotoCard 直接导入 `usePhotoStore`，SummaryCard 直接导入 `useTimeStore`。组件无法脱离 Store 独立使用或测试 |
| **无组件测试** | 🟡 中 | 项目无 Vitest 或任何测试框架依赖。所有 UI 验证依赖手动测试 |
| **无图标系统** | 🟡 中 | 图标使用 emoji + 内联 SVG，无统一图标组件，添加新图标需复制完整 SVG 标记 |
| **大文件 SFC** | 🟡 中 | 4 个文件超过 300 行（HeroSection 447, Home 509, Profile 334, DiaryEditor 337），违反单一职责 |
| **缺少可访问性** | 🟢 低 | 无 aria 属性、无 focus trap、无键盘导航支持、无 screen reader 文本 |

### 8.3 数据流风险

| 风险 | 严重度 | 说明 |
|------|--------|------|
| **多地数据加载逻辑重复** | 🟡 中 | "如果 Store 数据为空则加载" 的模式在 Home、Search、Statistics 中重复出现 |
| **标签关联数据多次获取** | 🟢 低 | Search 和 Statistics 页面都独立获取 diaryTags/photoTags/locationTags |
| **any 类型滥用** | 🟢 低 | `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 在多个文件中出现（Search.vue, Statistics.vue, search.ts 等） |

---

## 9. 重构建议摘要

1. **建立统一图标组件** — 消除 50+ 处内联 SVG 重复
2. **合并 Empty 状态组件** — 6 个相同模式的组件 → 1 个参数化组件
3. **抽象表单控件** — Editor 组件共享 label/input/textarea/actions 样式
4. **统一响应式断点** — 使用 App Store 中的 3 个标准断点替代 9 种自定义断点
5. **完善暗色模式** — 在 `variables.css` 中添加 `.dark` 变量覆盖
6. **减少 Naive UI `:deep()` 依赖** — 优先使用 Naive UI 的 theme 配置而非 CSS 穿透
7. **抽取通用 composable** — `useNavigation`、`useResponsive`、`useDataLoad`
8. **拆分大组件** — HeroSection、Home.vue、Profile.vue、DiaryEditor 超过 300 行的组件需拆分
