# 昌都记忆 Changdu Memory v5.1.3 — 开发状态

> 最新更新: 2026-08-11
> 版本: v5.1.3
> Build: `npm run build` ✅ 0 errors
> Type Check: `vue-tsc -b --noEmit` ✅ 0 errors
> Lint: `eslint` ✅ 0 errors

---

## 1. 项目定位

个人支教数字档案系统。记录一年西藏昌都支教期间的时间、日记、工作、待办、花费、地点、照片、标签、心情。PWA + 云同步（Supabase），手机和 PC 双端。

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

## 3. v5.1.3 更新摘要

### 全站图标统一
- 所有「昌」字圆形 logo（顶部导航 / 登录页 / 我的页品牌卡）改用用户提供的图片 `public/icon-180.png`
- favicon 改用 PNG（`favicon.png` / `icon-16.png`），移除蓝色占位 `favicon.svg`

### 首页优化
- Hero 右侧倒计时卡片固定 240px 紧凑宽度（移动端 100% 堆叠）
- 时间区日期字体加大至 32px、星期加大，新增农历日期（`utils/lunar.ts`）
- 日期/星期/农历统一由单个 `now` 响应式状态 + 30s 定时器驱动，跨午夜自动更新

### 日期时区修复 + 中文统一
- 修复选 31 日保存变 30 日 bug：`toISOString()` 是 UTC，中国时区下本地 31 日被存成 30 日；新增 `utils/date.ts` 本地时区安全工具替换全站转换
- `NConfigProvider` 配置 `zhCN + dateZhCN`，所有日期/时间选择器面板显示中文
- 日记/账本/福利/课表的原生 `<input type="date/time">` 统一为 `NDatePicker` / `NTimePicker`

### 保活机制
- 新增 `api/keepalive.ts` + Vercel Cron 每日保活，防止 Supabase 免费项目 7 天无活动被暂停（需配置 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`）

### 行政安排增强
- 支持编辑（`/work/:id/edit` 路由 + store `updateWork`）；新增开始/结束时间（`work_plans.start_time/end_time` 选填，`schema.sql` 第 27 段迁移）
- 列表新增编辑按钮 + 多选批量删除（`softDeleteWorks` 软删除，进回收站）

### 待办增强
- TodoCard 毛玻璃化统一 UI、截止时间图标与文字垂直居中对齐
- hover 显示编辑/删除按钮；多选批量删除（store 已有 `batchDelete`）；全选覆盖全部待办

### 其他修复
- 课程表默认科目 政治 → 数学；「我的」支教时光卡片深色模式背景修复

### 项目清理
- 删除死文件：`AppFab.vue`、未用函数 `fetchMonthExpenses`/`fetchWorksByDate`、`CATEGORY_ICONS`、`--z-fab` 令牌、未引用 PNG 图标、空目录
- 移除仅内部使用的 `export` 关键字；移除未接线的 eslint-prettier 依赖

---

## 4. V5.5.2 更新摘要

### 我的页功能入口重构
- 分组调整为「常用功能」（今日心情/全局搜索/大事记/年度统计，右侧下方）与「系统管理」（深色模式/数据管理/回收站，左侧关于卡片上方）
- 每个分组独立圆角毛玻璃卡片，分组标题放卡片内，入口单列
- 「退出登录」移入账号管理弹窗底部（红色按钮）
- 删除「关于昌都记忆」菜单入口
- 布局：双栏 `4fr/8fr` + `align-items: stretch`；「支教时光」「在昌都的印记」flex-grow 拉高，使「常用功能」底部与左侧「关于」卡片底部对齐

### 大事记重构
- 取消固定分类：删除页面分类导航栏；`memories.category` 保留兼容（统一存 `life`），新增 `memories.location` 自定义地点/地址
- 编辑弹窗「分类」→「地点/地址」输入框；卡片显示地点标签
- 页顶改为「大事记 / 一年旅程」双 Tab（默认大事记）

### 一年旅程日期化
- `journey_milestones` 由 `position`（百分比）改为 `start_date`（各阶段开始日期）
- 默认节点按旅程起止日期比例推算（启程=开始日 … 归程=结束日）
- 设置弹窗用日期选择器；时间线显示 `YYYY.MM.DD`；当前阶段 = 开始日期 ≤ 今天 的最后节点

### 今日心情数据库化
- localStorage → `moods` 表（一天多条，含设置时间点，可删除）
- 新增 `mood_options` 自定义心情选项（名称 + emoji 选择器）
- 预设调整：删「平静」，「期待🤩」→「饿🍜」
- 首页卡片显示今日最新一条（created_at 倒序首条）

### 首页 Hero
- 倒计时卡片可自定义选择展示（默认「距离返程」+ 时光自定义倒计时），选择记忆在 localStorage

### 时光页
- 大事记展示优化：标题 + 放大日期一行，📍地点标签放标题下方

---

## 5. 路由

| 路径 | 页面 | 认证 |
|------|------|------|
| `/login` | 登录 | 游客 |
| `/` | 首页 | 可选 |
| `/diary` `/diary/:id` `/diary/:id/edit` `/diary/new` | 日记 | 需登录 |
| `/work` `/work/new` | 工作 / 添加行政安排 | 需登录 |
| `/expense` `/expense/:id/edit` `/expense/new` | 账本 | 需登录 |
| `/time-center` | 时光中心 | 需登录 |
| `/memory` | 大事记（大事记 / 一年旅程 Tab） | 需登录 |
| `/todo` `/todo/:id/edit` `/todo/new` | 待办 | 需登录 |
| `/mood` | 今日心情 | 需登录 |
| `/profile` | 我的 | 需登录 |
| `/search` | 搜索 | 可选 |
| `/statistics` | 年度统计 | 需登录 |
| `/import` | 数据导入 | 需登录 |
| `/settings` | 设置 | 需登录 |
| `/settings/recycle-bin` | 回收站 | 需登录 |

> **已移除**：`/settings/tags`（标签管理）。
> **V5.5.2 变更**：`/mood` 由可选改为需登录（数据入库）。
> **v5.1.3 变更**：行政安排新增 `/work/:id/edit` 编辑路由；待办批量选择删除。

---

## 6. 暗色模式

- 设计令牌层面已完成（`variables.css` 中 `.dark` 规则覆盖所有颜色变量）
- 通过页面顶栏/我的页或设置页的深色模式开关切换
- 部分纯 CSS 装饰（Hero 雪山渐变、Wallet 渐变卡）在暗色模式下保留原效果（可后续逐页调优）

## 7. 数据库迁移（V5.5.2）

```sql
-- profiles 增加学校/科目字段（V5.5.1）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject TEXT;

-- memories 增加 location（大事记自定义地点）
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

-- journey_milestones 一年旅程节点（V5.5.2：position 百分比 → start_date 日期）
ALTER TABLE public.journey_milestones ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.journey_milestones DROP COLUMN IF EXISTS position;

-- 完整建表（journey_milestones / moods / mood_options）见 supabase/schema.sql 第 22/24/25 段
```

## 8. 已知限制

- 统计分类图标（如 CATEGORY_ICONS）仍保留 emoji 映射但已不再使用
- 暗色模式下部分渐变装饰卡（Hero / Wallet）保持亮色原效果
