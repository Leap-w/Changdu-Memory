# 昌都记忆 Changdu Memory v5.1.6 — 开发状态

> 最新更新: 2026-08-11
> 版本: v5.1.6
> Build: `npm run build` ✅ 0 errors
> Type Check: `vue-tsc -b --noEmit` ✅ 0 errors
> Lint: `eslint` ✅ 0 errors（106 条历史 warning）

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

## 3. v5.1.6 更新摘要

### 记账添加按钮置顶
- 账本页 4 个 Tab（支出/收入/资产/福利）的「记一笔 / 添加资产 / 添加福利」按钮从列表底部移到列表上方，记录多时无需滑到底部即可新增
- 空态仍显示居中按钮；`.expense-page__actions` 由 `margin-top` 改为 `margin-bottom`

### 支出分类「学习」→「工作」（DB key `study` → `work`）
- 编辑页分类、账本卡片图标/标签/配色、分类占比、统计页、Excel 导出标签、导入校验全部同步
- 图标由 `book` 改为 `briefcase`（工作/公文包）
- **需手动执行迁移（schema.sql 第 30 段；先 DROP 约束再 UPDATE 数据，否则旧约束会拦下 study→work 的 UPDATE 报 23514）**：
  ```sql
  ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
  UPDATE public.expenses SET category = 'work' WHERE category = 'study';
  ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
    CHECK (category IN (
      'food', 'transport', 'shopping', 'accommodation', 'work', 'entertainment', 'medical', 'other',
      'salary', 'subsidy', 'bonus', 'part_time', 'red_packet', 'second_hand'
    ));
  ```

### 花费 Excel 导入模板对齐系统
- 模板由 4 列扩展为 6 列：`日期 / 类型(支出·收入) / 分类 / 金额 / 备注 / 时间(HH:mm)`
- 导入校验：支持收入分类（工资/补贴/奖金/兼职/红包/出二手/其他）、时间格式校验（HH:mm），类型为空默认支出
- `Import.vue` 透传 `type` 与 `expense_time`，可导入收入记录与具体时间

### 工作 Excel 导入校验与 DB 对齐
- 工作分类校验由旧 `teaching/meeting/training/other` 对齐为 DB 现行 `meeting/exam_supervision/training/activity/other`（v5.1 起 teaching 已迁移到 other）
- 模板示例分类 `teaching` → `activity`；导入透传 `period`/`category`（此前被丢弃）

### JSON 全量导出 / 恢复补全
- 「导出所有数据」由 8 张表扩展至全部 21 张表：新增 学生/课程表/资产/福利/大事记/心情/地点/照片/倒计时/旅程节点/心情选项（未建表安全跳过）
- JSON 恢复由 4 模块扩至 10 模块：新增 学生/课程表/资产/福利/大事记/心情（心情保留原 mood_date）
- 暂不恢复（关联关系复杂）：地点+照片、日记照片、大事记照片、标签关联、倒计时、旅程节点、心情自定义选项

### 杂项
- 设置页数据导入描述与支持模块对齐
- 版本号统一为 5.1.6

---

## 3a. v5.1.5 更新摘要

### 账本编辑体验修复
- **修复编辑记录原信息不显示**：根因是 `ExpenseEdit` 里 `expenseStore.expenses.find()` 是同步操作，`loading` 在同一 tick 内翻转，`v-if="!loading"` 的子组件 `ExpenseEditor` 从未真正卸载重挂，其本地 ref 停留在首次挂载的默认值。修复：`ExpenseEditor` 增加 `watch`（immediate）同步 props → 本地状态；编辑页新增 `store.getExpenseById`（缓存未命中时直连数据库 `fetchExpenseById`），刷新/直达编辑页也能正常预填
- **编辑页新增删除**：底部危险操作区「删除这条记录」按钮（软删除进回收站，`confirm` 确认），与保存操作明确区分
- **账本 Tab 返回定位**：记一笔/编辑/删除后统一 `router.push('/expense?type=income|expense')`，`Expense.vue` 按 query 定位初始 Tab（进入后 `router.replace` 清理 query）
- **收入 Tab 进入记一笔默认收入**：`goCreate()` 把当前 Tab 写入 `?type=` query，`ExpenseEdit.formType` 读取并传给编辑器

