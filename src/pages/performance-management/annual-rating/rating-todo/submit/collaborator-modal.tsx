import type { CollaboratorRow } from "#src/api/performance-management/submit";

import {
	useCollaboratorRows,
	useSaveCollaboratorRows,
} from "#src/pages/performance-management/annual-rating/rating-todo/submit/hooks/use-submit";
import { Button, message, Modal, Select, Table } from "antd";
import { useEffect, useMemo, useState } from "react";

/** 可配置填报人的候选列表（协作人配置范围与 PRD 一致） */
const FILLER_OPTIONS = [
	{ label: "李丽颖", value: "f-1" },
	{ label: "钱一唯", value: "f-2" },
	{ label: "周祥", value: "f-3" },
	{ label: "赵鹏", value: "f-4" },
];

/**
 * 协作人弹窗组件属性
 */
interface CollaboratorModalProps {
	/** 弹窗是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 保存成功回调 */
	onSaved: (rows: CollaboratorRow[]) => void;
}

/**
 * 协作人弹窗
 *
 * 按岗位分类配置协作填报人，仅可配置「项目员工(安全)」
 * 「项目员工(保洁绿化)」两类岗位的填报人。
 *
 * @param props - 组件属性
 * @param props.open - 弹窗是否可见
 * @param props.onClose - 关闭回调
 * @param props.onSaved - 保存成功回调
 * @returns 协作人弹窗组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function CollaboratorModal({ open, onClose, onSaved }: CollaboratorModalProps) {
	const { data, isLoading } = useCollaboratorRows(open);
	const saveMutation = useSaveCollaboratorRows();
	const [rows, setRows] = useState<CollaboratorRow[]>([]);

	/**
	 * 数据回显
	 */
	useEffect(() => {
		if (data) {
			setRows(data);
		}
	}, [data]);

	/**
	 * 修改某行的填报人
	 */
	const handleFillerChange = (key: string, fillerId: string | undefined) => {
		const option = FILLER_OPTIONS.find((item) => item.value === fillerId);
		setRows((prev) =>
			prev.map((row) =>
				row.key === key ? { ...row, fillerId, fillerName: option?.label } : row,
			),
		);
	};

	/**
	 * 保存协作人配置
	 */
	const handleOk = () => {
		saveMutation.mutate(rows, {
			onSuccess: () => {
				message.success("协作人配置已保存");
				onSaved(rows);
				onClose();
			},
		});
	};

	const columns = useMemo(
		() => [
			{
				title: "岗位分类",
				dataIndex: "positionCategory",
				key: "positionCategory",
				width: 230,
			},
			{ title: "人数(人)", dataIndex: "count", key: "count", width: 76 },
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 120,
				render: (value: string) => (
					<div className="flex items-center gap-1">
						<span className="size-1.5 rounded-full bg-[#FF7D00]" />
						<span className="text-[#606266]">{value}</span>
					</div>
				),
			},
			{
				title: (
					<span>
						<span className="text-[#F5222D]">*</span>填报人
					</span>
				),
				dataIndex: "fillerId",
				key: "fillerId",
				width: 230,
				render: (value: string | undefined, record: CollaboratorRow) => (
					<Select
						allowClear
						className="w-full"
						placeholder="请选择"
						options={FILLER_OPTIONS}
						value={value}
						onChange={(next) => handleFillerChange(record.key, next)}
					/>
				),
			},
		],
		[],
	);

	return (
		<Modal
			centered
			title="协作人"
			open={open}
			onCancel={onClose}
			// 设计稿 node 10594:461291：弹窗 704×334（标题 48 + 内容 230 + 底栏 56）
			width={704}
			loading={isLoading}
			styles={{ header: { padding: "12px 24px" } }}
			footer={
				<div className="flex justify-end gap-3">
					<Button onClick={onClose}>取消</Button>
					<Button
						type="primary"
						className="bg-[#0075FF]"
						loading={saveMutation.isPending}
						onClick={handleOk}
					>
						确定
					</Button>
				</div>
			}
		>
			{/* 设计稿：表格上方三行说明文案，14px/22 #606266，与表格间距 12px */}
			<div className="mb-3 text-sm leading-[22px] text-[#606266]">
				<p>本部门存在项目员工(安全)/项目员工(保洁绿化)，可为下列岗位类别配置协作填报人。</p>
				<p>
					·协作填报人提交后，只在他的待办里看到并填报所负责岗位类别的员工，提报名单「填报人」随之更新。
				</p>
				<p>·该功能模块，仅可提交一次，提交后不可再修改，请确认无误后进行提交。</p>
			</div>
			<Table
				columns={columns}
				dataSource={rows}
				pagination={false}
				rowKey="key"
				bordered
				size="middle"
				className="[&_.ant-table-thead>tr>th]:whitespace-nowrap [&_.ant-table-thead>tr>th]:bg-[#F5F7FA]"
			/>
		</Modal>
	);
}
