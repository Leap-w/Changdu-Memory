# 昌都记忆 Changdu Memory V5.0 — 开发现状

> 最新更新: 2026-07-29  
> 版本: V5.0  
> Build: `npm run build` ✅ 0 errors  
> Lint: `eslint` ✅ 0 errors (3 `any` warnings in TagRepository, intentional)

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
| 图片压缩 | Canvas API (自研 `src/utils/image.ts`) | — |
| Excel | SheetJS (xlsx) | latest |
| PWA | vite-plugin-pwa | ^0.21 |
| 代码规范 | ESLint + Prettier | — |

### 关键设计决策

- **不使用任何图表库**（统计全部用纯 CSS 条形图/占比条）
- **不使用地图 SDK**（地点系统是档案，不是地图）
- **不使用富文本编辑器**（日记用 textarea）
- **不接入 AI**

---

## 3. 项目文件结构

```
昌都记忆/
├── .env                        # Supabase 配置（.gitignore）
├── .env.example                # 环境变量模板
├── .gitignore
├── .prettierrc                 # Prettier 配置
├── .vscode/                    # VS Code 推荐配置
├── README.md
├── V5_STATUS.md                # ← 本文件
├── env.d.ts                    # TypeScript 环境类型声明
├── eslint.config.js            # ESLint flat config
├── index.html                  # 入口 HTML
├── package.json
├── tsconfig.json / .app.json / .node.json
├── vite.config.ts              # Vite + PWA + @ 别名
├── public/
│   └── favicon.svg
├── supabase/
│   └── schema.sql              # 完整数据库 Schema（权威参考）
└── src/
    ├── App.vue                 # 根组件：已登录→布局 / 未登录→路由
    ├── main.ts                 # 入口：Pinia + Router + authStore.initialize()
    ├── assets/
    ├── components/
    │   ├── dashboard/          # 首页组件 (5)
    │   │   ├── QuickAction.vue
    │   │   ├── QuoteCard.vue
    │   │   ├── SummaryCard.vue
    │   │   ├── TimeCard.vue
    │   │   └── TodayMemoryCard.vue
    │   ├── diary/              # 日记组件 (3)
    │   │   ├── DiaryCard.vue
    │   │   ├── DiaryEditor.vue
    │   │   └── DiaryEmpty.vue
    │   ├── expense/            # 花费组件 (3)
    │   │   ├── ExpenseCard.vue
    │   │   ├── ExpenseEditor.vue
    │   │   └── ExpenseEmpty.vue
    │   ├── import/             # 导入组件 (2)
    │   │   ├── ImportCard.vue
    │   │   └── ImportPreview.vue
    │   ├── location/           # 地点组件 (3)
    │   │   ├── LocationCard.vue
    │   │   ├── LocationEditor.vue
    │   │   └── LocationEmpty.vue
    │   ├── photo/              # 照片组件 (3)
    │   │   ├── PhotoCard.vue
    │   │   ├── PhotoEditor.vue
    │   │   └── PhotoEmpty.vue
    │   ├── search/             # 搜索组件 (3)
    │   │   ├── SearchFilter.vue
    │   │   ├── SearchInput.vue
    │   │   └── SearchResultCard.vue
    │   ├── statistics/         # 统计组件 (7)
    │   │   ├── OverviewCard.vue
    │   │   ├── MonthlyTrend.vue
    │   │   ├── CategoryPie.vue
    │   │   ├── WorkSummary.vue
    │   │   ├── ExpenseSummary.vue
    │   │   ├── LocationSummary.vue
    │   │   └── TagRanking.vue
    │   ├── tag/                # 标签组件 (1)
    │   │   └── TagSelector.vue
    │   ├── todo/               # 待办组件 (3)
    │   │   ├── TodoCard.vue
    │   │   ├── TodoEditor.vue
    │   │   └── TodoEmpty.vue
    │   └── work/               # 工作组件 (3)
    │       ├── WorkCard.vue
    │       ├── WorkEditor.vue
    │       └── WorkEmpty.vue
    ├── layouts/
    │   ├── MobileLayout.vue    # 底部导航 5 项
    │   └── DesktopLayout.vue   # 侧边栏 15 项
    ├── pages/                  # 30 个页面
    │   ├── Login.vue           # 登录/注册
    │   ├── Home.vue            # 首页 Dashboard
    │   ├── TimeCenter.vue      # 时光倒计时
    │   ├── Diary.vue           # 日记列表(按月分组)
    │   ├── DiaryEdit.vue       # 日记创建/编辑
    │   ├── DiaryDetail.vue     # 日记详情
    │   ├── Todo.vue            # 待办(今日/未来/已完成)
    │   ├── TodoEdit.vue        # 待办创建/编辑
    │   ├── Work.vue            # 工作(日期→上午/下午/晚上)
    │   ├── WorkEdit.vue        # 工作创建/编辑
    │   ├── Expense.vue         # 花费(按日期分组+月度总计)
    │   ├── ExpenseEdit.vue     # 花费创建/编辑
    │   ├── Location.vue        # 地点(按类型分组)
    │   ├── LocationEdit.vue    # 地点创建/编辑
    │   ├── LocationDetail.vue  # 地点详情+关联照片
    │   ├── Photo.vue           # 照片网格(分类+月份筛选)
    │   ├── PhotoEdit.vue       # 照片上传/编辑
    │   ├── PhotoDetail.vue     # 大图浏览+左右切换+标签+地点
    │   ├── PhotoTimeline.vue   # 照片时间轴
    │   ├── Profile.vue         # 我的(用户信息+快捷入口)
    │   ├── Settings.vue        # 设置(导出/导入/统计/搜索/回收站)
    │   ├── TagManage.vue       # 标签管理
    │   ├── Import.vue          # 数据导入(Excel + JSON)
    │   ├── Statistics.vue      # 年度数据统计
    │   ├── Search.vue          # 全局搜索
    │   ├── MemoryTimeline.vue  # 记忆时间轴(全模块)
    │   ├── RecycleBin.vue      # 回收站
    │   └── Statistics.vue
    ├── repositories/           # 数据访问层 (8)
    │   ├── DiaryRepository.ts
    │   ├── TodoRepository.ts
    │   ├── ExpenseRepository.ts
    │   ├── WorkRepository.ts
    │   ├── LocationRepository.ts
    │   ├── PhotoRepository.ts
    │   ├── TimeRepository.ts
    │   └── TagRepository.ts
    ├── stores/                 # Pinia Store (10)
    │   ├── auth.ts / app.ts
    │   ├── diary.ts / todo.ts / expense.ts / work.ts
    │   ├── location.ts / photo.ts / tag.ts / time.ts
    ├── router/
    │   └── index.ts            # 37 条路由
    ├── services/
    │   └── supabase.ts         # Supabase Client + Auth 函数
    ├── types/
    │   └── database.ts         # 完整 TS 类型（12 表）
    ├── styles/
    │   ├── variables.css       # 昌都记忆主题变量
    │   └── global.css          # 全局重置
    └── utils/                  # 纯函数工具集 (6)
        ├── export.ts           # JSON 导出
        ├── image.ts            # 图片验证 + Canvas 压缩
        ├── import.ts           # Excel 解析 + 验证
        ├── search.ts           # 纯内存搜索
        ├── statistics.ts       # 统计数据计算
        └── templates.ts        # Excel 模板生成
```

