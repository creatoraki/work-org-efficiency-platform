# AI 打标 Iframe Modal 组件

## 概述

`AiTagIframeModal` 是一个通用的 AI 打标 iframe 弹窗组件，用于嵌入钉钉组织大脑标签库页面。该组件支持人才标签和组织标签两种类型，并自动监听和处理来自 iframe 的 postMessage 消息。

## 功能特性

- ✅ 支持人才标签（`libraryType="2"`）和组织标签（`libraryType="1"`）
- ✅ 自动监听 iframe 的 postMessage 消息
- ✅ 支持三种消息类型：
    - `C2P_AI_CONVERSATION_CREATED`：AI 会话创建
    - `C2P_AI_CONVERSATION_SUBMITTED`：AI 会话提交
    - `C2P_TAG_GENERATION_SUBMITTED`：标签生成提交（⚠️ 仅在成功时发送）
- ✅ 可配置的 iframe URL
- ✅ 安全的 Origin 校验机制
- ✅ 提供回调函数机制，方便业务逻辑处理

## 使用示例

### 基本使用

```tsx
import { useState } from "react";
import { message, Button } from "antd";
import { AiTagIframeModal } from "#src/pages/tag-management/components/shared";

function MyComponent() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>打开 AI 打标</Button>
			<AiTagIframeModal
				open={isOpen}
				onClose={() => setIsOpen(false)}
				url="https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true"
				libraryType="2"
				title="人才标签库"
				onTagGenerationSubmitted={(payload) => {
					message.success(`标签"${payload.name}"生成成功！`);
					// 处理标签提交成功后的业务逻辑
				}}
			/>
		</>
	);
}
```

### 在标签表单中使用（完整示例）

```tsx
import { useRef, useState } from "react";
import { message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import {
	AiTagIframeModal,
	type TagGenerationSubmittedPayload,
} from "#src/pages/tag-management/components/shared";
import { TAG_RULE_TYPE_DICT } from "../../config";

// URL 配置
const AI_TAG_IFRAME_URL: Record<string, string> = {
	[TAG_RULE_TYPE_DICT.ORG]:
		"https://hrbrain.dingtalk.com/hrbrain/org/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true",
	[TAG_RULE_TYPE_DICT.TALENT]:
		"https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true",
};

function TagFormDrawer({ tagLibraryType }: { tagLibraryType: "1" | "2" }) {
	const actionRef = useRef<ActionType>();
	const [isModalOpen, setIsModalOpen] = useState(false);

	// 处理标签生成成功
	const handleTagGenerationSubmitted = (payload: TagGenerationSubmittedPayload) => {
		message.success(`标签"${payload.name}"生成成功！`);

		// 关闭弹窗
		setIsModalOpen(false);

		// 刷新标签列表
		actionRef.current?.reload();

		// 可以根据 libraryType 执行不同的业务逻辑
		if (tagLibraryType === TAG_RULE_TYPE_DICT.ORG) {
			// 组织标签特定逻辑
			console.log("组织标签生成成功:", payload);
		} else {
			// 人才标签特定逻辑
			console.log("人才标签生成成功:", payload);
		}
	};

	return (
		<AiTagIframeModal
			open={isModalOpen}
			onClose={() => setIsModalOpen(false)}
			url={AI_TAG_IFRAME_URL[tagLibraryType]}
			libraryType={tagLibraryType}
			title={tagLibraryType === TAG_RULE_TYPE_DICT.ORG ? "组织标签库" : "人才标签库"}
			onTagGenerationSubmitted={handleTagGenerationSubmitted}
			onConversationCreated={(payload) => {
				console.log("会话已创建:", payload.sessionId);
			}}
			onConversationSubmitted={(payload) => {
				console.log("会话已提交:", payload.messageId);
			}}
		/>
	);
}
```

## Props 说明

