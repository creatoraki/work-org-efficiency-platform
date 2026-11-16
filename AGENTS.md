# AGENTS.md

本文件仅约束 `org-efficiency-platform` 子仓。

- 若与工作区根 `AGENTS.md` 冲突，按“更近原则”处理
- 未特别说明的通用协作规则，继承工作区根规则
- 本文件关注“这个前端仓实际怎么改、怎么查、怎么验”，不重复后端或多仓总规范

## 1. 仓库概览

- 技术栈：React 18、TypeScript 5.8、Vite 6、Ant Design 5、`@tanstack/react-query`、Vitest
- 包管理器：`pnpm@10.6.4`
- Node 版本要求：`>=20`
- 应用真实入口：`src/index.tsx`
- 本地开发端口：`3333`
- API 前缀：`/shanshu-efficiency-api`

联调与代理：

- `pnpm dev:local`：接口代理到 `http://localhost:8080`
- `pnpm dev`：接口代理到 `http://10.0.20.189:10013`
- 遇到“本地接口为什么没打到 8080”，先确认是不是跑成了普通 `dev`

常用命令：

- 安装依赖：`pnpm install`
- 本地联调：`pnpm dev:local`
- 普通开发：`pnpm dev`
- 类型检查：`pnpm typecheck`
- Lint：`pnpm lint`
- 单测：`pnpm test`
- E2E：`pnpm test:e2e`
- Storybook：`pnpm storybook`
- 生产构建：`pnpm build:prod`

提交相关：

- 本仓启用了 `simple-git-hooks`
- `pre-commit` 会跑 `lint-staged`
- `commit-msg` 会跑 `commitlint`

## 2. 目录职责

高频目录职责如下：

- `src/pages`：页面入口、页面级编排、页面私有组件
- `src/components`：跨页面复用组件、基础组件、业务公共组件
- `src/api`：请求函数、接口类型、响应映射
- `src/hooks`：复用型状态逻辑、联动逻辑、查询编排 Hook
- `src/router`：路由定义、守卫、路由工具
- `src/store`：全局状态
- `src/layout`：整体布局骨架
- `src/utils`：底层工具、请求封装、通用函数
- `src/constants`：跨模块常量
- `tests`：主测试目录

说明：

- 页面目录不是只有 `index.tsx + components + config.ts + types.ts` 一种形态
- 当前仓库里也存在稳定的 `hooks/`、`utils.ts(x)`、`constants.ts(x)`、`modal/` 等页面内辅助结构
- 评估或重构时，先遵循页面附近已存在的局部模式，不要硬套单一模板

## 3. 开发约束

- 遵循阿里前端规约，但优先保持仓内局部一致性，不做顺手式风格清洗
- 默认使用 `#src/**` 别名导入
- TypeScript 改动避免新增 `any`、`as any`
- 若第三方库类型确实不足，优先补局部类型声明、缩小断言范围，不要直接 `as any` 兜底
- 未经明确要求，不新增生产依赖、不升级依赖版本
- 不修改 `dist/`、`node_modules/` 等产物目录

复用优先级：

1. 现有 Ant Design / ProComponents 能解决
2. 现有公共组件 / 业务组件能复用
3. 页面私有组件即可收敛
4. 最后才新增公共组件或公共 Hook

## 4. 接口与数据流约束

- 页面和组件里不要散写请求实现
- 所有 HTTP 请求统一收敛到 `src/api/**`
- 请求参数类型、响应类型、映射类型优先归位到对应 `src/api/**` 或页面 `types.ts`
- 不要在页面文件里长期保留接口影子类型

字段规则：

- 前端字段命名默认以后端真实字段为准
- 需要展示别名时，只能在 API 映射层集中处理
- 不要把展示别名扩散到整条调用链

排障顺序：

1. 先确认请求路径、代理模式、请求参数
2. 再看真实接口响应和后端契约
3. 最后才判断是不是纯前端渲染问题

