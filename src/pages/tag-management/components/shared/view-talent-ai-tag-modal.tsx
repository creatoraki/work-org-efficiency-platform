import type { LabelDataItem } from "#src/api/tag-management/tag-center/ai-tag";
import { Descriptions, Modal, Table } from "antd";

/**
 * 查看 AI 打标人员弹窗组件属性
 */
export interface ViewTalentAiTagModalProps {
	/** 是否显示 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 标签描述 */
	tagDescription?: string;
	/** 数据源 */
	dataSource: LabelDataItem[];
	/** 总数 */
	total?: number;
	/** 当前页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
	/** 加载状态 */
	loading?: boolean;
	/** 分页变更回调 */
	onPageChange?: (pageNum: number, pageSize: number) => void;
}

/**
 * 查看 AI 打标人员弹窗组件。
 *
 * 展示 AI 打标命中的人员明细，含标签描述与分页表格。
 *
 * @param props - 组件属性
 * @param props.open - 是否显示
 * @param props.onClose - 关闭回调
 * @param props.tagDescription - 标签描述
 * @param props.dataSource - 表格数据源
 * @param props.total - 总条数
 * @param props.pageNum - 当前页码
 * @param props.pageSize - 每页数量
 * @param props.loading - 加载状态
 * @param props.onPageChange - 分页变更回调
 * @returns 弹窗组件
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function ViewTalentAiTagModal({
	open,
	onClose,
	tagDescription,
	dataSource,
	total = 0,
	pageNum = 1,
	pageSize = 20,
	loading = false,
	onPageChange,
}: ViewTalentAiTagModalProps) {
	const columns = [
		{
			title: "工号",
			dataIndex: "workNo",
			key: "workNo",
			width: 120,
			ellipsis: true,
		},
		{
			title: "姓名",
			dataIndex: "name",
			key: "name",
			width: 100,
			ellipsis: true,
		},
		{
			title: "组织",
			dataIndex: "deptName",
			key: "deptName",
			width: 180,
			ellipsis: true,
		},
		{
			title: "标签值",
			dataIndex: "labelValue",
			key: "labelValue",
			width: 150,
			ellipsis: true,
		},
	];

	return (
		<Modal
			title={"查看AI打标人员"}
			open={open}
			onCancel={onClose}
			footer={null}
			centered
			width="clamp(800px, 80vw, 1000px)"
			destroyOnHidden
			styles={{
				body: {
					paddingBottom: 0,
				},
			}}
		>
			<Descriptions
				column={1}
				items={[
					{
						label: "标签描述",
						children: tagDescription || "-",
					},
				]}
				colon={false}
				className="mb-4"
			/>

			<Table
				columns={columns}
				dataSource={dataSource}
				loading={loading}
				pagination={{
					current: pageNum,
					pageSize,
					total,
					showSizeChanger: true,
					showTotal: (count) => `共 ${count} 人`,
					onChange: (page, size) => onPageChange?.(page, size),
				}}
				size="small"
				scroll={{ x: 500, y: "calc(70vh - 180px)" }}
				rowKey={(record, index) => `${record.workNo}-${index}`}
				bordered
			/>
		</Modal>
	);
}