| 属性                       | 类型                                                | 必填 | 默认值     | 说明                                    |
| -------------------------- | --------------------------------------------------- | ---- | ---------- | --------------------------------------- |
| `open`                     | `boolean`                                           | ✓    | -          | 是否显示 Modal                          |
| `onClose`                  | `() => void`                                        | ✓    | -          | 关闭 Modal 的回调                       |
| `url`                      | `string`                                            | ✓    | -          | Iframe URL，需包含 `hideMenu=true` 参数 |
| `libraryType`              | `"1" \| "2"`                                        | ✓    | -          | 标签库类型：1-组织标签，2-人才标签      |
| `title`                    | `string`                                            | ✗    | `"标签库"` | Modal 标题                              |
| `onConversationCreated`    | `(payload: AiConversationCreatedPayload) => void`   | ✗    | -          | AI 会话创建回调                         |
| `onConversationSubmitted`  | `(payload: AiConversationSubmittedPayload) => void` | ✗    | -          | AI 会话提交回调                         |
| `onTagGenerationSubmitted` | `(payload: TagGenerationSubmittedPayload) => void`  | ✗    | -          | 标签生成提交回调（仅成功时触发）        |

## 消息类型详解

### 1. C2P_AI_CONVERSATION_CREATED - AI 会话创建

**触发时机**：用户在 AI 对话页面中新建一个会话时

**消息结构**：

```typescript
interface AiConversationCreatedPayload {
	sessionId: string; // 会话唯一ID
	title: string; // 会话标题（如"关于赋能标签的咨询"）
	createdAt: string; // 创建时间 ISO 字符串（例如 "2025-12-16T12:00:00Z"）
	extra?: Record<string, unknown>; // 预留扩展字段
}
```

**使用场景**：可用于在自己的页面中新增会话记录、更新侧边栏等

---

### 2. C2P_AI_CONVERSATION_SUBMITTED - AI 会话提交

**触发时机**：用户在 AI 对话页面提交消息时

**消息结构**：

```typescript
interface AiConversationSubmittedPayload {
	sessionId: string; // 会话ID（对应已创建的会话）
	userMessage: string; // 用户发送的消息内容
	messageId: string; // 消息ID
	submittedAt: string; // 提交时间 ISO 字符串
	status: string; // 状态
	extra?: Record<string, unknown>; // 预留扩展字段
}
```

**使用场景**：可用于记录对话行为、更新统计数据等

---

### 3. C2P_TAG_GENERATION_SUBMITTED - 标签生成提交

**触发时机**：用户在标签生产页面点击"如图位置"按钮，且生成成功时

⚠️ **重要提示**：**仅在成功时发送消息，失败时暂不发送**

**消息结构**：

```typescript
interface TagGenerationSubmittedPayload {
	taskId: string; // 任务ID
	name: string; // 生产的标签名称（看图）
	code: string; // 生产的标签唯一code
	tags: string[]; // 生产的标签对应的标签值（看图）
	status: string; // 状态
	submittedAt: string; // 提交时间 ISO 字符串
	errorMessage?: string; // 错误信息（通常为空）
	extra?: Record<string, unknown>; // 预留扩展字段
}
```

**实际示例**：

```json
{
	"type": "C2P_TAG_GENERATION_SUBMITTED",
	"payload": {
		"name": "测试一下返回值",
		"code": "tag_task_001",
		"tags": ["A", "B"],
		"taskId": "task_123456",
		"status": "success",
		"submittedAt": "2025-12-17T10:24:00Z"
	}
}
```

**使用场景**：刷新标签列表、提示用户、更新页面状态等（这是最重要的业务场景）

## 安全说明

组件采用以下安全机制：

### 1. Origin 校验

postMessage 消息的来源域名被严格限制为 `https://hrbrain.dingtalk.com`，确保只接收来自可信源的消息。

```typescript
if (event.origin !== "https://hrbrain.dingtalk.com") {
	return; // 拒绝来自其他域名的消息
}
```

### 2. 消息类型验证

组件会验证消息的类型和结构，确保消息格式正确：

```typescript
const msg = event.data as IframeMessage;
if (!msg || !msg.type) {
	return; // 拒绝无效消息
}
```

### 3. 安全策略

- iframe 允许存储访问（`allow="storage-access"`），确保钉钉登录状态正常
- 采用延迟加载（`loading="lazy"`）优化性能
- 使用 `destroyOnHidden` 确保关闭时完全清理 iframe
- 消息监听器在组件卸载时自动清理，避免内存泄漏

