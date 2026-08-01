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
├── docs/                     # 开发文档（V5.5-Development-Handbook / V5_STATUS）
├── src/
│   ├── main.ts               # 入口
│   ├── App.vue               # 根组件（登录全屏 / 其他统一外壳）
│   ├── layouts/
│   │   └── AppLayout.vue     # 统一外壳（顶部胶囊导航 + 移动端底栏）
│   ├── pages/                # 业务页面
│   │   ├── Login.vue         # 登录
│   │   ├── Home.vue          # 首页 Dashboard
│   │   ├── Mood.vue          # 今日心情（localStorage）
│   │   ├── Profile.vue       # 我的
│   │   ├── Diary.vue         # 日记
│   │   ├── Work.vue          # 工作安排（课程表/行政/学生）
│   │   ├── Todo.vue          # 待办（过期/今日/未来/已完成）
│   │   ├── Expense.vue       # 花费记录
│   │   ├── TimeCenter.vue    # 时光中心
│   │   └── ...               # Search / Statistics / Import / Settings / RecycleBin
│   ├── router/               # 路由配置
│   ├── stores/               # Pinia 状态管理（13个）
│   ├── services/             # 业务服务
│   │   └── supabase.ts       # Supabase 客户端
│   ├── repositories/         # 数据访问层（13个）
│   ├── components/           # 组件
│   │   ├── ui/               # 设计系统（AppCard/AppSection/AppIcon/AppAvatar...）
│   │   └── ...               # dashboard / diary / work / todo / expense / schedule / student
│   ├── types/
│   │   └── database.ts       # 数据库表类型
│   ├── utils/                # 工具函数（export/import/search/mood...）
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

部署到 Vercel 时，需要在项目的 **Settings → Environment Variables** 中分别配置这两个变量，并至少勾选 **Production**。`.env` 文件不会被提交或自动上传到 Vercel。修改变量后需要重新部署；值不要包含引号、换行或多余空格。

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
| Phase 4-A ✅ | 地点档案系统 |
| Phase 4-B ✅ | 照片档案系统 |
| Phase 4-C ✅ | 统一标签系统 |
| Phase 5 ✅ | 上线准备（Schema整合 + 数据导出 + 设置） |
| Phase 6-A ✅ | 首页记忆化改造（TodayMemoryCard） |
| Phase 6-B ✅ | 数据批量导入系统（Excel模板导入） |
| Phase 6-C ✅ | 照片记忆增强系统（瀑布流+时间轴+地点关联） |
| Phase 6-D ✅ | 年度数据统计中心（全模块数据可视化） |
| Phase 6-E ✅ | 全局档案检索系统（跨模块内存搜索） |
| Phase 6-F ✅ | 个人档案系统完善（软删除+回收站+时间轴+JSON恢复+PWA） |
| Phase 7 ✅ | 全站设计系统升级（V5.4 UI：毛玻璃卡片 + 统一外壳 + AppIcon） |
| Phase 8 ✅ | 交互优化与原型还原（V5.5.1） |

## 版本记录

- **V5.5.1（当前）** — 首页 Hero / 我的个人卡按原型还原；账号管理新增学校/科目；数据管理合并入口；今日心情独立功能（localStorage）；行政安排仅可删除；待办新增过期分组并统一页面；移除标签管理；日记模板随时切换
- **V5.4** — 全站设计系统升级：毛玻璃卡片、统一 AppLayout 外壳、AppIcon SVG 图标、高原自然色系
- **V5.3** — Profile 菜单修复、开发文档整理
- **V5.2** — 全面重构与功能增强
- **V5.1** — 个人数字档案系统全面升级
- **V5.0** — 当前线上版本基线