---

## 4. 数据库

### Supabase 项目

- **Project ID**: `wohimmwwcvwsgqjeqwnd`
- **URL**: `https://wohimmwwcvwsgqjeqwnd.supabase.co`
- **Auth**: Email + Password (Provider enabled)
- **Storage**: `photos` bucket (private, RLS protect)

### 数据库表 (12)

| 表 | 用途 | 关键字段 | 软删除 |
|----|------|---------|--------|
| `profiles` | 用户信息 | id(=auth.users), nickname, avatar_url | ❌ |
| `time_profile` | 时间配置 | user_id(UNIQUE), start_date, end_date, location | ❌ |
| `diaries` | 日记 | diary_date, title, content | ✅ deleted_at |
| `todos` | 待办 | todo_date, title, priority, category, completed | ✅ deleted_at |
| `expenses` | 花费 | expense_date, amount(NUMERIC), category, description | ✅ deleted_at |
| `work_plans` | 工作 | work_date, title, period, category, content | ✅ deleted_at |
| `locations` | 地点 | name, location_type, visit_date, address | ✅ deleted_at |
| `photo_records` | 照片 | storage_path, photo_date, category, location_id→locations | ✅ deleted_at |
| `tags` | 标签 | name(UNIQUE per user), color | ❌ |
| `diary_tags` | 日记←标签 | diary_id→diaries, tag_id→tags(双CASCADE) | ❌ |
| `photo_tags` | 照片←标签 | photo_id→photo_records, tag_id→tags | ❌ |
| `location_tags` | 地点←标签 | location_id→locations, tag_id→tags | ❌ |

### 完整 Schema

参考 `supabase/schema.sql`，可直接在 Supabase SQL Editor 中执行。

---

## 5. 路由表 (37 条)

```
/login                    Login（未登录首页）
/                         Home（已登录首页）
/time-center              TimeCenter
/todo                     Todo（列表）
/todo/new                 TodoCreate
/todo/:id/edit            TodoEdit
/work                     Work（列表）
/work/new                 WorkCreate
/work/:id/edit            WorkEdit
/expense                  Expense（列表）
/expense/new              ExpenseCreate
/expense/:id/edit         ExpenseEdit
/diary                    Diary（列表）
/diary/new                DiaryCreate
/diary/:id                DiaryDetail
/diary/:id/edit           DiaryEdit
/location                 Location（列表）
/location/new             LocationCreate
/location/:id             LocationDetail
/location/:id/edit        LocationEdit
/photo                    Photo（列表+筛选）
/photo/timeline           PhotoTimeline
/photo/new                PhotoCreate
/photo/:id                PhotoDetail
/photo/:id/edit           PhotoEdit
/profile                  Profile（用户信息）
/import                   Import（Excel+JSON）
/statistics               Statistics（年度统计）
/search                   Search（全局搜索）
/memory                   MemoryTimeline（记忆时间轴）
/settings                 Settings（设置入口）
/settings/tags            TagManage（标签管理）
/settings/recycle-bin     RecycleBin（回收站）
/:pathMatch(.*)*          → redirect /
```

