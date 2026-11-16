# Axios 封装使用指南

本文档介绍如何使用 axios 封装的各种功能。

## 基础使用

### 默认请求实例

```typescript
import { request } from "#src/utils/axios-request";

// GET 请求
const data = await request.get<UserInfo>("/api/user/info");

// POST 请求
const result = await request.post<CreateResult>("/api/user", {
	name: "张三",
	age: 25,
});
```

### 公共请求实例（不携带认证信息）

```typescript
import { publicRequest } from "#src/utils/axios-request";

// 公共接口请求，不携带认证信息
const data = await publicRequest.get("/api/public/data");
```

### 创建自定义请求实例

```typescript
import { createRequest } from "#src/utils/axios-request";

// 创建自定义请求实例
const customRequest = createRequest({
	baseURL: "https://api.example.com",
	timeout: 30000,
});
```

## 请求重试

### 基础重试

```typescript
// 启用默认重试（重试 3 次）
const data = await request.get("/api/data", {
	retry: true,
});
```

### 自定义重试配置

```typescript
const data = await request.get("/api/data", {
	retry: {
		retries: 5, // 最多重试 5 次
		retryDelay: 1000, // 固定延迟 1 秒
		exponentialBackoff: true, // 使用指数退避
		retryDelayBase: 1000, // 基础延迟 1 秒
		shouldRetry: (error, retryCount) => {
			// 自定义重试条件
			if (error instanceof AxiosError) {
				return error.response?.status === 500;
			}
			return false;
		},
		onRetry: (retryCount, error) => {
			console.log(`第 ${retryCount} 次重试`);
		},
	},
});
```

## 请求队列

### 使用队列控制并发

```typescript
// 启用队列，限制并发数为 10（默认）
const data = await request.get("/api/data", {
	useQueue: true,
});
```

### 设置请求优先级

```typescript
// 高优先级请求
const importantData = await request.get("/api/important", {
	useQueue: true,
	priority: 10,
});

// 低优先级请求
const normalData = await request.get("/api/normal", {
	useQueue: true,
	priority: 1,
});
```

### 自定义队列

```typescript
import { createRequestQueue } from "#src/utils/axios-request";

// 创建自定义队列（最大并发数为 5）
const customQueue = createRequestQueue(5);
```

## 缓存机制

### 基础缓存

```typescript
// 启用缓存（默认缓存策略：cache-first）
const data = await request.get("/api/data", {
	cache: {
		ttl: 60000, // 缓存 60 秒
	},
});
```

### 缓存策略

```typescript
// 缓存优先（先查缓存，未命中再请求）
const data1 = await request.get("/api/data", {
	cache: {
		ttl: 60000,
		strategy: "cache-first",
	},
});

// 网络优先（先请求，失败再用缓存）
const data2 = await request.get("/api/data", {
	cache: {
		ttl: 60000,
		strategy: "network-first",
	},
});

// 仅使用缓存
const data3 = await request.get("/api/data", {
	cache: {
		strategy: "cache-only",
	},
});

// 仅使用网络（强制刷新）
const data4 = await request.get("/api/data", {
	cache: {
		strategy: "network-only",
		// 或
		forceRefresh: true,
	},
});
```

### 自定义缓存键

```typescript
const data = await request.get("/api/data", {
	cache: {
		ttl: 60000,
		cacheKey: (config) => {
			// 自定义缓存键生成逻辑
			return `${config.url}-${JSON.stringify(config.params)}`;
		},
	},
});
```

## 文件上传

### 基础上传

```typescript
import { uploadFile, request } from "#src/utils/axios-request";

const file = document.querySelector("input[type=file]").files[0];
const result = await uploadFile(request, "/api/upload", file);
```

### 带进度监控的上传

```typescript
const result = await uploadFile(request, "/api/upload", file, {
	onUploadProgress: (progress, loaded, total) => {
		console.log(`上传进度: ${progress}%`);
	},
});
```

### 使用 FormData

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("name", "文件名");

