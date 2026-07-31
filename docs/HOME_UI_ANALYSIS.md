# 昌都记忆 V5.2 — 首页 Dashboard UI 结构分析

> **分析日期**：2026-07-30
> **范围**：`Home.vue` + 6 个 dashboard 子组件 + 2 个布局组件
> **原则**：只分析，不修改

---

## 1. Home.vue 当前结构

**文件**：`src/pages/Home.vue` — 509 行（254 行 script + 155 行 template + 100 行 style）

### 1.1 组件组成

```
Home.vue (509 行)
├── <script setup> (lines 1–103)        组件内部逻辑 + data loading
├── <template> (lines 105–229)
│   ├── <HeroSection />                 高原雪山 Hero 区
│   └── <div class="home__content">
│       ├── <div class="home__section-header">  日期标签 "7月30日 周三"
│       ├── <div class="home__today-grid">
│       │   ├── .today-card → 今日课程 (lines 121-140)
│       │   ├── .today-card → 今日待办 (lines 142-166)
│       │   └── .today-card--overview → 今日概览 (lines 169-184)
│       ├── <div class="home__section-header">   "快捷入口"
│       └── <div class="home__quick-actions">
│           └── button.quick-btn × 8 (lines 192-224)
│               └── internal v-if SVG chain (lines 199-221)
└── <style scoped> (lines 231-508)      纯手写 CSS + 响应式
```

### 1.2 关键问题

| # | 问题 | 严重度 |
|---|------|--------|
| 1 | **页面直接内联 3 张 "今日卡片"**（今日课程/待办/概览），未使用已有的 `SummaryCard` / `TodayMemoryCard` / `TimeCard`，导致 Dashboard 组件完全被绕过 | 🔴 高 |
| 2 | **8 个快捷入口的 SVG 图标用 110 行 v-if 链内联**（lines 199-221），每个入口 ~20 行 | 🔴 高 |
| 3 | **业务逻辑与 UI 耦合在页面中** — `QuickAction` / `SummaryCard` / `TodayMemoryCard` 组件存在但未被 Home.vue 使用 | 🔴 高 |
| 4 | **页面中加载了 5 个 Store**（works/todos/diary/expense/photo），但 `TodayMemoryCard` 组件内部同样独立加载 4 个 Store，存在 **双重加载** | 🟡 中 |
| 5 | 页面样式使用了 3 种自定义断点（400/599/600-899/900+），与 App Store 的 3 个标准断点不一致 | 🟡 中 |
| 6 | 页面作为 `max-width: 720px` 的居中窄列布局，未充分利用桌面端宽屏空间 | 🟢 低 |

---

## 2. 首页组件树

```
src/pages/Home.vue
│
├── src/components/dashboard/HeroSection.vue       (448 行) ✅ 已独立
│   └── 依赖: useTimeStore, useAuthStore
│
├── [内联] .today-card "今日课程"                    ❌ 未抽取
│   └── 依赖: workStore.todayWorks
│
├── [内联] .today-card "今日待办"                    ❌ 未抽取
│   └── 依赖: todoStore.todayTodos
│
├── [内联] .today-card--overview "今日概览"           ❌ 未抽取
│   └── 依赖: diaryStore, photoStore, todoStore, expenseStore
│
├── [内联] button.quick-btn × 8                     ❌ 未使用 QuickAction 组件
│   └── 8 个 SVG v-if 链 (lines 199-221)
│
├── [可选] QuickAction.vue                   (97 行) ✅ 已迁移 AppCard
├── [可选] SummaryCard.vue                  (189 行) ✅ 已迁移 AppCard
├── [可选] TodayMemoryCard.vue              (219 行) ✅ 已迁移 AppCard
├── [可选] TimeCard.vue                     (160 行) 🟡 仍用 NCard + gradient
├── [可选] QuoteCard.vue                     (25 行) 🟢 简单文本组件
│
└── src/layouts/DesktopLayout.vue / MobileLayout.vue
```

**核心矛盾**：Home.vue 有大量内联组件实现，但对应的独立组件（SummaryCard/TodayMemoryCard/QuickAction）已经存在且已被 Phase 1-2 迁移到新设计系统。Home.vue **完全没有使用它们**。

---

## 3. HeroSection 实现方式

**文件**：`src/components/dashboard/HeroSection.vue` — 448 行

### 3.1 结构分解