### 4. 关于 sandbox 属性

⚠️ **重要说明**：本组件**未使用** iframe 的 `sandbox` 属性，原因如下：

- 钉钉页面需要设置 `document.domain` 属性以确保跨域通信正常
- 在 `sandbox` 模式下，即使设置了 `allow-same-origin`，浏览器仍会禁止修改 `document.domain`
- 钉钉域名（`https://hrbrain.dingtalk.com`）是受信任的第三方服务
- 通过 Origin 校验和消息类型验证已能提供足够的安全保障

## 注意事项

### ⚠️ 必读要点

1. **URL 配置要求**：
    - 必须包含 `hideMenu=true` 参数以隐藏菜单
    - 人才标签和组织标签使用不同的 URL 路径
    - 可根据需要添加额外参数（如 token、用户 ID 等）

2. **消息处理机制**：
    - 标签提交消息（`C2P_TAG_GENERATION_SUBMITTED`）**仅在成功时发送**
    - 失败场景暂不发送消息，需注意业务逻辑处理
    - 建议在回调中添加错误处理和日志记录

3. **安全性**：
    - Origin 已限制为 `https://hrbrain.dingtalk.com`
    - 严格的消息类型和结构验证
    - 只接收来自可信源的消息
    - 钉钉域名是受信任的第三方服务

4. **性能优化**：
    - 使用 `destroyOnClose` 确保关闭时清理 iframe
    - 消息监听器会在组件卸载时自动清理
    - 避免在回调函数中执行重计算操作

5. **调试建议**：
    - 组件会自动在控制台输出消息日志
    - 日志中包含标签类型标识（组织标签/人才标签）
    - 生产环境建议移除或使用专业日志系统

## 迁移指南

如果你之前使用的是 `TagLibraryModal` 组件，请按照以下步骤迁移到新的 `AiTagIframeModal`：

### 步骤 1：更新导入

```diff
- import { TagLibraryModal } from "./components/tag-library-modal";
+ import {
+   AiTagIframeModal,
+   type TagGenerationSubmittedPayload
+ } from "#src/pages/tag-management/components/shared";
```

### 步骤 2：添加 URL 配置

在组件文件顶部添加 URL 配置常量：

```typescript
import { TAG_RULE_TYPE_DICT } from "../../config";

const AI_TAG_IFRAME_URL: Record<string, string> = {
	[TAG_RULE_TYPE_DICT.ORG]:
		"https://hrbrain.dingtalk.com/hrbrain/org/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true",
	[TAG_RULE_TYPE_DICT.TALENT]:
		"https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true",
};
```

### 步骤 3：更新组件使用

```diff
- <TagLibraryModal
+ <AiTagIframeModal
    open={isModalOpen}
    onClose={() => setIsModalOpen(false)}
+   url={AI_TAG_IFRAME_URL[tagLibraryType]}
+   libraryType={tagLibraryType}
+   title={tagLibraryType === TAG_RULE_TYPE_DICT.ORG ? "组织标签库" : "人才标签库"}
+   onTagGenerationSubmitted={(payload) => {
+     message.success(`标签"${payload.name}"生成成功！`);
+     actionRef.current?.reload(); // 刷新列表
+     setIsModalOpen(false);
+   }}
  />
```

### 步骤 4：移除旧文件（可选）

如果项目中不再需要旧的 `TagLibraryModal` 组件，可以删除：

```bash
# PowerShell
Remove-Item src/pages/tag-management/components/tag-form-drawer/components/tag-library-modal.tsx
```

### 主要变化说明

| 变更项   | 旧版本         | 新版本                           |
| -------- | -------------- | -------------------------------- |
| URL 配置 | 硬编码在组件内 | 通过 props 传入，支持灵活配置    |
| 消息处理 | 仅 console.log | 提供回调函数，支持自定义业务逻辑 |
| 类型支持 | 无明确类型区分 | 通过 `libraryType` 明确区分      |
| 回调机制 | 无             | 提供三种消息回调                 |

### 完整迁移示例

**迁移前**：

```tsx
<TagLibraryModal open={isTagLibraryModalOpen} onClose={() => setIsTagLibraryModalOpen(false)} />
```