const result = await uploadFile(request, "/api/upload", formData);
```

### 断点续传（分片上传）

```typescript
import { uploadFileWithChunks, request } from "#src/utils/axios-request";

// 大文件分片上传（默认分片大小 2MB）
const result = await uploadFileWithChunks(request, "/api/upload", file, {
	chunkSize: 2 * 1024 * 1024, // 分片大小（字节）
	concurrency: 3, // 并发上传分片数
	enableResume: true, // 启用断点续传
	onOverallProgress: (progress, loaded, total) => {
		console.log(`整体上传进度: ${progress}%`);
	},
	onChunkProgress: (chunkIndex, progress, loaded, total) => {
		console.log(`分片 ${chunkIndex} 进度: ${progress}%`);
	},
	// 自定义进度存储（可选）
	getUploadedChunks: async (fileId) => {
		// 从服务器或本地存储获取已上传的分片索引
		return [];
	},
	saveUploadProgress: async (fileId, chunkIndex) => {
		// 保存上传进度
	},
	clearUploadProgress: async (fileId) => {
		// 清除上传进度
	},
});
```

### 使用本地存储管理上传进度

```typescript
import {
	uploadFileWithChunks,
	saveProgressToLocalStorage,
	getProgressFromLocalStorage,
	clearProgressFromLocalStorage,
	request,
} from "#src/utils/axios-request";

const result = await uploadFileWithChunks(request, "/api/upload", file, {
	getUploadedChunks: getProgressFromLocalStorage,
	saveUploadProgress: saveProgressToLocalStorage,
	clearUploadProgress: clearProgressFromLocalStorage,
});
```

## 文件下载

### 基础下载

```typescript
import { downloadFile, request } from "#src/utils/axios-request";

const blob = await downloadFile(request, "/api/download/file.pdf");
```

### 带进度监控的下载

```typescript
const blob = await downloadFile(request, "/api/download/file.pdf", {
	onDownloadProgress: (progress, loaded, total) => {
		console.log(`下载进度: ${progress}%`);
	},
});
```

### 下载并保存到本地

```typescript
import { downloadAndSaveFile, request } from "#src/utils/axios-request";

await downloadAndSaveFile(request, "/api/download/file.pdf", "文件名.pdf");
```

## 请求日志

### 配置日志级别

```typescript
import { configureLogger, LogLevel } from "#src/utils/axios-request";

// 配置日志
configureLogger({
	level: LogLevel.DEBUG, // 记录详细信息
	enableInDev: true, // 开发环境启用
	enableInProd: false, // 生产环境禁用
	customLogger: (message, data) => {
		// 自定义日志处理
		console.log(`[Custom] ${message}`, data);
	},
});
```

### 日志级别说明

- `LogLevel.NONE`: 不记录日志
- `LogLevel.ERROR`: 仅记录错误
- `LogLevel.WARN`: 记录错误和警告
- `LogLevel.INFO`: 记录所有信息
- `LogLevel.DEBUG`: 记录详细信息（包括请求/响应数据）

默认日志级别为 `LogLevel.ERROR`，仅输出异常请求；如需排查请求链路，可在业务入口显式调用 `configureLogger` 调整级别。

## 组合使用

### 重试 + 缓存

```typescript
const data = await request.get("/api/data", {
	retry: {
		retries: 3,
	},
	cache: {
		ttl: 60000,
		strategy: "network-first",
	},
});
```

### 队列 + 缓存

```typescript
const data = await request.get("/api/data", {
	useQueue: true,
	priority: 5,
	cache: {
		ttl: 60000,
	},
});
```

## 其他配置选项

### 加载提示

```typescript
// 显示加载提示
const data = await request.get("/api/data", {
	showLoading: true,
});
```

### 成功/错误消息

```typescript
// 显示成功消息
const data = await request.post("/api/user", userData, {
	successMessage: "用户创建成功",
});

// 自定义错误消息
const data = await request.get("/api/data", {
	errorMessage: "获取数据失败，请稍后重试",
});

