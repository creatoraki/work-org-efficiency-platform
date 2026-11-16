# 组织效能管控平台

## 介绍

组织效能管控平台是公司内部的企业级中后台管理系统，基于 React 18、TypeScript 5.8、Vite 6 和 Ant Design 5 构建。平台用于提升组织运营效率，包含人员管理、智能标签体系、规则配置、权限管控等核心功能。

### 平台特点

- **功能完善**：内置权限校验、动态菜单、多主题配置、路由动画、多页面缓存、颗粒化按钮级别的权限控制、代码规范等功能
- **模块化设计**：采用模块化设计和组件库，支持快速开发定制化的效能管理功能
- **现代化技术栈**：使用最新的前端技术栈，确保良好的开发体验和性能
- **企业级功能**：包含完整的权限管理、数据可视化等企业级功能

### 适用场景

- 企业组织效能管理
- 人员档案与标签管理
- 策略目标管理
- 系统权限与用户管理
- 数据可视化工作台

## 核心功能模块

- **人员档案管理**：人员信息管理、档案审核、面试管理等
- **标签管理**：组织标签、人才标签、标签中心、标签审核、规则库等
- **策略管理**：目标管理、目标确认、目标填报、目标计划等
- **系统管理**：用户管理、角色管理、部门管理、菜单管理等
- **工作台**：数据概览、待办事项、会议日历、快速导航等

## 特性

### 技术栈

- **前端框架**：[React 18.3](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- **构建工具**：[Vite 6.4](https://vitejs.dev/)
- **UI 组件库**：[Ant Design 5.27](https://ant.design/index-cn/) + [Ant Design Pro Components](https://procomponents.ant.design/)
- **路由管理**：[React Router 7.4](https://reactrouter.com/)
- **样式方案**：[Tailwind CSS 3.4](https://tailwindcss.com/docs/installation) + [React JSS](https://cssinjs.org/react-jss)
- **状态管理**：[Zustand 5.0](https://zustand-demo.pmnd.rs/)
- **数据请求**：[Ky 1.7](https://github.com/sindresorhus/ky) + [TanStack Query 5.90](https://tanstack.com/query/latest/docs/framework/react/overview)
- **工具库**：[ahooks 3.9](https://ahooks.js.org/) + [Lodash ES](https://lodash.com/)
- **图表库**：[ECharts 6.0](https://echarts.apache.org/) + [echarts-for-react](https://github.com/hustcc/echarts-for-react)
- **日期处理**：[Day.js 1.11](https://day.js.org/)

### 开发体验

- **代码规范**：[ESLint 9.22](https://eslint.org/) (Flat Config) + [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- **Git 提交规范**：[Commitlint](https://commitlint.js.org/) + [Simple Git Hooks](https://github.com/toplenboren/simple-git-hooks)
- **代码检查**：[lint-staged](https://github.com/lint-staged/lint-staged) + [Vite Plugin Checker](https://github.com/fi3ework/vite-plugin-checker)
- **测试框架**：[Vitest 3.0](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **组件文档**：[Storybook 8.4](https://storybook.js.org/)
- **API 模拟**：[vite-plugin-fake-server](https://github.com/condorheroblog/vite-plugin-fake-server)
- **代码定位**：[code-inspector-plugin](https://inspector.fe-dev.cn/)

### 功能特性

- **权限路由**：支持前端静态路由和后端动态路由
- **路由缓存**：路由级别组件缓存，使用 [keepalive-for-react](https://github.com/irychen/keepalive-for-react)
- **主题配置**：内置多种主题配置，支持暗黑主题，统一了 antd 和 Tailwind CSS 的颜色体系
- **拖拽排序**：使用 [@dnd-kit](https://dndkit.com/) 实现拖拽功能
- **图标系统**：按需加载图标，支持 [Iconify](https://iconify.design/) 和自定义 SVG 图标
- **动画效果**：使用 [Motion](https://motion.dev/) 提供流畅的动画体验
- **无限滚动**：使用 [react-infinite-scroll-component](https://github.com/ankeetmaini/react-infinite-scroll-component) 实现列表无限滚动

## 开发

### 环境要求

- **Node.js**: >= 20.0.0（默认使用 Node.js 22.x LTS）
- **pnpm**: >= 10.6.4（已通过 `packageManager` 字段锁定）

> 💡 提示：如果使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本，项目已提供 `.nvmrc` 文件，可直接运行 `nvm use` 切换到推荐版本。

### 安装依赖

```bash
corepack enable

pnpm install
```

### 运行

```bash
pnpm run dev
```

打开浏览器输入 [http://localhost:3333](http://localhost:3333) 即可看到页面。

### 代码检查

```bash
# 运行 ESLint 检查
pnpm run lint

# 自动修复 ESLint 问题
pnpm run lint:fix

# TypeScript 类型检查
pnpm run typecheck
```

### 测试

```bash
# 运行测试
pnpm run test

# Storybook 组件文档
pnpm run storybook

# 构建 Storybook
pnpm run storybook:build
```

### 代码分析

```bash
# 构建产物分析
pnpm run analyzer

# ESLint 配置检查
pnpm run eslint-config-inspector
```

## 构建

```bash
# 开发环境构建
pnpm run build:dev

# 测试环境构建
pnpm run build:test

# 生产环境构建
pnpm run build:prod

# 或使用默认构建命令
pnpm run build
```

构建产物默认在 `dist` 文件夹。

## 预览

```bash
# 预览开发环境构建
pnpm run preview:dev

# 预览测试环境构建
pnpm run preview:test

# 预览生产环境构建
pnpm run preview:prod

# 或使用默认预览命令
pnpm run preview
```

## 项目结构

```
org-efficiency-platform/
├── src/                    # 源代码目录
│   ├── api/               # API 接口定义
│   ├── assets/            # 静态资源
│   ├── components/        # 公共组件
│   ├── constants/        # 常量定义
│   ├── hooks/            # 自定义 Hooks
│   ├── icons/            # 图标资源
│   ├── layout/           # 布局组件
│   ├── pages/            # 页面组件
│   ├── plugins/          # 插件配置
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── styles/           # 样式文件
│   ├── types/            # 类型定义
│   └── utils/            # 工具函数
├── fake/                  # Mock 数据
├── docs/                  # 文档目录
├── public/                # 公共资源
├── dist/                  # 构建产物
└── package.json          # 项目配置
```

## 作者

[greentown-tech](https://www.greentown-tech.com)

## 相关链接

- [GitLab 仓库](http://git.greentown-tech.com/caizhipeng/org-efficiency-platform)
- [问题反馈](http://git.greentown-tech.com/caizhipeng/org-efficiency-platform/issues)
