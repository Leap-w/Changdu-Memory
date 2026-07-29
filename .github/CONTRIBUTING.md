# 昌都记忆 Changdu Memory

## 编辑器设置

### VS Code

推荐安装以下插件：

- ESLint
- Prettier
- Vue - Official
- TypeScript Vue Plugin

### 保存时自动格式化

在 `.vscode/settings.json` 中配置：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `BaseCard.vue` |
| TypeScript 文件 | camelCase | `authStore.ts` |
| 文件夹 | kebab-case 或 camelCase | `components/common/` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 变量/函数 | camelCase | `fetchUserData()` |

### Vue 组件规范

1. 使用 `<script setup lang="ts">`
2. 组件名在模板中使用 PascalCase
3. Props 使用 TypeScript 接口定义
4. Emits 使用 TypeScript 类型定义

### Git 提交规范

```
<type>: <description>

feat: 新增功能
fix: 修复 bug
refactor: 重构
style: 样式调整
docs: 文档更新
chore: 工程配置
```

### TypeScript 规范

1. 使用 `interface` 而非 `type` 定义对象类型
2. 避免 `any`，使用 `unknown` 或具体类型
3. import 类型时使用 `import type`