// 禁用错误消息
const data = await request.get("/api/data", {
	errorMessage: false,
});
```

### 返回完整响应

```typescript
const response = await request.get("/api/data", {
	withFullResponse: true,
});
// response 是完整的 AxiosResponse 对象
```

### 跳过认证

```typescript
const data = await request.get("/api/public/data", {
	skipAuth: true,
});
```

## 请求去重/防抖/节流

### 防抖（Debounce）

```typescript
// 防抖：延迟执行，如果短时间内多次触发，只执行最后一次
const data = await request.get("/api/search", {
	debounce: {
		debounce: true,
		debounceDelay: 300, // 延迟 300 毫秒
	},
});
```

### 节流（Throttle）

```typescript
// 节流：限制执行频率，在指定时间间隔内只执行一次
const data = await request.get("/api/data", {
	debounce: {
		throttle: true,
		throttleInterval: 1000, // 间隔 1 秒
	},
});
```

### 请求去重（Dedupe）

```typescript
// 去重：在时间窗口内，相同的请求只执行一次，返回同一个 Promise
const data = await request.get("/api/data", {
	debounce: {
		dedupe: true,
		dedupeWindow: 1000, // 时间窗口 1 秒
		dedupeKey: (config) => {
			// 自定义去重键生成逻辑
			return `${config.url}-${JSON.stringify(config.params)}`;
		},
	},
});
```

### 简化配置

```typescript
// 使用布尔值启用默认配置
const data = await request.get("/api/data", {
	debounce: true, // 使用默认防抖配置（延迟 300ms）
});
```

## 参数序列化

### 基础序列化

```typescript
// 启用参数序列化（默认启用）
const data = await request.get("/api/data", {
	serializer: true,
});
```

### 自定义序列化配置

```typescript
const data = await request.get("/api/data", {
	serializer: {
		enable: true,
		arrayFormat: "indices", // 数组格式：a[0]=1&a[1]=2
		serializeDate: true, // 日期自动转换为 ISO 字符串
		customSerializer: (params) => {
			// 自定义序列化逻辑
			return params;
		},
		paramsProcessor: (params) => {
			// 自定义参数处理逻辑
			return params;
		},
	},
});
```

### 数组序列化格式

```typescript
// indices: a[0]=1&a[1]=2
const data1 = await request.get("/api/data", {
	serializer: { arrayFormat: "indices" },
});

// brackets: a[]=1&a[]=2
const data2 = await request.get("/api/data", {
	serializer: { arrayFormat: "brackets" },
});

// repeat: a=1&a=2
const data3 = await request.get("/api/data", {
	serializer: { arrayFormat: "repeat" },
});

// comma: a=1,2
const data4 = await request.get("/api/data", {
	serializer: { arrayFormat: "comma" },
});
```

## 性能监控

### 启用性能监控

```typescript
// 启用性能监控（默认启用）
const data = await request.get("/api/data", {
	monitor: true,
});
```

### 自定义监控配置

```typescript
const data = await request.get("/api/data", {
	monitor: {
		enable: true,
		slowRequestThreshold: 3000, // 慢请求阈值 3 秒
		onSlowRequest: (info) => {
			console.warn("慢请求警告:", info);
		},
		onRequestComplete: (info) => {
			console.log("请求完成:", info);
		},
	},
});
```

### 获取请求统计信息

```typescript
import { getRequestStats, resetRequestStats } from "#src/utils/axios-request";

// 获取统计信息
const stats = getRequestStats();
console.log("总请求数:", stats.total);
console.log("成功请求数:", stats.success);
console.log("失败请求数:", stats.failed);
console.log("慢请求数:", stats.slow);
console.log("平均耗时:", stats.averageDuration);
console.log("最大耗时:", stats.maxDuration);
console.log("最小耗时:", stats.minDuration);

// 重置统计信息
resetRequestStats();
```

### 获取慢请求列表

```typescript
import { getSlowRequests } from "#src/utils/axios-request";

// 获取耗时超过 3 秒的请求
const slowRequests = getSlowRequests(3000);
```