全部路由使用 `meta.requiresAuth: true`，通过 `router.beforeEach` 守卫保护。

---

## 6. 数据流架构

所有模块严格遵循：

```
View (Vue Component)
  ↓
Pinia Store (stores/*.ts)
  ↓
Repository (repositories/*.ts)
  ↓
Supabase (PostgreSQL / Storage)
```

**硬规则**：
- Vue 页面**禁止**直接调用 `supabase`
- Vue 页面**禁止**直接导入 Repository
- 所有数据操作必须通过 Store
- 统计和搜索全部基于内存 `computed`，不发起网络请求

---

## 7. 功能模块总览

| 模块 | 页面数 | Store | Repository | DB表 | 状态 |
|------|--------|-------|-----------|------|------|
| 认证 | 1 | auth | supabase.ts | auth.users + profiles | ✅ |
| 时间 | 1 | time | TimeRepository | time_profile | ✅ |
| 首页 | 1 | app + 各Store | — | 汇总 | ✅ |
| 日记 | 3 | diary | DiaryRepository | diaries | ✅ |
| 待办 | 2 | todo | TodoRepository | todos | ✅ |
| 工作 | 2 | work | WorkRepository | work_plans | ✅ |
| 花费 | 2 | expense | ExpenseRepository | expenses | ✅ |
| 地点 | 3 | location | LocationRepository | locations | ✅ |
| 照片 | 4 | photo | PhotoRepository | photo_records + Storage | ✅ |
| 标签 | 1 | tag | TagRepository | tags + 3关联表 | ✅ |
| 设置 | 1 | auth | export.ts | — | ✅ |
| 导入 | 1 | 复用意Store | import.ts + templates.ts | — | ✅ |
| 统计 | 1 | 全部Store | statistics.ts | — | ✅ |
| 搜索 | 1 | 全部Store | search.ts | — | ✅ |
| 时间轴 | 1 | 4个Store | — | — | ✅ |
| 回收站 | 1 | — | 6个Repository | — | ✅ |
| 个人中心 | 1 | auth | — | — | ✅ |

---

## 8. 关键特性

### 软删除 + 回收站（Phase 6-F）
- 6 张业务表全部有 `deleted_at` 字段
- Store 的 `remove()` 调用 `softDelete*()` → `UPDATE deleted_at = now()`
- 回收站聚合 6 模块 + 恢复 + 永久删除
- Photo 永久删除还删除 Storage 文件

### 图片压缩（Phase 4-B）
- `src/utils/image.ts`: Canvas API 缩放至 ≤1920px，JPEG quality 0.8
- 限制类型: jpg/png/webp，限制大小: 5MB
- Storage 路径: `{userId}/{timestamp}-{random}.ext`

### 纯内存搜索（Phase 6-E）
- `src/utils/search.ts`: CJK 2-gram 分词 + 子串匹配
- `globalSearch()` 聚合 4 模块 + 标签反向查询
- 300ms 输入防抖（SearchInput 组件）
- 零 Supabase 请求

### 数据导出/导入（Phase 5/6-B）
- JSON 导出: `src/utils/export.ts` 并行拉取全部数据
- Excel 导入: SheetJS + 5 套模板 + 逐行验证
- JSON 恢复: 解析 `昌都记忆_backup.json`，逐条调用 Store

### PWA
- vite-plugin-pwa 生成 Service Worker
- manifest: name="昌都记忆 Changdu Memory"，theme_color=#4F8EF7
- 首页顶部有在线/离线状态指示器

---

## 9. 主题设计

```css
/* 主色 - 高原蓝 */
--color-primary: #4F8EF7;
--color-secondary: #57B894; /* 草原绿 */
--color-bg: #F7F9FC;        /* 背景 */
--radius-card: 16px;
--radius-button: 12px;
--spacing-page: 24px;
--spacing-card: 16px;
--shadow-card: 0 2px 8px rgba(0,0,0,0.06);
```

---

## 10. 开发命令

```bash
npm run dev        # 开发服务器 → http://localhost:5173
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm run lint       # ESLint 检查
npm run format     # Prettier 格式化
npm run type-check # TypeScript 类型检查
```

---

## 11. 环境变量

```bash
# .env（已在 .gitignore 中）
VITE_SUPABASE_URL=https://wohimmwwcvwsgqjeqwnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 12. 部署

- **前端**: Vercel（自动部署，`npm run build` → `dist/`）
- **后端**: Supabase（不用自建服务器）
- **源码**: GitHub

### Vercel 配置
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 13. 已知限制

1. 单用户系统（所有数据 `user_id = auth.uid()`）
2. 不支持同时登录多设备（非多租户）
3. Profile.vue 基础版（仅显示邮箱+注册时间）
4. 照片导出仅含 metadata（storage_path），不含文件
5. 没有测试代码（TypeScript 类型检查 + ESLint 作为主要质量保障）