| 层 | 元素 | 实现方式 | 用途 |
|----|------|---------|------|
| 1 | `.hero__sky` | `position: absolute; inset: 0` + 7 段 linear-gradient (175deg) | 高原天空色带 |
| 2 | `.hero__mountain--far` | `clip-path: polygon(19 points)` + 4 段 linear-gradient | 远山 — 最淡 |
| 3 | `.hero__mountain--mid` | `clip-path: polygon(17 points)` + 4 段 linear-gradient | 中景山脉 |
| 4 | `.hero__mountain--near` | `clip-path: polygon(15 points)` + 5 段 linear-gradient | 近景山 — 最深 |
| 5 | `.hero__snow × 3` | `clip-path: polygon()` 雪顶碎片 | 白色雪冠 |
| 6 | `.hero__ground` | 底部 8% linear-gradient | 前景地面 |
| 7 | `.hero__greeting` | absolute 定位在顶部 | 问候语 |
| 8 | `.hero__card` | 毛玻璃：`backdrop-filter: blur(24px)` + 半透明白色 | 支教天数卡片 |
| 9 | `.hero__scroll-hint` | `@keyframes bounce` 动画 | 滚动提示 |

### 3.2 设计特点

- **纯 CSS 艺术**：零图片依赖，所有视觉效果由 CSS 生成
- **颜色体系独立**：天空渐变 + 山脉渐变使用专属色值，与 Design Token 无关联
- **毛玻璃卡片**：`backdrop-filter: blur(24px)` 是视觉焦点，内含天数/进度条/日期范围
- **响应式**：3 个断点 (≤767, default, ≥1200)，分别调整整体高度、山地高度、卡片 padding、字号

### 3.3 数据依赖

- `useTimeStore` — `daysPassed` / `progress` / `daysRemaining` / `profile`
- `useAuthStore` — `user.email` → 用户名

### 3.4 可重构方向

| 方向 | 说明 |
|------|------|
| **保留 CSS 艺术层** | 天空/山脉 clip-path 是标志性视觉，保留 |
| **毛玻璃卡片抽象** | 进度条/天数/日期可独立为 `<HeroStatsCard>` 子组件 |
| **山脉颜色适配** | 当前山脉蓝灰色系与旧主题 `#5E81AC` 协调，需调整为与新色 `#4A8C94` 协调 |

---

## 4. 快捷入口实现方式

### 4.1 Home.vue 内联实现（当前在用）

```vue
<!-- lines 83-92: 数据定义 -->
const quickActions = [
  { id: 'diary',    label: '写日记',   icon: 'pen',       route: '/diary/new' },
  { id: 'schedule', label: '课程表',   icon: 'calendar',  route: '/work' },
  { id: 'todo',     label: '待办清单', icon: 'checklist', route: '/todo' },
  { id: 'students', label: '学生档案', icon: 'people',    route: '/location' },
  { id: 'expense',  label: '支出记录', icon: 'expense',   route: '/expense' },
  { id: 'income',   label: '收入记录', icon: 'income',    route: '/expense/new' },
  { id: 'events',   label: '大事记',   icon: 'star',      route: '/memory' },
  { id: 'time',     label: '时光中心', icon: 'clock',     route: '/time-center' },
]

<!-- lines 192-224: 8 个按钮，每个用一个长 v-if 链渲染 SVG -->
<button v-for="act in quickActions" :key="act.id" class="quick-btn" @click="goTo(act.route)">
  <div class="quick-btn__icon">
    <svg v-if="act.icon==='pen'">...</svg>       <!-- 8 lines -->
    <svg v-else-if="act.icon==='calendar'">...</svg>  <!-- 8 lines -->
    <svg v-else-if="act.icon==='checklist'">...</svg> <!-- 6 lines -->
    <!-- ... 5 more v-else-if chains ... -->
  </div>
  <span class="quick-btn__label">{{ act.label }}</span>
</button>
```

### 4.2 QuickAction.vue 独立组件（存在但未被 Home.vue 使用）

```vue
<!-- 6 个按钮，用 emoji 做图标，无 SVG -->
const actions: Action[] = [
  { label: '写日记', icon: '📝', route: '/diary' },
  { label: '今日待办', icon: '✅', route: '/todo' },
  { label: '记录花费', icon: '💰', route: '/expense' },
  { label: '时光中心', icon: '⏰', route: '/time-center' },
  { label: '年度统计', icon: '📊', route: '/statistics' },
  { label: '全局搜索', icon: '🔍', route: '/search' },
]
```

