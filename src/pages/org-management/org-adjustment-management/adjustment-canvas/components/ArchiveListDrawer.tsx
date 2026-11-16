import type {
	OrgAdjustmentTaskArchiveCreatorOption,
	OrgAdjustmentTaskArchiveListItem,
	OrgAdjustmentTaskVersionDetailData,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { ColumnsType } from "antd/es/table";
import {
	fetchOrgAdjustmentTaskArchiveList,
	fetchOrgAdjustmentTaskVersionDetail,
	getSearchOptions_6,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Button, Drawer, Input, message, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";

interface ArchiveListDrawerProps {
	open: boolean;
	onClose: () => void;
	taskId?: number | null;
	onRestoreVersion?: (versionDetail: OrgAdjustmentTaskVersionDetailData) => void;
}

interface VersionOption {
	label: string;
	value: string;
}

function normalizeVersionOptions(source: Record<string, unknown>[] | undefined) {
	if (!Array.isArray(source)) {
		return [] as VersionOption[];
	}

	return source
		.map((item) => {
			const value = String(item.value ?? item.label ?? item.txtVer ?? item.name ?? "").trim();
			const label = String(item.label ?? item.txtVer ?? item.name ?? value).trim();
			if (!value) {
				return null;
			}

			return { label: label || value, value };
		})
		.filter((item): item is VersionOption => Boolean(item));
}

function formatArchiveTime(value: Record<string, unknown> | string | number) {
	if (typeof value === "string" || typeof value === "number") {
		const parsed = dayjs(value);
		return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : String(value);
	}

	const maybeDateTime = value as Record<string, unknown>;
	const year = Number(maybeDateTime.year ?? 0);
	const month = Number(maybeDateTime.monthValue ?? maybeDateTime.month ?? 0);
	const day = Number(maybeDateTime.dayOfMonth ?? maybeDateTime.day ?? 0);
	const hour = Number(maybeDateTime.hour ?? 0);
	const minute = Number(maybeDateTime.minute ?? 0);
	const second = Number(maybeDateTime.second ?? 0);

	if (year && month && day) {
		const parsed = dayjs(
			`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`,
		);
		return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : "--";
	}

	return "--";
}

export const ArchiveListDrawer: React.FC<ArchiveListDrawerProps> = ({
	open,
	onClose,
	taskId,
	onRestoreVersion,
}) => {
	const [loading, setLoading] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [restoringId, setRestoringId] = useState<number | null>(null);
	const [, setVersionOptions] = useState<VersionOption[]>([]);
	const [creatorOptions, setCreatorOptions] = useState<OrgAdjustmentTaskArchiveCreatorOption[]>(
		[],
	);
	const [txtVer, setTxtVer] = useState<string | undefined>();
	const [createBy, setCreateBy] = useState<string | undefined>();
	const [tableData, setTableData] = useState<OrgAdjustmentTaskArchiveListItem[]>([]);

	const fetchSearchOptions = async (currentTaskId: number) => {
		const response = await getSearchOptions_6(currentTaskId);
		setVersionOptions(normalizeVersionOptions(response.data?.txtVer));
		setCreatorOptions(response.data?.createByOptions ?? []);
	};

	const fetchArchiveList = async (
		currentTaskId: number,
		nextTxtVer?: string,
		nextCreateBy?: string,
	) => {
		setSearchLoading(true);
		try {
			const response = await fetchOrgAdjustmentTaskArchiveList({
				taskId: currentTaskId,
				txtVer: nextTxtVer,
				createBy: nextCreateBy,
			});
			setTableData(response.data ?? []);
		} finally {
			setSearchLoading(false);
		}
	};

	useEffect(() => {
		if (!open || !taskId) {
			return;
		}

		setLoading(true);
		setTxtVer(undefined);
		setCreateBy(undefined);
		Promise.all([fetchSearchOptions(taskId), fetchArchiveList(taskId)]).finally(() => {
			setLoading(false);
		});
	}, [open, taskId]);

	const handleSearch = () => {
		if (!taskId) {
			return;
		}
		fetchArchiveList(taskId, txtVer, createBy);
	};

	const handleReset = () => {
		if (!taskId) {
			return;
		}
		setTxtVer(undefined);
		setCreateBy(undefined);
		fetchArchiveList(taskId);
	};

	const handleRestoreVersion = async (record: OrgAdjustmentTaskArchiveListItem) => {
		setRestoringId(record.id);
		try {
			const response = await fetchOrgAdjustmentTaskVersionDetail(record.id);
			onRestoreVersion?.(response.data);
			message.success(`已恢复版本 ${record.txtVer}`);
			onClose();
		} finally {
			setRestoringId(null);
		}
	};

	const columns = useMemo<ColumnsType<OrgAdjustmentTaskArchiveListItem>>(() => {
		return [
			{
				title: "版本号",
				dataIndex: "txtVer",
				key: "txtVer",
				width: 150,
				render: (value: string, record, index) => (
					<Space size={6}>
						<a>{value}</a>
						{index === 0 && (
							<Tag
								style={{
									marginInlineEnd: 0,
									color: "#303133",
									background: "rgba(235, 238, 245, 1)",
									border: "none",
								}}
							>
								当前版本
							</Tag>
						)}
					</Space>
				),
			},
			{
				title: "保存人",
				dataIndex: "createByName",
				key: "createByName",
				width: 100,
			},
			{
				title: "保存日期",
				dataIndex: "createTime",
				key: "createTime",
				width: 180,
				render: (value: Record<string, unknown>) => formatArchiveTime(value),
			},
			{
				title: "说明",
				dataIndex: "remark",
				key: "remark",
				ellipsis: true,
			},
			{
				title: "操作",
				key: "action",
				width: 100,
				render: (_, record) => (
					<Button
						type="link"
						size="small"
						style={{ paddingInline: 0 }}
						loading={restoringId === record.id}
						onClick={() => handleRestoreVersion(record)}
					>
						恢复此版本
					</Button>
				),
			},
		];
	}, [restoringId]);

	return (
		<Drawer
			placement="right"
			width={660}
			open={open}
			title="存档列表"
			destroyOnHidden
			loading={loading}
			styles={{
				header: { padding: "16px 20px", borderBottom: "1px solid #F0F2F5" },
				body: { padding: "16px 16px 20px" },
			}}
			{...commonDrawerProps(onClose)}
		>
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Input
						value={txtVer}
						onChange={(event) => setTxtVer(event.target.value || undefined)}
						placeholder="支持模糊搜索"
						allowClear
						prefix="版本号"
						style={{ width: 220 }}
					/>
					<Select
						value={createBy}
						onChange={(value) => setCreateBy(value)}
						placeholder="请选择"
						allowClear
						prefix="保存人"
						style={{ width: 240 }}
						options={creatorOptions.map((item) => ({
							label: item.userName,
							value: String(item.userId),
						}))}
					/>
					<Button
						type="primary"
						loading={searchLoading}
						onClick={handleSearch}
						style={{ marginLeft: "auto" }}
					>
						查询
					</Button>
					<Button type="text" onClick={handleReset}>
						重置
					</Button>
				</div>

				<Table
					rowKey="id"
					columns={columns}
					dataSource={tableData}
					loading={searchLoading}
					size="small"
					pagination={{
						pageSize: 20,
						showSizeChanger: true,
						pageSizeOptions: ["10", "20", "50"],
						showTotal: (total) => `共${total}条`,
					}}
				/>
			</div>
		</Drawer>
	);
};

export default ArchiveListDrawer;
