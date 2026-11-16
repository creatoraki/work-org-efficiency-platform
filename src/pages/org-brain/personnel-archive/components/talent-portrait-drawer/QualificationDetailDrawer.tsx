/**
 * 资历抽屉
 *
 * 展示证书字典及当前综合评分
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { CertificateDictItem } from "#src/api/org-brain/personnel-archive";
import type { TableColumnsType } from "antd";
import { fetchQualificationCertificateDict } from "#src/api/org-brain/personnel-archive";

import ObtainedCertificateStarIcon from "#src/assets/small-icons/talent-portrait/obtained-certificate-star.svg?react";
import { SectionTitle } from "#src/components";
import { useQuery } from "@tanstack/react-query";
import { Alert, Drawer, Table, Typography } from "antd";
import { useMemo } from "react";

const { Text } = Typography;

/**
 * 证书字典表格行数据
 */
interface CertificateDictRow extends CertificateDictItem {
	/** 是否为已获证书 */
	obtained: boolean;
}

interface QualificationDetailDrawerProps {
	/** 是否打开 */
	open: boolean;
	/** 用户ID（用于查询证书字典，可选） */
	userId?: string | null;
	/** 已获证书列表（从父组件传入） */
	obtainedCertificates?: Array<{
		id: number;
		certId: string;
		certName: string;
		certGrade: string;
		certClass: string;
		certType: string;
		managementLevel: string;
		scaleScore: number;
	}>;
	/** 综合得分（从父组件传入） */
	score?: number;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 资历抽屉组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function QualificationDetailDrawer({
	open,
	obtainedCertificates: passedObtainedCertificates,
	score: passedScore,
	onClose,
}: QualificationDetailDrawerProps) {
	const {
		data: certificateDict = [],
		isLoading: certificateDictLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["org-brain-personnel-archive-certificate-dict"],
		queryFn: fetchQualificationCertificateDict,
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		enabled: open,
	});

	const obtainedCertificates = passedObtainedCertificates ?? [];
	const isLoading = certificateDictLoading;

	const remoteObtainedKeySet = useMemo(() => {
		if (obtainedCertificates.length === 0) {
			return new Set<string>();
		}
		return new Set(obtainedCertificates.map((cert) => String(cert.id)));
	}, [obtainedCertificates]);

	const score = passedScore ?? 0;

	// 表格数据：在证书字典基础上标记已获证书，并按”已获优先、分值递减”排序
	const tableData = useMemo<CertificateDictRow[]>(() => {
		return certificateDict
			.map((item, index) => ({
				...item,
				obtained: item.id !== undefined && remoteObtainedKeySet.has(String(item.id)),
				_index: index,
			}))
			.sort((a, b) => {
				// 已获证书优先
				if (a.obtained !== b.obtained) {
					return a.obtained ? -1 : 1;
				}
				// 已获证书按分值递减排序
				if (a.obtained && a.scaleScore !== b.scaleScore) {
					return b.scaleScore - a.scaleScore;
				}
				// 保持原顺序
				return a._index - b._index;
			})
			.map(({ _index, ...item }) => item);
	}, [certificateDict, remoteObtainedKeySet]);

	// 表格列定义
	const columns = useMemo<TableColumnsType<CertificateDictRow>>(
		() => [
			{
				title: "证书名称",
				dataIndex: "name",
				key: "name",
				width: 220,
				render: (_, record) => (
					<div className="flex items-center gap-1">
						<Text>{record.name}</Text>
						{record.obtained && (
							<span className="inline-flex shrink-0 items-center justify-center gap-0.5 rounded-[3px] bg-[#E3F7ED] px-1 text-xs leading-5 text-[#14B968]">
								<ObtainedCertificateStarIcon
									className="size-4 shrink-0"
									aria-hidden="true"
								/>
								<span>已获证书</span>
							</span>
						)}
					</div>
				),
			},
			{
				title: "证书等级",
				dataIndex: "level",
				key: "level",
				width: 140,
			},
			{
				title: "证书类别",
				dataIndex: "category",
				key: "category",
				width: 140,
			},
			{
				title: "证书类型",
				dataIndex: "type",
				key: "type",
				width: 140,
			},
			{
				title: "管理级别",
				dataIndex: "managementLevel",
				key: "managementLevel",
				width: 120,
				sorter: (a, b) => a.managementLevel.localeCompare(b.managementLevel, "zh-CN"),
			},
			{
				title: "刻度得分",
				dataIndex: "scaleScore",
				key: "scaleScore",
				width: 120,
				align: "center",
				sorter: (a, b) => a.scaleScore - b.scaleScore,
				render: (_, record) => <Text strong>{record.scaleScore}</Text>,
			},
		],
		[],
	);

	return (
		<Drawer
			title="资历"
			placement="right"
			width="clamp(900px, 70vw, 1200px)"
			open={open}
			onClose={onClose}
			destroyOnHidden
			closable={{ placement: "end" }}
		>
			{isError && (
				<Alert
					message="加载失败"
					description={error?.message || "证书字典加载失败，请稍后重试"}
					type="error"
					showIcon
					className="mb-4"
				/>
			)}

			<SectionTitle
				title="证书字典"
				extra={
					<Text type="secondary">
						当前综合评分：
						<Text strong className="ml-1">
							{score}分
						</Text>
					</Text>
				}
				className="mb-3 flex items-center gap-2"
			/>

			<Table<CertificateDictRow>
				aria-label="证书字典列表"
				columns={columns}
				dataSource={isLoading ? undefined : tableData}
				rowKey="id"
				loading={isLoading}
				pagination={false}
				scroll={{ y: "calc(100vh - 180px)" }}
				size="small"
			/>
		</Drawer>
	);
}
