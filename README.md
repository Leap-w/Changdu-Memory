# 昌都记忆 Changdu Memory

> 一款围绕一年支教生活打造的个人数字记录平台

## 项目简介

《昌都记忆》融合了工作管理、生活记录、成长档案和个人数据管理，希望通过一个系统完整记录支教生活。

系统采用 **PWA + 云同步** 方式，实现手机、电脑多端实时同步，打造接近原生 App 的使用体验。

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | 前端框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Pinia | 状态管理 |
| Vue Router | 路由 |
| Naive UI | UI 组件库 |
| Supabase | Auth + 数据库 + 存储 + 实时同步 |
| PWA | 离线支持，可安装到桌面 |

### 工程化

| 工具 | 说明 |
|------|------|
| ESLint | 代码检查 |
| Prettier | 代码格式化 |
| vue-tsc | TypeScript 类型检查 |

## 项目结构

```
Changdu Memory/
├── .env.example              # 环境变量模板
├── public/                   # PWA 图标 + favicon
├── supabase/
│   └── schema.sql            # 完整数据库 Schema（可重复执行）
├── docs/                     # 开发文档（v5.1.4-Development-Handbook / V5_STATUS）
├── src/
│   ├── main.ts               # 入口
│   ├── App.vue               # 根组件（登录全屏 / 其他统一外壳）
│   ├── layouts/
│   │   └── AppLayout.vue     # 统一外壳（顶部胶囊导航 + 移动端底栏）
│   ├── pages/                # 业务页面
│   │   ├── Login.vue         # 登录
│   │   ├── Home.vue          # 首页 Dashboard
│   │   ├── Mood.vue          # 今日心情（数据库）
│   │   ├── Profile.vue       # 我的
│   │   ├── Diary.vue         # 日记
│   │   ├── Work.vue          # 工作安排（课程表/行政/学生）
│   │   ├── Todo.vue          # 待办（过期/今日/未来/已完成）
│   │   ├── Expense.vue       # 花费记录
│   │   ├── TimeCenter.vue    # 时光中心
│   │   └── ...               # Search / Statistics / Import / Settings / RecycleBin
│   ├── router/               # 路由配置
│   ├── stores/               # Pinia 状态管理（15个）
│   ├── services/             # 业务服务
│   │   └── supabase.ts       # Supabase 客户端
│   ├── repositories/         # 数据访问层（15个）
│   ├── components/           # 组件
│   │   ├── ui/               # 设计系统（AppCard/AppSection/AppIcon/AppAvatar...）
│   │   └── ...               # dashboard / diary / work / todo / expense / schedule / student
│   ├── types/
│   │   └── database.ts       # 数据库表类型
│   ├── utils/                # 工具函数（date/lunar/export/import/search/statistics/templates/diaryMeta）
│   └── styles/               # 全局样式（variables.css / global.css）
├── eslint.config.js          # ESLint 配置
├── .prettierrc               # Prettier 配置
├── vite.config.ts            # Vite 配置
└── tsconfig.json             # TypeScript 配置
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（自动热更新）
npm run dev

# 构建生产版本（含类型检查）
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key（公开密钥） |
| `SUPABASE_URL` | Supabase 项目 URL（仅保活函数服务端使用，可选） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 密钥（仅保活函数服务端使用，可选） |

部署到 Vercel 时，需要在项目的 **Settings → Environment Variables** 中分别配置变量，并至少勾选 **Production**。`.env` 文件不会被提交或自动上传到 Vercel。修改变量后需要重新部署；值不要包含引号、换行或多余空格。

> **保活机制（v5.1.3+）**：Supabase 免费项目连续 7 天无活动会被自动暂停。项目内置了 Vercel Cron 每日定时任务（`api/keepalive.ts`），每天自动向 Supabase 发起一次数据库查询以保持项目活跃。若配置 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`，保活即可生效（后者是敏感密钥，`没有 VITE_ 前缀`，不会进入前端 bundle）。已暂停的项目需先在 Supabase Dashboard 手动点击 **Resume project** 恢复。

