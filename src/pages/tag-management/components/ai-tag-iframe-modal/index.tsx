/**
 * AI 打标 Iframe Modal。
 *
 * 内嵌钉钉 hrbrain 标签库页面，监听 postMessage 完成智能标签与复合规则交互。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import { Modal } from "antd";
import { useEffect, useRef } from "react";

/**
 * 智能标签返回数据项
 */
export interface AiSmartTagItem {
	/** 临时唯一标识 */
	tempId: string;
	/** 标签名称 */
	tagName: string;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** 业务类别编码 */
	businessCategory?: string | string[];
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 是否已存在（系统中已有的标签） */
	isExisting: boolean;
	/** 标签ID（新增和已存在的标签都有真实ID，AI返回） */
	tagId?: string;
	/** 已存在标签的ID（如果 isExisting 为 true，与 tagId 相同） */
	existingTagId?: string;
	/** 阿里标签编码 */
	aliTagCode?: string;
	/** AI 会话ID */
	aiSessionId?: string;
}

/**
 * 智能标签返回消息负载
 */
export interface AiSmartTagsReturnedPayload {
	/** 标签列表 */
	tags: AiSmartTagItem[];
	/** 新增标签数量 */
	newTagCount: number;
	/** 已存在标签数量 */
	existingTagCount: number;
}

/**
 * AI 打标 Iframe Modal 组件属性
 */
export interface AiTagIframeModalProps {
	/** 是否显示 Modal */
	open: boolean;
	/** 关闭 Modal 的回调 */
	onClose: () => void;
	/** Iframe URL */
	url: string;
	/** 标签库类型：1-组织标签，2-人才标签 */
	libraryType: "1" | "2";
	/** Modal 标题 */
	title?: string;
	/** AI 会话创建回调 */
	onConversationCreated?: (payload: AiConversationCreatedPayload) => void;
	/** AI 会话提交回调 */
	onConversationSubmitted?: (payload: AiConversationSubmittedPayload) => void;
	/** 标签生成提交回调 */
	onTagGenerationSubmitted?: (payload: TagGenerationSubmittedPayload) => void;
	/** Modal body 区域自定义 className，用于区分 AI 对话与复合规则 iframe 的内边距 */
	bodyClassName?: string;
}

/**
 * AI 会话创建消息负载
 */
export interface AiConversationCreatedPayload {
	/** 会话ID（用于获取标签数据） */
	sessionId: string;
	/** 标题 */
	title: string;
	/** 创建时间 */
	createdAt: string;
	/** 额外信息 */
	extra?: Record<string, unknown>;
}

/**
 * AI 会话提交消息负载
 */
export interface AiConversationSubmittedPayload {
	/** 会话ID（用于获取标签数据） */
	sessionId: string;
	/** 用户消息 */
	userMessage: string;
	/** 消息ID */
	messageId: string;
	/** 提交时间 */
	submittedAt: string;
	/** 状态 */
	status: string;
	/** 额外信息 */
	extra?: Record<string, unknown>;
}

/**
 * 标签生成提交消息负载
 */
export interface TagGenerationSubmittedPayload {
	/** 任务ID */
	taskId: string;
	/** 标签列表 */
	tags: string[];
	/** 标签名称 */
	name: string;
	/** 标签唯一code */
	code: string;
	/** 状态 */
	status: string;
	/** 提交时间 */
	submittedAt: string;
	/** 错误信息 */
	errorMessage?: string;
	/** 额外信息 */
	extra?: Record<string, unknown>;
}

/**
 * 来自 iframe 的消息类型
 */
type IframeMessageType =
	| "C2P_AI_CONVERSATION_CREATED"
	| "C2P_AI_CONVERSATION_SUBMITTED"
	| "C2P_TAG_GENERATION_SUBMITTED";

/**
 * 来自 iframe 的消息
 */
interface IframeMessage {
	/** 消息类型 */
	type: IframeMessageType;
	/** 消息负载 */
	payload:
		| AiConversationCreatedPayload
		| AiConversationSubmittedPayload
		| TagGenerationSubmittedPayload;
}