不要因为页面报错，就默认把问题归到前端组件本身。

## 5. React Query 约束

当前仓库状态是：`@tanstack/react-query` 与 `ahooks/useRequest` 并存，但后续演进方向明确以 React Query 为主，避免继续扩散 `ahooks/useRequest`。

- 新增业务请求优先使用 `@tanstack/react-query`
- 非兼容性维护场景下，不要新增 `useRequest`
- 老页面如果只是小修，不强制整页迁移
- 老页面如果已进入中等及以上改造范围，优先顺手收敛到 React Query 体系
- 新增查询、联动筛选、分页列表、提交后刷新等场景，默认先按 React Query 设计，不再优先考虑 `useRequest`

使用原则：

- 查询优先 `useQuery` / `useInfiniteQuery`
- 变更优先 `useMutation`
- `queryKey` 必须稳定、可读，并带上关键参数
- 筛选、分页、联动查询优先让参数进入 `queryKey`
- `queryFn` 保持取数职责单一，不夹带表单重置、弹窗控制、消息提示
- 响应转换、字段归一、兼容映射优先下沉到 API 层

全局默认行为：

- `refetchOnWindowFocus: false`
- `refetchOnReconnect: false`
- `retry: 0`
- `mutations.retry: 0`

因此不要默认认为窗口切回、网络恢复后会自动重拉数据。

## 6. 页面与交互约束

- 页面入口负责视图编排、查询组织、页面级状态
- 复用型联动逻辑优先下沉到 `src/hooks`
- 抽屉、弹窗、步骤流、详情面板优先拆成独立组件
- 表单、表格、筛选、分页、弹窗的状态边界要明确，避免多处隐式同步

联动表单注意：

- 上级字段变化影响下级选项时，优先统一在 Hook 或集中状态容器中处理
- 重置时同时考虑表单值、联动选项、分页状态、当前查询条件
- 表单字段名必须与真实查询参数、提交参数对齐

## 7. 测试与验证

本仓测试现状：

- 主测试目录是 `tests/`
- 但当前也存在少量 `src/**` 下的历史测试文件
- 因此不要把“测试必须只在 tests/”写成已经完全落实的事实

默认最小检查：

- 普通前端改动：`pnpm typecheck`
- 结构性改动或批量改名：再补 `pnpm lint`
- 重要交互、字段映射、表单提交流程：按需补 `pnpm test`
- 路由、代理、构建、别名、Vite 配置调整：补 `pnpm build:prod`
- E2E 级变更：按需补 `pnpm test:e2e`

汇报要求：

- 说明实际运行了哪些命令
- 明确是否通过
- 未运行时必须说明原因

## 8. 修改边界

未经明确要求，不做以下事情：

- 跨仓重构
- 顺手升级依赖
- 修改认证、权限守卫、SSO 主流程
- 修改导出、上传、任务流等高风险链路
- 修改部署配置、`.env*`、CI 相关文件

涉及以下问题时，优先先核真实上下文再改：

- 路由与菜单联动
- KeepAlive / 页面缓存
- WebSocket / 任务流
- fake 数据与真实接口切换
- React Query 与 `useRequest` 并存页面的局部迁移

## 9. 注释要求

- 使用中文注释，关键参数名和技术名词可保留英文
- 组件、Hook、工具函数在有必要时写 JSDoc，说明职责和边界
- 复杂分支、兼容逻辑、魔法值必须解释业务原因，不要只描述表层代码
- JSX 内注释只能使用 `{/* ... */}`

临时兼容逻辑必须说明：

- 触发条件
- 影响范围
- 未来可移除条件

## 10. 交付要求

提交 PR 或汇报结果时，至少说明：

- 修改了哪些文件
- 为什么这样改
- 行为变化是什么
- 跑了哪些检查
- 还有哪些风险或待确认项

PR 标题格式：`[模块名] 简洁描述`
