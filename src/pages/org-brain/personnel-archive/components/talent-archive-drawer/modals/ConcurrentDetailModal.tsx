/**
 * 兼岗详情弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentArchiveCompanyHistoryItem } from "#src/api/org-brain/personnel-archive";

import { SectionTitle } from "#src/components";
import { ProDescriptions } from "@ant-design/pro-components";
import { Empty, Modal } from "antd";
import {
	getCompanyHistoryDepartment,
	getCompanyHistoryJob,
	getCompanyHistoryPosition,
	getCompanyHistoryTypeLabel,
} from "../company-history";

/**
 * 兼岗详情项类型
 *
 * @author 王善能
 * @date 2026-04-16
 */
export type ConcurrentDetailItem = TalentArchiveCompanyHistoryItem;

const EMPTY_CONCURRENT_DETAIL_LIST: ConcurrentDetailItem[] = [];

interface ConcurrentDetailModalProps {
	/** 是否打开 */
	open: boolean;
	/** 弹窗标题 */
	title: string;
	/** 关闭回调 */
	onClose: () => void;
	/** 兼岗详情数据 */
	data?: ConcurrentDetailItem[];
}

/**
 * 兼岗详情弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function ConcurrentDetailModal({
	open,
	title,
	onClose,
	data = EMPTY_CONCURRENT_DETAIL_LIST,
}: ConcurrentDetailModalProps) {
	return (
		<Modal title={title} open={open} onCancel={onClose} footer={null} width={560} centered>
			{data.length === 0 ? (
				<Empty description="暂无兼岗详情数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<div className="space-y-6">
					{data.map((item, index) => (
						<div
							key={[
								item.beginDate,
								item.endDate,
								item.cityCompanyCode,
								item.deptId,
								item.jobName,
								item.postName,
								item.type,
							]
								.filter(Boolean)
								.join("-")}
						>
							<SectionTitle
								title={
									<div className="flex items-center gap-1.5">
										<span>
											当日新增
											{getCompanyHistoryTypeLabel(item)}
											情况
										</span>
										<span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-800 text-xs leading-none text-gray-800">
											{index + 1}
										</span>
									</div>
								}
								className="mb-2"
							/>
							<ProDescriptions
								column={1}
								colon={false}
								styles={{
									label: {
										width: "7rem",
										display: "flex",
										justifyContent: "flex-end",
										textAlign: "right",
									},
								}}
								columns={[
									{
										title: "兼岗部门",
										render: () => getCompanyHistoryDepartment(item),
									},
									{
										title: "兼岗岗位",
										render: () => getCompanyHistoryJob(item),
									},
									{
										title: "兼岗职位",
										render: () => getCompanyHistoryPosition(item),
									},
									{
										title: "结束兼岗时间",
										render: () => item.endDate || "/",
									},
								]}
							/>
						</div>
					))}
				</div>
			)}
		</Modal>
	);
}