/**
 * AI 打标 Iframe Modal 组件
 *
 * 内嵌钉钉标签库页面，并监听 postMessage 消息，支持人才标签和组织标签两种类型
 *
 * @param props - 组件属性
 * @param props.open - 是否显示 Modal
 * @param props.onClose - 关闭 Modal 的回调
 * @param props.url - Iframe URL
 * @param props.libraryType - 标签库类型：1-组织标签，2-人才标签
 * @param props.title - Modal 标题
 * @param props.onConversationCreated - AI 会话创建回调
 * @param props.onConversationSubmitted - AI 会话提交回调
 * @param props.onTagGenerationSubmitted - 标签生成提交回调
 * @param props.bodyClassName - Modal body 自定义 className
 * @returns AI 打标 Iframe Modal
 *
 * @author 王善能
 * @since 2026-06-11
 * @example
 * ```tsx
 * <AiTagIframeModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   url="https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag?label=%E6%96%B0%E5%BB%BA%E6%A0%87%E7%AD%BE%E8%A7%84%E5%88%99&hideMenu=true"
 *   libraryType="2"
 *   title="人才标签库"
 *   onTagGenerationSubmitted={(payload) => {
 *     message.success(`标签"${payload.name}"生成成功`);
 *     // 刷新标签列表
 *     actionRef.current?.reload();
 *   }}
 * />
 * ```
 */
export function AiTagIframeModal({
	open,
	onClose,
	url,
	libraryType,
	title = "标签库",
	onConversationCreated,
	onConversationSubmitted,
	onTagGenerationSubmitted,
	bodyClassName,
}: AiTagIframeModalProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		/**
		 * 处理 postMessage 消息
		 */
		const handleMessage = (event: MessageEvent) => {
			// 1. 安全建议: 校验来源域名
			if (event.origin !== "https://hrbrain.dingtalk.com") {
				return;
			}

			// 2. 解析消息数据
			const msg = event.data as IframeMessage;
			if (!msg || !msg.type) {
				return;
			}

			// 3. 根据消息类型处理
			switch (msg.type) {
				case "C2P_AI_CONVERSATION_CREATED": {
					// 处理: AI 新建会话
					const payload = msg.payload as AiConversationCreatedPayload;
					// eslint-disable-next-line no-console
					console.log(
						`[${libraryType === "1" ? "组织标签" : "人才标签"}] AI会话已创建:`,
						payload,
					);
					// 调用回调函数
					onConversationCreated?.(payload);
					break;
				}
				case "C2P_AI_CONVERSATION_SUBMITTED": {
					// 处理: AI 会话提交
					const payload = msg.payload as AiConversationSubmittedPayload;
					// eslint-disable-next-line no-console
					console.log(
						`[${libraryType === "1" ? "组织标签" : "人才标签"}] AI会话已提交:`,
						payload,
					);
					// 调用回调函数
					onConversationSubmitted?.(payload);
					break;
				}
				case "C2P_TAG_GENERATION_SUBMITTED": {
					const payload = msg.payload as TagGenerationSubmittedPayload;
					// eslint-disable-next-line no-console
					console.log(
						`[${libraryType === "1" ? "组织" : "人才"}] 复合规则生成成功:`,
						msg,
						payload,
					);
					// 调用回调函数，让父组件处理业务逻辑（如刷新列表、提示用户等）
					onTagGenerationSubmitted?.(payload);
					break;
				}
				default: {
					// 预留扩展
					// eslint-disable-next-line no-console
					console.log("收到未知类型消息:", msg);
					break;
				}
			}
		};

		// 添加消息监听
		window.addEventListener("message", handleMessage);

		// 清理函数
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [
		open,
		libraryType,
		onConversationCreated,
		onConversationSubmitted,
		onTagGenerationSubmitted,
	]);

	/**
	 * 处理关闭事件
	 */
	const handleClose = () => {
		onClose();
	};

	return (
		<Modal
			title={title}
			open={open}
			onCancel={handleClose}
			centered
			width="80vw"
			footer={null}
			destroyOnHidden
			classNames={{
				body: bodyClassName,
			}}
			styles={{
				body: {
					height: "82vh",
				},
			}}
		>
			<iframe
				ref={iframeRef}
				src={url}
				title={title}
				className="h-full w-full"
				allow="storage-access"
				loading="lazy"
			/>
		</Modal>
	);
}