**迁移后**：

```tsx
<AiTagIframeModal
	open={isTagLibraryModalOpen}
	onClose={() => setIsTagLibraryModalOpen(false)}
	url={AI_TAG_IFRAME_URL[tagLibraryType]}
	libraryType={tagLibraryType}
	title={tagLibraryType === TAG_RULE_TYPE_DICT.ORG ? "组织标签库" : "人才标签库"}
	onTagGenerationSubmitted={(payload) => {
		message.success(`标签"${payload.name}"生成成功！`);
		setIsTagLibraryModalOpen(false);
		actionRef.current?.reload();
		refreshSearchOptions(); // 刷新选项数据
	}}
/>
```

## 常见问题 FAQ

### Q1: 为什么标签提交失败时没有收到消息？

**A**: 根据对接文档，`C2P_TAG_GENERATION_SUBMITTED` 消息**仅在成功时发送**，失败场景暂不发送消息。这是设计行为，需要在业务逻辑中考虑超时或其他异常情况。

---

### Q2: 如何区分人才标签和组织标签的处理逻辑？

**A**: 使用 `libraryType` 参数进行判断：

```typescript
onTagGenerationSubmitted={(payload) => {
  if (libraryType === TAG_RULE_TYPE_DICT.ORG) {
    // 组织标签特定逻辑
    handleOrgTagSubmit(payload);
  } else {
    // 人才标签特定逻辑
    handleTalentTagSubmit(payload);
  }
}}
```

---

### Q3: 如何在 iframe URL 中传递额外参数？

**A**: 在 URL 配置中添加 query 参数：

```typescript
const AI_TAG_IFRAME_URL = {
	[TAG_RULE_TYPE_DICT.TALENT]:
		`https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag?` +
		`label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&` +
		`hideMenu=true&` +
		`token=${userToken}&` +
		`userId=${userId}`,
};
```

---

### Q4: 消息监听会影响性能吗？

**A**: 不会。组件使用了以下优化：

- 只在 Modal 打开时添加监听器
- Origin 校验确保只处理来自可信源的消息
- 组件卸载时自动清理监听器
- 使用 `destroyOnClose` 确保 iframe 完全销毁

---

### Q5: 如何调试 postMessage 消息？

**A**: 组件已内置日志输出，打开浏览器控制台即可查看：

```
[人才标签] 标签提交成功: {name: "测试标签", code: "tag_001", ...}
```

如需更详细的调试，可以在回调中添加：

```typescript
onTagGenerationSubmitted={(payload) => {
  console.table(payload); // 表格形式显示
  console.log("完整数据:", JSON.stringify(payload, null, 2));
}}
```

---

### Q6: 可以同时打开多个 iframe 吗？

**A**: 技术上可以，但不建议。原因：

- 多个 iframe 同时监听 postMessage 可能导致消息混乱
- 消耗较多资源
- 用户体验不佳

建议使用单例模式，确保同时只有一个 Modal 打开。

---

### Q7: 组件支持移动端吗？

**A**: 支持，但需注意：

- Modal 宽度在移动端会自适应（当前设置为 `80vw`）
- iframe 高度固定为 `80vh`，移动端体验可能需要调整
- 建议在移动端使用响应式设计

---

## 技术支持

如有问题或建议，请联系相关技术负责人或在项目中提交 Issue。

## 更新日志

### v1.2.0 (2025-12-24)

- 🐛 修复：移除 iframe 的 `sandbox` 属性，解决钉钉页面 `document.domain` 设置被阻止的问题
- 📝 更新安全说明文档，详细说明不使用 sandbox 的原因
- ✨ 优化安全机制说明，强调 Origin 校验和消息验证

### v1.1.0 (2025-12-17)

- ✨ 新增消息回调机制
- ✨ 导出消息类型定义
- ✨ 完善文档和使用示例
- 🐛 修复 TypeScript 类型定义问题
- 📝 根据对接文档更新说明

### v1.0.0 (2025-12-16)

- 🎉 初始版本发布
- ✨ 支持人才标签和组织标签
- ✨ 实现 postMessage 通信
- ✨ Origin 安全校验
