/**
 * 公用图片灯箱预览弹窗
 *
 * 功能：多图切换、缩放、水平/垂直翻转、重置
 * 支持通过 fetchBlobSrc 回调拉取鉴权 Blob URL（用于需要 token 的服务端图片）
 */

import {
	CloseOutlined,
	LeftOutlined,
	RetweetOutlined,
	RightOutlined,
	RotateLeftOutlined,
	SwapOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, message, Modal, Spin, Tooltip } from "antd";
import { useCallback, useEffect, useState } from "react";

export interface ImagePreviewItem {
	key: string;
	name: string;
	/** 图片 src，可以是普通 URL 或 blob URL */
	src: string;
}

interface ImagePreviewModalProps {
	open: boolean;
	onClose: () => void;
	items: ImagePreviewItem[];
	currentIndex: number;
	onIndexChange: (index: number) => void;
	/**
	 * 可选：为当前图片获取鉴权 Blob URL
	 * - 返回 string：使用该 URL 展示（modal 内部负责 revokeObjectURL）
	 * - 返回 null：直接使用 item.src
	 */
	fetchBlobSrc?: (item: ImagePreviewItem) => Promise<string | null>;
}

export function ImagePreviewModal({
	open,
	onClose,
	items,
	currentIndex,
	onIndexChange,
	fetchBlobSrc,
}: ImagePreviewModalProps) {
	const [zoom, setZoom] = useState(1);
	const [flipX, setFlipX] = useState(false);
	const [flipY, setFlipY] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [blobLoading, setBlobLoading] = useState(false);

	const currentItem = items[currentIndex];
	const canSwitch = items.length > 1;

	const resetTransform = useCallback(() => {
		setZoom(1);
		setFlipX(false);
		setFlipY(false);
	}, []);

	// 打开时重置变换，防止上次操作残留
	useEffect(() => {
		if (open) {
			resetTransform();
		}
	}, [open, resetTransform]);

	// 越界修正：items 减少时将 index 收敛到最后一项
	useEffect(() => {
		if (items.length > 0 && currentIndex >= items.length) {
			onIndexChange(items.length - 1);
		}
	}, [currentIndex, items.length, onIndexChange]);

	// 拉取鉴权 Blob URL（服务端图片），随 open / currentItem 变化
	useEffect(() => {
		// 先清理之前的 blob URL
		if (blobUrl) {
			window.URL.revokeObjectURL(blobUrl);
			setBlobUrl(null);
		}

		if (!open || !currentItem || !fetchBlobSrc) {
			setBlobLoading(false);
			return;
		}

		let cancelled = false;
		setBlobLoading(true);

		fetchBlobSrc(currentItem)
			.then((url) => {
				if (cancelled) {
					if (url) {
						window.URL.revokeObjectURL(url);
					}
					return;
				}
				setBlobUrl(url);
			})
			.catch(() => {
				if (!cancelled) {
					message.error("预览加载失败");
				}
			})
			.finally(() => {
				if (!cancelled) {
					setBlobLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [open, currentItem, fetchBlobSrc]);

	// 卸载时释放 blob URL
	useEffect(() => {
		return () => {
			setBlobUrl((prev) => {
				if (prev) {
					window.URL.revokeObjectURL(prev);
				}
				return null;
			});
		};
	}, []);

	const handleSwitch = useCallback(
		(direction: "prev" | "next") => {
			if (items.length <= 1) {
				return;
			}
			onIndexChange(
				direction === "prev"
					? currentIndex <= 0
						? items.length - 1
						: currentIndex - 1
					: currentIndex >= items.length - 1
						? 0
						: currentIndex + 1,
			);
			resetTransform();
		},
		[currentIndex, items.length, onIndexChange, resetTransform],
	);

	return (
		<Modal
			open={open}
			onCancel={onClose}
			footer={null}
			width={1280}
			style={{ maxWidth: "calc(100vw - 32px)" }}
			destroyOnHidden
			title={null}
			closable={false}
			centered
			styles={{
				body: { padding: 0 },
				content: {
					padding: 0,
					background: "transparent",
					boxShadow: "none",
				},
			}}
		>
			{currentItem && (
				<div className="relative h-[80vh] overflow-hidden rounded-lg bg-[rgba(0,0,0,0.7)]">
					<Button
						type="text"
						shape="circle"
						icon={<CloseOutlined />}
						onClick={onClose}
						className="!absolute right-4 top-4 !z-20 !h-11 !w-11 !text-white/80 hover:!bg-white/15 hover:!text-white"
					/>

					<Button
						type="text"
						shape="circle"
						icon={<LeftOutlined />}
						onClick={() => handleSwitch("prev")}
						disabled={!canSwitch}
						className="!absolute left-5 top-1/2 !z-20 !h-11 !w-11 -translate-y-1/2 !text-white/80 hover:!bg-white/15 hover:!text-white disabled:!text-white/35"
					/>
					<Button
						type="text"
						shape="circle"
						icon={<RightOutlined />}
						onClick={() => handleSwitch("next")}
						disabled={!canSwitch}
						className="!absolute right-5 top-1/2 !z-20 !h-11 !w-11 -translate-y-1/2 !text-white/80 hover:!bg-white/15 hover:!text-white disabled:!text-white/35"
					/>

					<div className="flex h-full items-center justify-center px-20 py-14">
						{blobLoading ? (
							<Spin size="large" tip="加载中…" />
						) : (
							<img
								src={blobUrl ?? currentItem.src}
								alt={currentItem.name}
								className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
								style={{
									transform: `scale(${zoom}) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
								}}
							/>
						)}
					</div>

					<div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
						<div className="flex items-center gap-1 rounded-full bg-[rgb(45,45,45)] px-2 py-1 backdrop-blur-sm">
							<Tooltip title={flipX ? "取消水平翻转" : "水平翻转"}>
								<Button
									type="text"
									shape="circle"
									icon={<SwapOutlined />}
									onClick={() => setFlipX((prev) => !prev)}
									className="!text-white/85 hover:!bg-white/15 hover:!text-white"
								/>
							</Tooltip>
							<Tooltip title={flipY ? "取消垂直翻转" : "垂直翻转"}>
								<Button
									type="text"
									shape="circle"
									icon={<RetweetOutlined />}
									onClick={() => setFlipY((prev) => !prev)}
									className="!text-white/85 hover:!bg-white/15 hover:!text-white"
								/>
							</Tooltip>
							<Tooltip title="重置">
								<Button
									type="text"
									shape="circle"
									icon={<RotateLeftOutlined />}
									onClick={resetTransform}
									className="!text-white/85 hover:!bg-white/15 hover:!text-white"
								/>
							</Tooltip>
							<Tooltip title="缩小">
								<Button
									type="text"
									shape="circle"
									icon={<ZoomOutOutlined />}
									onClick={() =>
										setZoom((prev) =>
											Math.max(0.2, Number((prev - 0.2).toFixed(2))),
										)
									}
									className="!text-white/85 hover:!bg-white/15 hover:!text-white"
								/>
							</Tooltip>
							<Tooltip title="放大">
								<Button
									type="text"
									shape="circle"
									icon={<ZoomInOutlined />}
									onClick={() =>
										setZoom((prev) =>
											Math.min(5, Number((prev + 0.2).toFixed(2))),
										)
									}
									className="!text-white/85 hover:!bg-white/15 hover:!text-white"
								/>
							</Tooltip>
						</div>

						<div className="text-sm text-white/90">
							{currentIndex + 1}/{items.length}
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}