## 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `BaseCard.vue` |
| TypeScript 文件 | camelCase | `authStore.ts` |
| 变量/函数 | camelCase | `fetchUserData()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

### Vue 组件规范

- 使用 `<script setup lang="ts">`
- Props 使用 TypeScript 接口定义
- 组件名在模板中使用 PascalCase
- 使用 `import type` 导入类型

### Git 提交规范

```
feat: 新增功能
fix: 修复 Bug
refactor: 重构代码
style: 样式调整
docs: 文档更新
chore: 工程配置
```

## 开发路线

| Phase | 内容 |
|-------|------|
| Phase 1 ✅ | 项目基础架构搭建 |
| Phase 1.5 ✅ | 工程规范完善（ESLint + Prettier + 基础组件） |
| Phase 2-A ✅ | 用户认证系统（Supabase Email Auth + Login + Router Guard） |
| Phase 2-B ✅ | 时光中心（倒计时系统） |
| Phase 2-C ✅ | 首页 Dashboard |
| Phase 3-A ✅ | 日记系统 |
| Phase 3-B ✅ | 待办系统 |
| Phase 3-C ✅ | 花费记录系统 |
| Phase 3-D ✅ | 工作安排系统 |
| Phase 4-A ❌ | 地点档案系统（已取消，schema 中 locations 表保留未用） |
| Phase 4-B ❌ | 照片档案系统（已取消，并入大事记照片功能） |
| Phase 4-C ✅ | 统一标签系统（日记标签） |
| Phase 5 ✅ | 上线准备（Schema整合 + 数据导出 + 设置） |
| Phase 6-A ✅ | 首页记忆化改造（TodayMemoryCard） |
| Phase 6-B ✅ | 数据批量导入系统（Excel模板导入） |
| Phase 6-C ✅ | 照片记忆增强系统（瀑布流+时间轴+地点关联） |
| Phase 6-D ✅ | 年度数据统计中心（全模块数据可视化） |
| Phase 6-E ✅ | 全局档案检索系统（跨模块内存搜索） |
| Phase 6-F ✅ | 个人档案系统完善（软删除+回收站+时间轴+JSON恢复+PWA） |
| Phase 7 ✅ | 全站设计系统升级（V5.4 UI：毛玻璃卡片 + 统一外壳 + AppIcon） |
| Phase 8 ✅ | 交互优化与原型还原（V5.5.1） |
| Phase 9 ✅ | 核心模块升级（V5.5.2：我的页重构 / 大事记 Tab+地点 / 一年旅程日期化 / 心情数据库化） |

## 版本记录

- **v5.1.4（当前）** — 五大阶段稳定化：① 修复行政安排编辑页取消误跳课程表（Tab 状态同步 URL query）、首页课程表卡片只显示课程（数据源切为 schedules）、行政安排未设时间不再显示"上午"；② 待办移除批量选择、修复待办无法修改（刷新/直达可正常编辑）、待办 UI 重写、行政安排列表仅编辑/删除移至编辑页、开始时间必填、时间只显示 HH:mm；③ 移动端「我的」卡片顺序重排、底部导航同一图形仅颜色变化、修复设置项点击后颜色残留（hover 收进 `@media (hover:hover)`）；④ 支出分类"购物"→"零食"（DB 值不变仅标签，历史数据兼容）、首页时间字体放大、检查更新离线弹窗；⑤ 日记新增天气/心情手动选择（编辑/详情/列表展示）、深色模式 Naive UI 组件跟随主题、版本号统一 5.1.4
- **v5.1.3** — 全站图标改为用户提供的图片；首页 Hero 倒计时卡片固定 240px、日期字体加大并新增农历日期、时间/日期/农历实时化；修复日期选择器选 31 日变 30 日的时区 bug；全站日期/时间选择器统一为 Naive UI 中文界面；行政安排支持编辑 + 开始/结束时间 + 批量删除；待办卡片 UI 统一 + 批量选择删除 + 图标文字对齐修复；课程表默认科目改为数学；「我的」支教时光卡片深色模式修复；全面清理无用文件与代码（删除 AppFab 组件、未用函数、冗余图标、未接线 eslint 依赖）；新增 Supabase 保活 cron
- **V5.5.2** — 「我的」页功能入口重构（常用功能+系统管理分组卡片、退出登录移入账号弹窗）；大事记取消固定分类、支持自定义地点、新增「大事记/一年旅程」Tab；一年旅程节点改为日期设置；今日心情数据库化（一天多条+自定义心情选项）；首页 Hero 可自定义展示倒计时；时光页大事记展示优化
- **V5.5.1** — 首页 Hero / 我的个人卡按原型还原；账号管理新增学校/科目；数据管理合并入口；今日心情独立功能（localStorage）；行政安排仅可删除；待办新增过期分组并统一页面；移除标签管理；日记模板随时切换
- **V5.4** — 全站设计系统升级：毛玻璃卡片、统一 AppLayout 外壳、AppIcon SVG 图标、高原自然色系
- **V5.3** — Profile 菜单修复、开发文档整理
- **V5.2** — 全面重构与功能增强
- **V5.1** — 个人数字档案系统全面升级
- **V5.0** — 当前线上版本基线
