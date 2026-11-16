import type { OrgTagRuleDataItem } from "#src/api/tag-management/rule-library";
import { fetchOrgTagRuleList } from "#src/api/tag-management/rule-library";
import { BasicTable } from "#src/components/basic-table";
import { Drawer, Tooltip, Typography } from "antd";

const { Text } = Typography;

/**
 * 查看组织规则标签抽屉组件属性
 */
export interface ViewOrgTagRuleDrawerProps {
	/** 是否显示 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 标签规则ID */
	tagRuleId?: string;
}

/**
 * 查看组织规则标签抽屉组件
 *
 * @param props - 组件属性
 * @param props.open - 是否显示
 * @param props.onClose - 关闭回调
 * @param props.tagRuleId - 标签规则ID
 * @returns 抽屉组件
 */
export function ViewOrgTagRuleDrawer({ open, onClose, tagRuleId }: ViewOrgTagRuleDrawerProps) {
	// 表格列定义
	const columns = [
		{
			title: "组织编码",
			dataIndex: "ancestorcode",
			key: "ancestorcode",
			width: 200,
			// ancestorcode: "GSXX0174|GSXX0613|GSXX0790|GSXX0270|GSXX1170|BMXX000001"
			render: (_: unknown, record: OrgTagRuleDataItem) => {
				// 显示最后一个编码，然后tooltip显示所有编码
				const lastCode = record.ancestorcode.split("|").pop() || "";
				return (
					<Tooltip title={record.ancestorcode}>
						<Text>{lastCode}</Text>
					</Tooltip>
				);
			},
		},
		{
			title: "组织名称",
			dataIndex: "ancestorname",
			key: "ancestorname",
			width: 200,
			render: (_: unknown, record: OrgTagRuleDataItem) => {
				const value = record.ancestorname;
				if (!value || typeof value !== "string") {
					return "-";
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
			title: "组织类型",
			dataIndex: "orgType",
			key: "orgType",
			width: 120,
			ellipsis: true,
		},
		{
			title: "标签值",
			dataIndex: "tagValue",
			key: "tagValue",
			width: 150,
			ellipsis: true,
		},
	];

	/**
	 * 处理数据请求
	 *
	 * @param params - 分页参数
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
			const { current = 1, pageSize = 20 } = params;

			const response = await fetchOrgTagRuleList({
				tagRuleId,
				pageNum: current,
				pageSize,
			});

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取组织标签规则数据失败:", error);
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
				rowKey={(record) => record.ancestorcode || String(record.ancestorname)}
				search={false}
				headerTitle={false}
				cardBordered={false}
				adaptive
				options={false}
				scroll={{ x: "1600" }}
			/>
		</Drawer>
	);
}