### 账本具体时间（HH:mm）
- `expenses` 表新增 `expense_time TEXT`（选填，'HH:mm'）；编辑页 `NTimePicker`，新建默认当前时刻、编辑预填已有时间（旧记录无时间则留空）
- 卡片显示时间（分类旁小字），同日多条按时间倒序（无时间排最后）；`fetchExpenses` 排序加入 `expense_time`，store 侧 `sortExpenses` 保证新增/编辑后有序
- 需手动执行迁移：`ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_time TEXT;`

### 账本数据导出 Excel
- 数据管理入口（「我的」系统管理 → 数据管理 → 导出数据，或设置页 → 数据管理 → 导出）新增**小弹窗**，两个选项：
  - **导出所有数据**：沿用原完整 JSON 备份（日记/工作/待办等全部数据，用于恢复）
  - **账本数据**：账本 4 类账目（支出/收入/资产/福利）导出为一个 Excel 文件，每类一个 sheet，分类英文值转中文标签，金额为数值型两位小数（可求和）
- 实现：`src/utils/exportExcel.ts`（SheetJS 按需动态导入，不拖大入口包）+ `src/components/settings/ExportDataModal.vue`
- 导出范围：支出/收入来自 `expenses` 表（仅未删除记录），资产来自 `assets`，福利来自 `welfare_items`，均按日期正序

### 收入分类扩展（红包 / 出二手）
- 收入分类由 4 个扩展为 6 个：新增 `red_packet`（红包）、`second_hand`（出二手）
- 新增 AppIcon 图标：`red-envelope`（红包）、`swap`（交换箭头，二手流转）；红包用暖红 `#C2676A`、出二手用暖橙 `#D08770`（复用闲置辅助色，6 个收入分类配色互不重复）
- 覆盖编辑页分类选项、账本卡片图标/标签/配色、Excel 导出标签；`ExpenseCard`/`ExpenseEditor`/`Expense.vue`/`exportExcel.ts` 同步更新
- 需手动执行迁移（`expenses_category_check` 约束放行新分类，schema.sql 第 29 段）：
  ```sql
  ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
  ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
    CHECK (category IN (
      'food', 'transport', 'shopping', 'accommodation', 'study', 'entertainment', 'medical', 'other',
      'salary', 'subsidy', 'bonus', 'part_time', 'red_packet', 'second_hand'
    ));
  ```

---

## 3b. v5.1.4 更新摘要

### P1 — 路由 / 数据逻辑修复
- 行政安排编辑页"取消"不再随机跳课程表：`Work.vue` Tab 状态同步写入 URL query（`router.replace`），`router.back()` 稳定返回原 Tab
- 首页"今日课程"卡片数据源从 `workStore` 改为 `scheduleStore`，严格区分课程 ≠ 行政安排
- 行政安排未设具体时间不再回退显示"上午"：`WorkCard` 显示"未设置时间"，今日时间轴/搜索去掉 period 回退

### P2 — 待办与行政安排
- 待办彻底移除批量选择/批量删除/批量栏及相关 store 状态
- 修复待办无法修改：编辑页刷新/直达可用（`fetchTodoById` + `getTodoById` 缓存兜底），保存真正写库
- 待办 UI 重写：今日进度总览卡 + 分组 + 优先级色点，保留全部真实功能
- 行政安排列表页仅保留编辑按钮；删除移至编辑页底部危险操作区
- 行政安排开始时间必填（未填禁止保存并提示）；新增 `utils/date.formatTimeHM` 时间只显示 `HH:mm`

### P3 — 移动端「我的」与底部导航
- 移动端「我的」卡片顺序重排：Hero→支教时光→印记→常用功能→系统管理→品牌（`display:contents` + `order`），PC 布局不变
- 底部导航选中/未选中共用同一图形，仅颜色变化（移除 filled/outline 切换）
- 「我的」底部导航图标改单人像，消除双人图形重叠
- 设置项点击后颜色不再残留：`:hover` 收进 `@media (hover:hover)` + `:active` 按压反馈

