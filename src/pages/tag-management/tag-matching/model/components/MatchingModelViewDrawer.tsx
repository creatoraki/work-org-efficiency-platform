/**
 * 匹配模型查看抽屉组件
 *
 * 使用 Descriptions 展示匹配模型详情，仅用于只读查看
 */

import type { DescriptionsProps } from "antd";
import type { MatchingModelDetailResponse, TagWeightItem } from "../types";
import { fetchMatchingModelDetail } from "#src/api/tag-management/tag-matching/model";
import { SectionTitle } from "#src/components/section-title";
import { TagsCell } from "#src/pages/personnel-archive/components/tags-cell";
import { formatJobPositionNodeLabel } from "#src/utils";
import { useRequest } from "ahooks";
import { Descriptions, Drawer, Spin, Typography } from "antd";
import axios from "axios";
import { useMemo } from "react";
import TagWeightConfig from "./TagWeightConfig";

interface MatchingModelViewDrawerProps {
	/** 抽屉是否打开 */
	open: boolean;
	/** 模型ID */
	modelId?: string;
	/** 关闭抽屉回调 */
	onClose: () => void;
}

/**
 * 匹配模型查看抽屉
 */
export default function MatchingModelViewDrawer({
	open,
	modelId,
	onClose,
}: MatchingModelViewDrawerProps) {
	// 加载模型详情
	const { data: detailData, loading } = useRequest(
		async () => {
			if (!modelId) return null;
			const result = await fetchMatchingModelDetail(modelId);
			return result as MatchingModelDetailResponse;
		},
		{
			ready: open && !!modelId,
			refreshDeps: [modelId],
			onError: (error) => {
				if (axios.isCancel(error)) {
					return;
				}
				console.error("获取模型详情失败:", error);
			},
		},
	);

	// 处理岗位-职位-职级显示
	const jobPostTags = useMemo(() => {
		if (!detailData?.jobPostIdList || !Array.isArray(detailData.jobPostIdList)) {
			return [];
		}
		return detailData.jobPostIdList.map((node) => formatJobPositionNodeLabel(node));
	}, [detailData?.jobPostIdList]);

	// 处理标签权重数据
	const tagWeights: TagWeightItem[] = useMemo(() => {
		if (!detailData?.weightList) return [];
		return detailData.weightList.map((weight, index) => ({
			id: String(weight.id),
			tagId: String(weight.tagId),
			tagName: weight.tagName,
			weight: weight.weight,
			isVeto: weight.veto === 1,
			vetoTagValue: weight.vetoTagValue,
			order: index,
		}));
	}, [detailData?.weightList]);

	// 组织名称显示
	const orgNameDisplay = useMemo(() => {
		if (!detailData?.orgId) return "-";

		return detailData.orgName || "⚠️组织名称数据缺失";
	}, [detailData]);

	const descriptionItems = useMemo<DescriptionsProps["items"]>(
		() => [
			{
				key: "name",
				label: "模型名称",
				children: detailData?.name || "-",
			},
			{
				key: "remark",
				label: "模型描述",
				children: (
					<Typography.Paragraph
						ellipsis={{
							rows: 3,
							expandable: true,
							symbol: "展开",
						}}
						style={{ marginBottom: 0 }}
					>
						{detailData?.remark || "-"}
					</Typography.Paragraph>
				),
			},
			{
				key: "orgId",
				label: "匹配组织",
				children: (
					<Typography.Paragraph
						ellipsis={{ rows: 2, tooltip: true }}
						style={{ marginBottom: 0 }}
					>
						{orgNameDisplay}
					</Typography.Paragraph>
				),
			},
			{
				key: "jobPostIdList",
				label: "岗位-职位-职级",
				children: <TagsCell tags={jobPostTags} separator="、" />,
			},
		],
		[detailData, jobPostTags, orgNameDisplay],
	);

	return (
		<Drawer
			title="查看匹配模型"
			open={open}
			onClose={onClose}
			width="52.5rem"
			placement="right"
			closable={{ placement: "end" }}
			destroyOnHidden
		>
			<Spin spinning={loading}>
				{detailData ? (
					<div className="space-y-6">
						{/* 配置基础信息 */}
						<div>
							<SectionTitle title="配置基础信息" className="mb-4" />
							<Descriptions
								column={1}
								colon={false}
								items={descriptionItems}
								styles={{
									label: {
										width: "7.5rem",
										display: "flex",
										justifyContent: "flex-end",
										textAlign: "right",
									},
								}}
							/>
						</div>

						{/* 配置模型 */}
						<div>
							<SectionTitle title="配置模型" className="mb-4" />

							{/* 标签权重配置 */}
							<div className="mb-4">
								<div className="mb-2 flex items-center justify-start gap-2">
									<Typography.Text type="danger" className="mr-1">
										*
									</Typography.Text>
									<Typography.Text className="flex-shrink-0 text-sm font-medium">
										标签权重
									</Typography.Text>
								</div>
								<TagWeightConfig value={tagWeights} readonly />
							</div>
						</div>
					</div>
				) : (
					<div className="flex h-40 items-center justify-center text-gray-400">
						暂无数据
					</div>
				)}
			</Spin>
		</Drawer>
	);
}
