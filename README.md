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

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 公共组件
├── layouts/         # 布局（Mobile / Desktop）
├── pages/           # 业务页面
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── services/        # 业务逻辑 / Supabase 初始化
├── repositories/    # 数据访问层
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── styles/          # 全局样式 & 主题变量
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 项目信息

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build
```

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key（公开密钥） |

## 开发路线

| Phase | 内容 |
|-------|------|
| Phase 1 ✅ | 项目基础架构搭建 |
| Phase 2 | 首页 Dashboard + 时光中心 |
| Phase 3 | 待办 + 工作安排 |
| Phase 4 | 花费 + 日记 + 图片上传 |
| Phase 5 | 常用信息 + 数据管理 + 设置 + PWA |

## 版本

V5.0 — 当前开发中