### P4 — 支出 / 首页 / 检查更新
- 支出分类"购物"→"零食"（DB 值 `shopping` 不变，仅标签，历史数据兼容）；导入校验分类与 DB 对齐
- 首页时间字体 14px→20px（仅该组件）
- 检查更新弹窗：本地离线展示"已是最新版本 + 当前版本"，无联网，预留 `APP_VERSION` 单点

### P5 — 日记天气心情 + 深色模式
- 日记新增手动选择天气（☀️⛅☁️🌧❄️🌫）与心情（😊🙂😌😔😫🔥）；编辑页标题后正文前；详情/列表 emoji 展示；`utils/diaryMeta.ts`
- `NConfigProvider` 绑定 `darkTheme`，Naive UI 组件（设置/日期选择器/Toast）跟随深色模式
- 全站版本号统一为 5.1.4

### 后续增强 — 待办 / 工作页 / 学生档案
- **待办页面重构**（参照 `参考文件/待办1.1.html`）：页头进度环 + 快速添加 + 全部/进行中/已完成筛选 + 扁平卡片列表
- **待办点击编辑**：卡片无"编辑"按钮，点击整条进入 `/todo/:id/edit`；圆形勾选、日期/分类标签、弱化删除
- **待办搜索**："快速添加"框改为搜索框，实时搜索所有待办（标题/备注），与筛选叠加
- **待办批量编辑**：筛选栏右侧新增"批量编辑"（多选圆圈 + 全选 + 底部操作条；单选可编辑/删除、多选仅删除）；`store.batchRemove`
- **待办倒序 + 添加**：按 `created_at` 倒序展示（最新在上）；添加按钮跳转 `/todo/new` 原编辑界面
- **工作页添加按钮移位**：三 Tab 添加按钮从底部移到与导航 Tab 同一行右上角（移动端窄屏换行）
- **行政安排批量编辑**：列表顶部新增"批量编辑"（多选圆圈 + 全选 + 底部操作条；单选可编辑/删除、多选仅删除，`softDeleteWorks`）
- **行政安排点击编辑**：删除每行编辑按钮，点击整条安排进入编辑页；批量圆圈 26px 垂直居中；未设时间不显示
- **学生档案**：移除"批量添加"按钮与弹窗（保留单个添加 + 设置中 Excel 导入）；移除 `batchAdd`/`batchCreateStudents`

### 项目清理（v5.1.4）
- 删除未使用的 `AppEmpty.vue`（TodoEmpty 重构后无引用）及 `index.ts` 导出
- `diaryMeta`/`lunar` 内部类型去掉多余 `export`

---

## 3c. v5.1.3 更新摘要

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
| `/work` `/work/new` `/work/:id/edit` | 工作 / 添加、编辑行政安排 | 需登录 |
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
> **v5.1.4 变更**：行政安排删除移至编辑页（列表仅编辑）；待办批量选择移除；日记新增天气/心情字段（`diaries.weather/mood`，V5.2 已有列）。

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

-- v5.1.5 账本具体时间点（选填，'HH:mm'）
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_time TEXT;

-- v5.1.5 收入分类新增 红包/出二手（red_packet / second_hand），重建约束放行新分类
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'food', 'transport', 'shopping', 'accommodation', 'study', 'entertainment', 'medical', 'other',
    'salary', 'subsidy', 'bonus', 'part_time', 'red_packet', 'second_hand'
  ));
```

## 8. 已知限制

- 统计分类图标 emoji 映射已移除（v5.1.4 清理阶段未涉及统计组件内部遗留映射时除外）
- 暗色模式下部分纯 CSS 渐变装饰卡（Hero / Wallet）保持亮色原效果（设计意图）
- 106 条 lint warning（MemoryTimeline 缩进、Profile 换行、`as any` 断言等），均为 warning 不影响构建与运行
