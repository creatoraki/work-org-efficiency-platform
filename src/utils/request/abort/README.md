# 请求取消功能使用指南

## 目录

- [功能说明](#功能说明)
- [基础用法](#基础用法)
- [API 参考](#api-参考)
- [使用场景](#使用场景)
- [最佳实践](#最佳实践)
- [注意事项](#注意事项)
- [常见问题](#常见问题)

## 功能说明

请求取消功能允许你在组件卸载或需要时主动取消正在进行的请求，避免内存泄漏和状态更新错误。

**注意**：ky 原生支持 `AbortController`，可以直接使用原生的 `AbortController`，无需额外配置。

### 类型导出

本模块导出了以下类型，可以在 TypeScript 中使用：

```ts
import type { UseAbortControllerReturn, AbortControllerReturn } from "#src/utils/request/abort";
```

## 基础用法

### 1. 使用原生 AbortController（推荐用于简单场景）

```ts
import { request } from "#src/utils/request";

// 直接使用原生 AbortController
const controller = new AbortController();

// 发起请求时传入 signal
const fetchData = async () => {
	try {
		const data = await request.get("api/data", { signal: controller.signal });
		console.log(data);
	} catch (error) {
		if (error.name === "AbortError") {
			console.log("请求已取消");
		} else {
			console.error("请求失败", error);
		}
	}
};

// 需要时取消请求
controller.abort();
```

### 2. 在 React 组件中使用 `useAbortController` Hook（推荐）

```tsx
import { useEffect } from "react";
import { request, useAbortController } from "#src/utils/request";

function MyComponent() {
	const { signal, abort, aborted } = useAbortController();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await request.get("api/data", { signal });
				// 处理数据
			} catch (error) {
				if (error.name !== "AbortError") {
					// 处理其他错误
					console.error(error);
				}
			}
		};

		fetchData();
	}, [signal]);

	return (
		<div>
			<button onClick={() => abort()}>取消请求</button>
			{aborted && <span>请求已取消</span>}
		</div>
	);
}
```

### 3. 依赖变化时自动取消（类似 React Query）

当依赖变化时，自动取消之前的请求并创建新的 controller：

```tsx
import { useEffect } from "react";
import { request, useAbortController } from "#src/utils/request";

function UserDetail({ userId }: { userId: string }) {
	// 当 userId 变化时，自动取消之前的请求
	const { signal } = useAbortController([userId]);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const user = await request.get(`api/users/${userId}`, { signal });
				// 处理用户数据
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error(error);
				}
			}
		};

		fetchUser();
	}, [userId, signal]);

	return <div>...</div>;
}
```

### 4. 使用 `abortControllerManager` 管理多个请求

```ts
import { request, abortControllerManager } from "#src/utils/request";

// 创建并注册控制器
const { signal, abort, aborted } = abortControllerManager.create("fetchUserData");

// 发起请求
request.get("api/user", { signal });

// 检查请求状态
if (aborted) {
	console.log("请求已被取消");
}

// 取消特定请求
abortControllerManager.abort("fetchUserData");

// 或者使用返回的 abort 方法
abort("用户手动取消");

// 取消所有请求
abortControllerManager.abortAll("页面切换");
```

## API 参考

### `useAbortController(deps?: React.DependencyList)`

React Hook，用于在组件中管理请求取消。

组件卸载时自动取消所有请求，符合 React 最佳实践。当依赖数组变化时，会自动取消旧的请求并创建新的 AbortController。

#### 参数

- `deps` (可选): `React.DependencyList` - 依赖数组，当依赖变化时会自动取消旧请求并创建新的 controller

#### 返回值

返回 `UseAbortControllerReturn` 类型的对象：

```ts
interface UseAbortControllerReturn {
	signal: AbortSignal; // AbortSignal 对象，用于传递给请求选项
	abort: (reason?: string) => void; // 取消请求的方法
	get aborted(): boolean; // 检查请求是否已被取消（getter 属性）
}
```

#### 示例

```tsx
// 基础用法
const { signal, abort, aborted } = useAbortController();

// 依赖变化时自动取消
const { signal } = useAbortController([userId, searchKeyword]);
```

### `AbortControllerManager`

请求取消控制器管理器，用于管理多个请求的取消控制器。

支持通过唯一标识（key）来创建、取消和管理多个请求。如果指定的 key 已存在，会先取消旧的请求，然后创建新的控制器。

#### 方法

##### `create(key: string)`

创建并注册一个取消控制器。

如果指定的 key 已存在，会先取消旧的请求，然后创建新的控制器。

**参数：**

- `key`: `string` - 控制器的唯一标识

**返回值：**

返回 `AbortControllerReturn` 类型的对象：

```ts
interface AbortControllerReturn {
	signal: AbortSignal; // AbortSignal 对象
	abort: (reason?: string) => void; // 取消请求的方法
	get aborted(): boolean; // 检查请求是否已被取消（getter 属性）
}
```

**示例：**

```ts
const { signal } = abortControllerManager.create("fetchUserData");
```

##### `abort(key: string, reason?: string)`

取消指定的请求。

**参数：**

- `key`: `string` - 控制器的唯一标识
- `reason` (可选): `string` - 取消原因

**示例：**

```ts
abortControllerManager.abort("fetchUserData", "用户切换页面");
```

##### `abortAll(reason?: string)`

取消所有请求。

**参数：**

- `reason` (可选): `string` - 取消原因

**示例：**

```ts
abortControllerManager.abortAll("页面卸载");
```

##### `remove(key: string)`

移除指定的控制器（不取消请求）。

**注意**：此方法只会从管理器中移除控制器，不会取消正在进行的请求。

**参数：**

- `key`: `string` - 控制器的唯一标识

**示例：**

```ts
abortControllerManager.remove("fetchUserData");
```

##### `clear()`

清空所有控制器（不取消请求）。

**注意**：此方法只会从管理器中移除所有控制器，不会取消正在进行的请求。

**示例：**

```ts
abortControllerManager.clear();
```

##### `isAborted(key: string): boolean`

检查指定的请求是否已被取消。

**参数：**

- `key`: `string` - 控制器的唯一标识

**返回值：**

- `boolean` - 如果请求已被取消返回 `true`，否则返回 `false`

**示例：**

```ts
if (abortControllerManager.isAborted("fetchUserData")) {
	console.log("请求已被取消");
}
```

### `abortControllerManager`

全局请求取消控制器管理器实例。

**示例：**

```ts
import { abortControllerManager } from "#src/utils/request";

abortControllerManager.create("key");
abortControllerManager.abort("key");
```

## 使用场景

### 场景 1: 搜索功能（防抖 + 取消）

```tsx
import { useState, useEffect } from "react";
import { request, useAbortController } from "#src/utils/request";

function SearchComponent() {
	const [keyword, setKeyword] = useState("");
	const { signal } = useAbortController([keyword]); // 关键词变化时自动取消

	useEffect(() => {
		if (!keyword) return;

		const search = async () => {
			try {
				const results = await request.get("api/search", {
					searchParams: { q: keyword },
					signal,
				});
				// 处理搜索结果
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error(error);
				}
			}
		};

		// 防抖处理
		const timer = setTimeout(search, 300);
		return () => clearTimeout(timer);
	}, [keyword, signal]);

	return <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />;
}
```

### 场景 2: 列表分页切换

```tsx
import { useState, useEffect } from "react";
import { request, useAbortController } from "#src/utils/request";

function ListComponent() {
	const [page, setPage] = useState(1);
	const { signal } = useAbortController([page]); // 页码变化时自动取消

	useEffect(() => {
		const fetchList = async () => {
			try {
				const data = await request.get("api/list", {
					searchParams: { page },
					signal,
				});
				// 处理列表数据
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error(error);
				}
			}
		};

		fetchList();
	}, [page, signal]);

	return (
		<div>
			<button onClick={() => setPage(page + 1)}>下一页</button>
		</div>
	);
}
```

### 场景 3: 表单提交（防止重复提交）

```tsx
import { useState } from "react";
import { request, useAbortController } from "#src/utils/request";

function FormComponent() {
	const { signal, abort } = useAbortController();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (values: FormData) => {
		// 取消之前的请求
		abort();

		setLoading(true);
		try {
			await request.post("api/submit", { json: values, signal });
			// 处理成功
		} catch (error) {
			if (error.name !== "AbortError") {
				// 处理其他错误
				console.error(error);
			}
		} finally {
			setLoading(false);
		}
	};

	return <form onSubmit={handleSubmit}>...</form>;
}
```

### 场景 4: 路由切换时取消请求

```tsx
import { useEffect } from "react";
import { request, useAbortController } from "#src/utils/request";

function UserDetailPage({ userId }: { userId: string }) {
	const { signal } = useAbortController([userId]);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const user = await request.get(`api/users/${userId}`, { signal });
				// 处理用户数据
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error(error);
				}
			}
		};

		fetchUser();
	}, [userId, signal]);

	// 组件卸载时自动取消（由 useAbortController 处理）
	return <div>...</div>;
}
```

### 场景 5: 批量请求管理

```tsx
import { useEffect } from "react";
import { request, abortControllerManager } from "#src/utils/request";

function BatchRequestComponent() {
	useEffect(() => {
		const controller1 = abortControllerManager.create("request1");
		const controller2 = abortControllerManager.create("request2");

		Promise.all([
			request.get("api/data1", { signal: controller1.signal }),
			request.get("api/data2", { signal: controller2.signal }),
		]).catch((error) => {
			if (error.name !== "AbortError") {
				console.error(error);
			}
		});

		// 取消所有请求
		return () => {
			abortControllerManager.abortAll("组件卸载");
		};
	}, []);

	return <div>...</div>;
}
```

## 最佳实践

### 1. 简单场景：直接使用原生 API

```ts
// 适合：一次性请求、工具函数等
const controller = new AbortController();
request.get("api/data", { signal: controller.signal });
```

### 2. React 组件：使用 Hook

```tsx
// 适合：组件内的请求，需要自动清理
const { signal } = useAbortController();
```

### 3. 依赖变化：传递依赖数组

```tsx
// 适合：搜索、筛选、分页等场景
const { signal } = useAbortController([keyword, page]);
```

### 4. 多请求管理：使用管理器

```ts
// 适合：需要统一管理多个请求的场景
abortControllerManager.create("key");
```

### 5. 错误处理模式

```tsx
try {
	const data = await request.get("api/data", { signal });
	// 处理数据
} catch (error) {
	// 必须检查 AbortError，避免误报错误
	if (error.name === "AbortError") {
		// 请求被取消，静默处理
		return;
	}
	// 处理其他错误
	console.error("请求失败", error);
}
```

## 注意事项

### 1. 错误处理

请求被取消后，会抛出 `AbortError`，**必须**在 catch 中判断处理：

```ts
try {
	const data = await request.get("api/data", { signal });
} catch (error) {
	if (error.name === "AbortError") {
		// 请求被取消，静默处理
		return;
	}
	// 处理其他错误
	console.error(error);
}
```

### 2. Loading 状态

取消的请求会自动清理 loading 状态（在 `afterResponse` hook 中已处理），无需手动处理。

### 3. 错误提示

取消的请求不会显示错误提示（在 `afterResponse` hook 中已处理），避免干扰用户。

### 4. 依赖数组

使用 `useAbortController([deps])` 时：

- 依赖变化会自动取消旧请求
- 适合用于搜索、筛选、分页等场景
- 依赖数组应该与 `useEffect` 的依赖保持一致

### 5. Signal 对象

- `signal` 对象是稳定的，可以在 `useEffect` 的依赖中使用
- 当依赖变化时，`signal` 会变化，触发 `useEffect` 重新执行
- 不要直接使用 `controller` 对象，只使用 `signal`

### 6. 多次调用 abort

多次调用 `abort()` 是安全的，不会报错：

```ts
const { abort } = useAbortController();
abort(); // 第一次调用
abort(); // 第二次调用，不会报错
```

## 常见问题

### Q1: 为什么需要使用请求取消？

**A:** 请求取消可以：

- 避免内存泄漏（组件卸载后请求完成导致状态更新）
- 提升用户体验（避免过时数据覆盖新数据）
- 节省资源（取消不必要的网络请求）

### Q2: 什么时候应该使用依赖数组？

**A:** 当请求依赖于某些状态变化时，应该使用依赖数组：

- 搜索关键词变化
- 分页页码变化
- 筛选条件变化
- 路由参数变化

### Q3: 如何判断请求是否被取消？

**A:** 有两种方式：

```tsx
// 方式 1: 检查 aborted 属性
const { signal, aborted } = useAbortController();
if (aborted) {
	console.log("请求已被取消");
}

// 方式 2: 在 catch 中检查错误
try {
	await request.get("api/data", { signal });
} catch (error) {
	if (error.name === "AbortError") {
		console.log("请求已被取消");
	}
}
```

### Q4: 可以手动取消吗？

**A:** 可以，使用返回的 `abort` 方法：

```tsx
const { signal, abort } = useAbortController();

// 手动取消
<button onClick={() => abort("用户点击取消")}>取消</button>;
```

### Q5: 与 TanStack Query 配合使用？

**A:** TanStack Query 已经内置了请求取消功能，通常不需要额外使用 `useAbortController`。但如果需要手动控制，可以这样使用：

```tsx
const { signal } = useAbortController();
const { data } = useQuery({
	queryKey: ["user", userId],
	queryFn: () => request.get(`api/users/${userId}`, { signal }).json(),
});
```

### Q6: 多个请求共享一个 signal？

**A:** 可以，但需要注意：

- 取消一个 signal 会取消所有使用该 signal 的请求
- 如果需要独立控制，应该为每个请求创建独立的 controller

```tsx
// 共享 signal（取消一个会取消所有）
const { signal } = useAbortController();
request.get("api/data1", { signal });
request.get("api/data2", { signal });

// 独立控制
const controller1 = new AbortController();
const controller2 = new AbortController();
request.get("api/data1", { signal: controller1.signal });
request.get("api/data2", { signal: controller2.signal });
```

### Q7: 性能影响？

**A:** 请求取消功能对性能的影响可以忽略不计：

- `AbortController` 是浏览器原生 API，性能开销极小
- Hook 的实现非常轻量
- 取消请求可以节省网络资源，反而提升性能

## 相关链接

- [MDN: AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [ky 文档](https://github.com/sindresorhus/ky)
- [React Query 文档](https://tanstack.com/query/latest)
