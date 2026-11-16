import type { PersonnelArchiveTagItem } from "#src/api/org-brain/personnel-archive";

import { SectionTitle } from "#src/components";
import { getPersonnelArchiveTagDisplayName } from "#src/pages/org-brain/personnel-archive/components/tag-display";
import { cn } from "#src/utils";
import { UserOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Tag, Tooltip } from "antd";

import portraitBtnStyles from "./portrait-button.module.css";

import { SectionEmptyHint } from "./SectionEmptyHint";

// 加载时预留标签单行高度，避免数据返回前下推后续区块。
const TAG_ROW_MIN_HEIGHT_CLASS = "min-h-[34px] [&_.ant-spin-container]:min-h-[34px]";

function PortraitButton({
	onClick,
	disabled,
	children,
}: {
	onClick?: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!disabled && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onClick?.();
		}
	};

	return (
		<div
			role="button"
			tabIndex={disabled ? undefined : 0}
			onClick={disabled ? undefined : onClick}
			onKeyDown={handleKeyDown}
			className={cn(
				portraitBtnStyles.portraitBtn,
				"relative inline-flex cursor-pointer items-center gap-1.5 px-4 py-2",
				disabled && "pointer-events-none cursor-not-allowed opacity-50",
			)}
		>
			<UserOutlined className={cn(portraitBtnStyles.portraitBtnIcon, "text-base")} />
			<span className={portraitBtnStyles.portraitBtnText}>{children}</span>
		</div>
	);
}

interface TagsSectionProps {
	/** 用户ID（用于控制人才画像按钮状态） */
	userId?: string;
	/** 抽屉容器查询的标签列表 */
	tags: PersonnelArchiveTagItem[];
	/** 标签列表是否加载中 */
	loading: boolean;
	/** 标签列表是否加载失败 */
	error: boolean;
	/** 重新加载标签列表 */
	onRetry: () => void;
	/** 点击人才画像按钮的回调，由父组件管理抽屉开关状态 */
	onPortraitOpen: () => void;
}

/**
 * 标签区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function TagsSection({
	userId,
	tags,
	loading,
	error,
	onRetry,
	onPortraitOpen,
}: TagsSectionProps) {
	return (
		<div>
			<SectionTitle
				title="标签"
				titleExtra={
					error ? (
						<SectionEmptyHint text="标签加载失败" />
					) : !loading && tags.length === 0 ? (
						<SectionEmptyHint text="暂无标签数据" />
					) : null
				}
				extra={
					<div className="ml-auto flex items-center gap-2">
						{error && (
							<Button size="small" type="link" onClick={onRetry}>
								重新加载
							</Button>
						)}
						<PortraitButton onClick={onPortraitOpen} disabled={!userId}>
							人才画像
						</PortraitButton>
					</div>
				}
			/>
			<Spin
				spinning={loading}
				size="small"
				wrapperClassName={loading ? TAG_ROW_MIN_HEIGHT_CLASS : undefined}
			>
				{tags.length > 0 ? (
					<Space size={4} wrap className="mt-3">
						{tags.map((tag) => (
							<Tooltip key={`${tag.tagId}-${tag.tagName}`} title={tag.tagName}>
								<Tag color="blue">{getPersonnelArchiveTagDisplayName(tag)}</Tag>
							</Tooltip>
						))}
					</Space>
				) : null}
			</Spin>
		</div>
	);
}
