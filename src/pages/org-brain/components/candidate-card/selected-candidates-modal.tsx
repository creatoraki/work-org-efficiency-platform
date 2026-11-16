import type { OrgBrainCandidateItem } from "#src/api/org-brain/candidate";

import type { ColumnsType } from "antd/es/table";
import { Modal, Table, Typography } from "antd";
import { useMemo } from "react";

const { Link, Text: TypographyText } = Typography;

/**
 * 统一解析已选候选人弹窗中的组织展示文案。
 *
 * 排兵布阵候选池优先展示后端新增的 orgFullName，
 * 其他场景继续兼容 orgName 字段。
 *
 * @param candidate - 候选人组织相关字段
 * @returns 组织展示文案
 * @author 王善能
 * @since 2026-07-10
 */
function resolveCandidateOrgText(
	candidate: Pick<OrgBrainCandidateItem, "orgFullName" | "orgName">,
) {
	return candidate.orgFullName || candidate.orgName || "/";
}

interface SelectedCandidatesModalProps {
	open: boolean;
	selectedCandidates: OrgBrainCandidateItem[];
	onCancel: () => void;
	onViewArchive?: (candidate: OrgBrainCandidateItem) => void;
	onDeselectCandidate?: (candidate: OrgBrainCandidateItem) => void;
	readonly?: boolean;
}

/**
 * 已选候选人弹窗。
 *
 * 统一承接人岗匹配与排兵布阵的已选候选人查看场景，负责表格字段展示与操作区渲染。
 *
 * @param props - 组件属性
 * @param props.open - 弹窗是否打开
 * @param props.selectedCandidates - 当前已选候选人列表
 * @param props.onCancel - 关闭弹窗回调
 * @param props.onViewArchive - 查看档案回调
 * @param props.onDeselectCandidate - 取消选中回调
 * @param props.readonly - 是否为只读模式
 * @returns 已选候选人弹窗 JSX
 * @author 王善能
 * @since 2026-06-24
 */
export function SelectedCandidatesModal({
	open,
	selectedCandidates,
	onCancel,
	onViewArchive,
	onDeselectCandidate,
	readonly = false,
}: SelectedCandidatesModalProps) {
	const columns = useMemo<ColumnsType<OrgBrainCandidateItem>>(() => {
		const baseColumns: ColumnsType<OrgBrainCandidateItem> = [
			{
				title: "工号",
				dataIndex: "empCode",
				key: "empCode",
				width: 120,
				render: (value: string | undefined) => value || "/",
			},
			{
				title: "候选人",
				dataIndex: "username",
				key: "username",
				width: 120,
				render: (_value, record) => record.username || "/",
			},
			{
				title: "性别",
				dataIndex: "sex",
				key: "sex",
				width: 80,
				render: (value: string | undefined) => value || "/",
			},
			{
				title: "匹配度",
				dataIndex: "matchScore",
				key: "matchScore",
				width: 110,
				render: (value: number) => `${value}%`,
			},
			{
				title: "组织",
				dataIndex: "orgName",
				key: "orgName",
				width: 220,
				render: (_value: string | undefined, record) => {
					const orgText = resolveCandidateOrgText(record);
					return (
						<TypographyText
							ellipsis={{ tooltip: orgText === "/" ? undefined : orgText }}
						>
							{orgText}
						</TypographyText>
					);
				},
			},
			{
				title: "岗位",
				dataIndex: "jobName",
				key: "jobName",
				width: 160,
				render: (value: string | undefined) => (
					<TypographyText ellipsis={{ tooltip: value ?? undefined }}>
						{value || "/"}
					</TypographyText>
				),
			},
			{
				title: "职位",
				dataIndex: "positionName",
				key: "positionName",
				width: 140,
				render: (value: string | undefined) => (
					<TypographyText ellipsis={{ tooltip: value ?? undefined }}>
						{value || "/"}
					</TypographyText>
				),
			},
			{
				title: "职级",
				dataIndex: "positionLevel",
				key: "positionLevel",
				width: 100,
				render: (value: string | undefined) => value || "/",
			},
			{
				title: "入职时间",
				dataIndex: "entryDate",
				key: "entryDate",
				width: 140,
				render: (value: string | undefined) => value || "/",
			},
		];
		if (!onViewArchive && (readonly || !onDeselectCandidate)) {
			return baseColumns;
		}
		return [
			...baseColumns,
			{
				title: "操作",
				key: "actions",
				width: readonly ? 120 : 200,
				fixed: "right",
				render: (_value, record) => (
					<div className="flex items-center gap-4 whitespace-nowrap">
						{onViewArchive ? (
							<Link onClick={() => onViewArchive(record)}>查看档案</Link>
						) : null}
						{!readonly && onDeselectCandidate ? (
							<Link onClick={() => onDeselectCandidate(record)}>取消选中</Link>
						) : null}
					</div>
				),
			},
		];
	}, [onDeselectCandidate, onViewArchive, readonly]);

	return (
		<Modal
			title={`已选候选人 ${selectedCandidates.length} 人`}
			open={open}
			centered
			onCancel={onCancel}
			footer={null}
			width={980}
			destroyOnHidden
		>
			<Table
				rowKey={(record) => String(record.userId ?? record.empCode ?? record.id)}
				dataSource={selectedCandidates}
				columns={columns}
				pagination={false}
				size="middle"
				scroll={{ x: "max-content" }}
				locale={{ emptyText: "暂无已选候选人" }}
			/>
		</Modal>
	);
}