### 4.3 两套快捷入口差异

| 差异点 | Home.vue 内联版 | QuickAction 组件版 |
|--------|----------------|-------------------|
| 数量 | 8 个 | 6 个 |
| 图标 | 内联 SVG v-if 链 | Emoji |
| 路由目标 | `/diary/new` (写日记) | `/diary` (日记列表) |
| 布局 | 4 列 → 2 列响应式 | 6 列 → 3 列响应式 |
| 缺少项 | — | 无"学生档案"/"收入记录" |
| 多余项 | "学生档案"/"收入记录"/"大事记" | 无 |

---

## 5. SummaryCard 布局

### 5.1 当前状态（Phase 2 已迁移至 AppCard）

- **已使用** `AppCard` + `AppSection`
- 3 列 grid：`今日待办 | 今日花费 | 最近日记`
- 数据来源：`diaryStore.getLatestDiary()` + `todoStore.loadTodayTodos()` + `expenseStore.loadTodayExpenses()`
- 每个 item 可点击跳转到对应页面

### 5.2 Home.vue 中的冲突

Home.vue 内联了相同功能的 `.today-card--overview`（4 列统计：日记/照片/待办/花费），与 SummaryCard（3 列：待办/花费/日记）功能重叠但布局不同。

**Home.vue 中完全未引用 SummaryCard**。

---

## 6. TodayMemoryCard

### 6.1 当前状态（Phase 2 已迁移至 AppCard）

- **已使用** `AppCard` + 内嵌 `AppEmpty`
- 功能：显示当日地点 / 工作（NTag）/ 日记 / 照片数量
- 空状态：AppEmpty "今天还没有记录"
- 数据来源：独立加载 4 个 Store（diary/work/location/photo）

### 6.2 Home.vue 中的冲突

Home.vue 内联了 `.today-card`（今日课程）和 `.today-card`（今日待办），与 TodayMemoryCard 的"今天的记录"功能重叠。TodayMemoryCard 聚合了 4 种今日数据，而 Home.vue 版本拆分成了 3 张独立卡片。

---

## 7. TimeCard

### 7.1 当前状态（仍使用 NCard）

```vue
<NCard class="time-card" hoverable @click="goToTimeCenter">
  <!-- 渐变背景 + 白色文字 → 支教天数 + NProgress + location -->
</NCard>
```

- 渐变背景色：`linear-gradient(135deg, var(--color-primary), #3D7A82)` — **已适配新色**
- 数据来源：`useTimeStore`（daysPassed / progress / phase / location）
- 仍使用 NCard（未迁移到 AppCard）—— 因为此卡是全色渐变背景，AppCard 的白色背景不适用

### 7.2 Home.vue 中的关系

Home.vue 中 **没有引用 TimeCard**。HeroSection 的毛玻璃卡片已经包含了支教天数倒计时（`timeStore.daysPassed` / `timeStore.progress` / `timeStore.daysRemaining`）。

**HeroSection 与 TimeCard 功能完全重叠**。

---

## 8. 响应式问题

### 8.1 断点碎片化

Home.vue 中使用的 4 种断点：

| 断点 | 位置 | 效果 |
|------|------|------|
| `max-width: 400px` | Home.vue:502 | 缩小 padding |
| `max-width: 599px` | Home.vue:470 | quick-action 2 列 |
| `600px–899px` | Home.vue:474 | today-grid 2 列 |
| `min-width: 900px` | Home.vue:478 | 加宽 max-width 到 860px + grid 布局 |

App Store 的标准断点：
- `< 768` — mobile
- `768–1199` — tablet
- `>= 1200` — desktop

**Home.vue 的断点与 App Store 完全不重合**。

### 8.2 HeroSection 中使用的断点

| 断点 | 效果 |
|------|------|
| `max-width: 767px` | 降低高度 / 缩小字号 / 压低山脉 |
| `min-width: 1200px` | 增高 / 增大字号 |

### 8.3 布局宽度问题

- Home.vue `.home__content` 使用 `max-width: 720px`（桌面 860px），居中窄列
- DesktopLayout 侧边栏已占 240px，内容区 padding 24px
- 在大屏上 (1440px+)，内容区只有中间 ~720px 被使用，左右大量留白

