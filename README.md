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
昌都记忆/
├── .env.example              # 环境变量模板
├── .github/
│   └── CONTRIBUTING.md       # 开发规范
├── .vscode/
│   ├── settings.json         # VS Code 编辑器配置
│   └── extensions.json       # 推荐插件
├── public/
│   └── favicon.svg           # 应用图标
├── src/
│   ├── assets/               # 静态资源
│   ├── components/           # 公共组件
│   │   └── common/           # 基础组件（BaseCard / BaseButton / BaseEmpty）
│   ├── layouts/              # 布局组件
│   │   ├── MobileLayout.vue  # 移动端布局（底部导航）
│   │   └── DesktopLayout.vue # 桌面端布局（侧边栏）
│   ├── pages/                # 业务页面
│   │   ├── Login.vue         # 登录
│   │   ├── Home.vue          # 首页 Dashboard
│   │   ├── TimeCenter.vue    # 时光中心
│   │   ├── Todo.vue          # 今日待办
│   │   ├── Work.vue          # 工作安排
│   │   ├── Expense.vue       # 花费记录
│   │   ├── Diary.vue         # 日记
│   │   ├── Profile.vue       # 我的
│   │   └── Settings.vue      # 设置
│   ├── router/               # 路由配置
│   ├── stores/               # Pinia 状态管理
│   │   ├── auth.ts           # 认证状态
│   │   └── app.ts            # 应用全局状态
│   ├── services/             # 业务服务
│   │   └── supabase.ts       # Supabase 客户端
│   ├── repositories/         # 数据访问层
│   ├── types/                # TypeScript 类型定义
│   │   └── database.ts       # 数据库表类型
│   ├── utils/                # 工具函数
│   └── styles/               # 全局样式
│       ├── variables.css     # 主题变量
│       └── global.css        # 全局重置样式
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
| Phase 4-B | 图片上传 + 完善 |
| Phase 5 | 常用信息 + 数据管理 + 设置 + PWA |

## 版本

V5.0 — 当前开发中
