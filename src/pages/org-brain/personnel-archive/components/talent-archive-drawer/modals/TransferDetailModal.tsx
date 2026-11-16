/**
 * 调岗详情弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentArchiveCompanyHistoryItem } from "#src/api/org-brain/personnel-archive";
import type { StepProps } from "antd";

import { Empty, Modal, Steps, Typography } from "antd";
import { useMemo } from "react";
import {
	getCompanyHistoryJob,
	getCompanyHistoryPosition,
	getCompanyHistoryTransferDepartment,
} from "../company-history";

const { Text } = Typography;

/**
 * 调岗详情项类型
 *
 * @author 王善能
 * @date 2026-04-16
 */
export type TransferDetailItem = TalentArchiveCompanyHistoryItem;

const EMPTY_TRANSFER_DETAIL_LIST: TransferDetailItem[] = [];

interface TransferDetailModalProps {
	/** 是否打开 */
	open: boolean;
	/** 弹窗标题 */
	title: string;
	/** 关闭回调 */
	onClose: () => void;
	/** 调岗详情数据 */
	data?: TransferDetailItem[];
}

/**
 * 调岗详情弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function TransferDetailModal({
	open,
	title,
	onClose,
	data = EMPTY_TRANSFER_DETAIL_LIST,
}: TransferDetailModalProps) {
	const stepsItems = useMemo(() => {
		// 按开始时间降序排序（最新的在最上面）
		const sortedData = [...data].sort((currentItem, nextItem) =>
			nextItem.beginDate.localeCompare(currentItem.beginDate),
		);

		return sortedData.map((item) => {
			const departmentText = getCompanyHistoryTransferDepartment(item);

			return {
				title: (
					<div className="grid w-full grid-cols-12 items-center gap-4">
						<Text strong className="col-span-2">
							{item.beginDate}
						</Text>
						<Text
							className="col-span-4"
							ellipsis={{ tooltip: true }}
							title={departmentText}
						>
							部门：
							{departmentText}
						</Text>
						<Text
							className="col-span-3"
							ellipsis={{ tooltip: true }}
							title={getCompanyHistoryJob(item)}
						>
							岗位：
							{getCompanyHistoryJob(item)}
						</Text>
						<Text
							className="col-span-3"
							ellipsis={{ tooltip: true }}
							title={getCompanyHistoryPosition(item)}
						>
							职位：
							{getCompanyHistoryPosition(item)}
						</Text>
					</div>
				),
				status: "finish",
			};
		});
	}, [data]);

	return (
		<Modal title={title} open={open} onCancel={onClose} footer={null} width={960} centered>
			{stepsItems.length === 0 ? (
				<Empty description="暂无调岗详情数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<div className="rounded border p-3 pb-0 [&_.ant-steps-item-title]:!flex [&_.ant-steps-item-title]:!min-h-8 [&_.ant-steps-item-title]:items-center">
					<Steps
						direction="vertical"
						progressDot
						current={0}
						items={stepsItems as StepProps[]}
					/>
				</div>
			)}
		</Modal>
	);
}
