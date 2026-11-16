import type { ButtonProps } from "antd";
import DownloadIcon from "#src/assets/small-icons/common/download.png";
import { BasicButton } from "#src/components/basic-button";
import { DownloadCenterPopup } from "#src/layout/widgets/download-center";
import { Badge } from "antd";
import { useCallback, useMemo, useState } from "react";

/**
 * Header 中的下载中心图标组件
 * 显示动态图标 + Badge 数字(进行中任务数)
 */
export function DownloadCenter({ ...restProps }: ButtonProps) {
	const [open, setOpen] = useState(false);
	const [ongoingCount, setOngoingCount] = useState(0);

	/**
	 * 处理任务统计数据更新
	 */
	const handleTaskCountChange = useCallback((count: number) => {
		setOngoingCount(count);
	}, []);

	/**
	 * 动态图标选择逻辑
	 * 根据任务状态切换图标
	 * - 有进行中任务: 下载中图标
	 * - 无进行中任务: 普通下载图标
	 */
	const iconElement = useMemo(() => {
		// 有进行中任务 - 下载中图标
		if (ongoingCount > 0) {
			return <img src={DownloadIcon} alt="下载中心" className="h-8 w-8" />;
		}

		// 默认状态 - 普通下载图标
		return <img src={DownloadIcon} alt="下载中心" className="h-8 w-8" />;
	}, [ongoingCount]);

	return (
		<DownloadCenterPopup
			open={open}
			onOpenChange={setOpen}
			onTaskCountChange={handleTaskCountChange}
		>
			<BasicButton type="text" {...restProps} onClick={() => setOpen(!open)} title="导出中心">
				<Badge
					count={ongoingCount}
					offset={[-2, 6]}
					size="small"
					className="text-xs"
					style={{
						boxShadow: "0 0 0 1px #fff",
						fontSize: "12px",
						minWidth: "14px",
						height: "14px",
						lineHeight: "14px",
					}}
				>
					{iconElement}
				</Badge>
			</BasicButton>
		</DownloadCenterPopup>
	);
}

export default DownloadCenter;
