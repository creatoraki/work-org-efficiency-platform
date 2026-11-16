import type { TagPositionNode } from "#src/api/tag-management/tag-center/types.js";
import { fetchTalentTagRuleList } from "#src/api/tag-management/rule-library";
import { BasicTable } from "#src/components/basic-table";
import { Drawer, Tooltip, Typography } from "antd";

const { Text } = Typography;

/**
 * 查看人才规则标签抽屉组件属性
 */
export interface ViewTalentTagRuleDrawerProps {
	/** 是否显示 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 标签规则ID */
	tagRuleId?: string;
	/** 岗位职位列表 */
	jobPositionList: TagPositionNode[];
}

/**
 * 查看人才规则标签抽屉组件
 *
 * @param props - 组件属性
 * @param props.open - 是否显示
 * @param props.onClose - 关闭回调
 * @param props.tagRuleId - 标签规则ID
 * @param props.jobPositionList - 岗位职位列表
 * @returns 抽屉组件
 */
export function ViewTalentTagRuleDrawer({
	open,
	onClose,
	tagRuleId,
	jobPositionList,
}: ViewTalentTagRuleDrawerProps) {
	// 表格列定义
	const columns = [
		{
			title: "员工工号",
			dataIndex: "empBadge",
			key: "empBadge",
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
		// {
		// 	title: "部门全编码",
		// 	dataIndex: "deptFullCode",
		// 	key: "deptFullCode",
		// },
		{
			title: "部门名称",
			dataIndex: "deptFullName",
			key: "deptFullName",
			width: 250,
			render: (value: any) => {
				if (!value || typeof value !== "string") {
					return "";
				}
				const fullName = value;
				const displayName = value.split("|").pop() || "";
				return (
					<Tooltip title={fullName}>
						<Text ellipsis>{displayName}</Text>
					</Tooltip>
				);
			},
		},
		{
			title: "标签值",
			dataIndex: "tagValue",
			key: "tagValue",
			width: 150,
			ellipsis: true,
		},
		// {
		// 	title: "岗位名称",
		// 	dataIndex: "jobName",
		// 	key: "jobName",
		// },
		// {
		// 	title: "职位名称",
		// 	dataIndex: "positionName",
		// 	key: "positionName",
		// },
		// {
		// 	title: "入职时间",
		// 	dataIndex: "entryTime",
		// 	key: "entryTime",
		// 	render: (value: Record<string, unknown>) => {
		// 		if (!value) {
		// 			return "-";
		// 		}
		// 		// 如果 entryTime 是时间戳或日期字符串，可以格式化显示
		// 		return String(value);
		// 	},
		// },
	];

	/**
	 * 处理数据请求
	 *
	 * @param params - 分页参数
	 * @param params.current - 当前页码
	 * @param params.pageSize - 每页数量
	 * @returns 数据响应
	 */
	const handleSearch = async (params: any) => {
		if (!tagRuleId) {
			return {
				data: [],
				success: true,
				total: 0,
			};
		}

		try {
			// 解构搜索参数
			const { current = 1, pageSize = 20 } = params;

			const response = await fetchTalentTagRuleList({
				tagRuleId,
				pageNum: current,
				pageSize,
				jobPositionList,
			});

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取标签人员数据失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	return (
		<Drawer
			title="查看规则标签"
			open={open}
			onClose={onClose}
			width="clamp(800px, 50vw, 80vw)"
			placement="right"
			closable={{ placement: "end" }}
			destroyOnHidden
		>
			<BasicTable
				columns={columns}
				request={handleSearch}
				size="small"
				rowKey={(record) => record.empBadge || String(record.name)}
				search={false}
				headerTitle={false}
				cardBordered={false}
				adaptive
				options={false}
			/>
		</Drawer>
	);
}