---

## 9. 哪些组件需要重写

### 🔴 必须重写

| 组件 | 原因 |
|------|------|
| **Home.vue (page)** | 509 行臃肿文件；3 张今日卡片内联未使用已有组件；SVG v-if 链；与 QuickAction/SummaryCard/TodayMemoryCard 完全重复 |
| **HeroSection — 毛玻璃卡片** | 与 TimeCard 功能完全重叠；应拆出 `<HeroStatsCard>` 共用组件 |

### 🟡 建议重写

| 组件 | 原因 |
|------|------|
| **QuickAction.vue** | 当前 6 项 vs Home.vue 8 项；统一为 8 项 + AppIcon 替代 emoji |
| **TodayMemoryCard.vue** | 仍用 NTag；可迁移为纯 AppCard 内联标签 |
| **TimeCard.vue** | 仍用 NCard + `:deep()`；可迁移为 AppCard borderless |

### 🟢 可以保留

| 组件 | 原因 |
|------|------|
| **HeroSection — CSS 艺术层** | 天空/山脉 clip-path 是品牌标志性视觉，无需大改，仅微调配色 |
| **QuoteCard.vue** | 25 行简单组件，功能单一 |
| **SummaryCard.vue** | Phase 2 已完成 AppCard 迁移，数据逻辑独立 |
| **DesktopLayout / MobileLayout** | 布局逻辑独立，不属 Home 页面范围 |

---

## 10. 哪些组件可以保留

| 组件 | 理由 | 状态 |
|------|------|------|
| **HeroSection.vue** | CSS 艺术视觉是品牌标识，留用；仅需将毛玻璃卡片抽象为子组件 | ✅ 保留 |
| **QuoteCard.vue** | 纯展示组件，25 行，无需改动 | ✅ 保留 |
| **SummaryCard.vue** | Phase 2 已完成 AppCard 迁移 | ✅ 保留 |
| **TodayMemoryCard.vue** | Phase 2 已完成 AppCard 迁移 | ✅ 保留 |
| **QuickAction.vue** | Phase 2 已完成 AppCard 迁移；需扩展动作项 | ✅ 保留（微调） |
| **TimeCard.vue** | NCard → AppCard borderless | 🟡 保留（小改） |

---

## 11. 重构方案建议

### 目标结构

```
Home.vue (~150 行)
├── <div class="home">
│   ├── <HeroSection />              (已有，保留 CSS 艺术层)
│   │   └── <HeroStatsCard />        (新：毛玻璃卡片抽象)
│   ├── <div class="home__content">
│   │   ├── <AppSection title="今日概览">
│   │   │   └── <SummaryCard />      (已有，替换内联 .today-card ×3)
│   │   ├── <AppSection title="快捷入口">
│   │   │   └── <QuickAction />      (已有，替换 8 个内联 v-if SVG)
│   │   ├── <TodayMemoryCard />      (已有，替换内联今日记录)
│   │   └── <QuoteCard />            (已有)
```

### 收益

| 指标 | 现状 | 目标 |
|------|------|------|
| Home.vue 行数 | 509 | ~150 |
| Dashboard 组件复用率 | 0%（组件存在但未用） | 100% |
| SVG v-if 链 | 110 行 | 0 行（AppIcon 替代） |
| 重复 Store 加载 | 2 次（Home + TodayMemoryCard） | 1 次（组件内部） |
| 响应式断点统一 | 4 种不同断点 | 3 种标准断点 |
| 内联今日卡片 | 3 张独立卡片 | SummaryCard + TodayMemoryCard 替代 |

### 风险

| 风险 | 说明 |
|------|------|
| **数据加载变化** | Home.vue 当前在 `onMounted` 中预加载 5 个 Store；迁移后数据加载将由各子组件自行管理。需确保首次渲染体验不退化 |
| **HeroSection 毛玻璃卡片与 TimeCard 功能重叠** | 两者都显示天数/进度/剩余天数。重构时需要决定哪个是主入口 |
| **QuickAction 项数不同** | 需决策：8 项（当前 Home.vue）还是 6 项（当前 QuickAction 组件）。建议 8 项以保持功能完整 |
| **TodayMemoryCard.replace NTag** | TodayMemoryCard 中使用 NTag 显示工作时段，如需消除 NTag 可改用纯 CSS 标签 |
